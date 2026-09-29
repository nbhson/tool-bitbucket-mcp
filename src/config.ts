import axios, { type AxiosInstance } from "axios";
import dotenv from "dotenv";
import https from "node:https";
import { z } from "zod";
import { SERVER_VERSION } from "./version.js";

// Load `.env` files first so BITBUCKET_* vars work out of the box.
dotenv.config();

const ConfigSchema = z.object({
  BITBUCKET_URL: z
    .string({ required_error: "BITBUCKET_URL is required" })
    .url("BITBUCKET_URL must be a valid URL (e.g. https://bitbucket.example.com)")
    .transform((v) => v.replace(/\/$/, "")),
  BITBUCKET_TOKEN: z
    .string({ required_error: "BITBUCKET_TOKEN is required" })
    .min(1, "BITBUCKET_TOKEN must not be empty"),
  /** Opt-in to self-signed certs. Never enabled by default. */
  BITBUCKET_INSECURE_SSL: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  BITBUCKET_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(30000),
  BITBUCKET_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
});

export type BitbucketConfig = z.infer<typeof ConfigSchema>;

let cachedConfig: BitbucketConfig | undefined;
let cachedClient: AxiosInstance | undefined;

/** Parse + validate env. Throws a human-readable Error when misconfigured. */
export function getConfig(): BitbucketConfig {
  if (cachedConfig) return cachedConfig;
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid Bitbucket configuration:\n${details}\n\n` +
        `Set BITBUCKET_URL and BITBUCKET_TOKEN environment variables. ` +
        `See .env.example for all options.`,
    );
  }
  cachedConfig = parsed.data;
  return cachedConfig;
}

/** Test-only hook to drop cached config/client between tests. */
export function _resetConfigForTests(): void {
  cachedConfig = undefined;
  cachedClient = undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(config: BitbucketConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.BITBUCKET_URL,
    timeout: config.BITBUCKET_TIMEOUT_MS,
    httpsAgent: new https.Agent({
      // Secure by default; only skip verification with explicit opt-in.
      rejectUnauthorized: !config.BITBUCKET_INSECURE_SSL,
    }),
    headers: {
      Authorization: `Bearer ${config.BITBUCKET_TOKEN}`,
      Accept: "application/json",
      "User-Agent": `bitbucket-mcp/${SERVER_VERSION}`,
      "X-Atlassian-Token": "no-check",
    },
  });

  if (config.BITBUCKET_INSECURE_SSL) {
    console.error(
      "[bitbucket-mcp] WARNING: TLS certificate verification is DISABLED " +
        "(BITBUCKET_INSECURE_SSL=true). Use only in trusted networks.",
    );
  }

  // Retry with exponential backoff on rate-limit / transient failures.
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error?.config as
        (typeof error.config & { __retryCount?: number }) | undefined;
      const status = error?.response?.status as number | undefined;
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!original || !retryable) throw error;
      original.__retryCount = (original.__retryCount ?? 0) + 1;
      if (original.__retryCount > config.BITBUCKET_MAX_RETRIES) throw error;
      const retryAfter = Number(error?.response?.headers?.["retry-after"]);
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** (original.__retryCount - 1), 10000);
      console.error(
        `[bitbucket-mcp] Retry ${original.__retryCount}/${config.BITBUCKET_MAX_RETRIES} ` +
          `after ${delay}ms (HTTP ${status})`,
      );
      await sleep(delay);
      return client.request(original);
    },
  );

  return client;
}

/**
 * Shared Bitbucket API client.
 *
 * Implemented as a lazy Proxy so that importing this module (e.g. in tests
 * or `--help`) never crashes the process. Configuration errors surface on
 * first actual API use — or earlier via `getConfig()` in `index.ts`.
 */
export const apiClient: AxiosInstance = new Proxy({} as AxiosInstance, {
  get(_target, prop, receiver) {
    if (prop === "__isProxy") return true;
    if (!cachedClient) cachedClient = createClient(getConfig());
    const value = Reflect.get(cachedClient, prop, receiver);
    return typeof value === "function" ? value.bind(cachedClient) : value;
  },
});
