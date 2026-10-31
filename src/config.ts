import axios, { type AxiosInstance } from "axios";
import dotenv from "dotenv";
import https from "node:https";
import { z } from "zod";

import { SERVER_VERSION } from "./version.js";

// Load `.env` files first so BITBUCKET_* vars work out of the box.
dotenv.config();

// ============================================
// Custom Error Types
// ============================================

/** Base error class for all Bitbucket API errors */
export class BitbucketError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "BitbucketError";
  }
}

/** Error for configuration issues */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly issues?: z.ZodIssue[],
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** Error for validation issues */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Error for rate limiting */
export class RateLimitError extends BitbucketError {
  public readonly retryAfter?: number;

  constructor(message: string, statusCode: number, retryAfterMs?: number, originalError?: unknown) {
    super(message, statusCode, originalError);
    this.name = "RateLimitError";
    this.retryAfter = retryAfterMs;
  }
}

// ============================================
// Configuration Schema
// ============================================

const ConfigSchema = z
  .object({
    BITBUCKET_URL: z
      .string({ message: "BITBUCKET_URL is required" })
      .min(1, "BITBUCKET_URL must not be empty")
      .url("BITBUCKET_URL must be a valid URL (e.g., https://bitbucket.example.com)")
      .transform((v) => v.replace(/\/$/, "")),
    BITBUCKET_TOKEN: z
      .string({ message: "BITBUCKET_TOKEN is required" })
      .min(1, "BITBUCKET_TOKEN must not be empty"),
    /** Opt-in to self-signed certs. Never enabled by default. */
    BITBUCKET_INSECURE_SSL: z
      .enum(["true", "false", "1", "0"], {
        message: "BITBUCKET_INSECURE_SSL must be one of: true, false, 1, 0",
      })
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    BITBUCKET_TIMEOUT_MS: z.coerce
      .number({ message: "BITBUCKET_TIMEOUT_MS must be a number" })
      .int("BITBUCKET_TIMEOUT_MS must be an integer")
      .min(1000, "BITBUCKET_TIMEOUT_MS must be at least 1000ms")
      .max(300000, "BITBUCKET_TIMEOUT_MS must be at most 300000ms")
      .default(30000),
    BITBUCKET_MAX_RETRIES: z.coerce
      .number({ message: "BITBUCKET_MAX_RETRIES must be a number" })
      .int("BITBUCKET_MAX_RETRIES must be an integer")
      .min(0, "BITBUCKET_MAX_RETRIES must be at least 0")
      .max(5, "BITBUCKET_MAX_RETRIES must be at most 5")
      .default(2),
  })
  .strict();

export type BitbucketConfig = z.infer<typeof ConfigSchema>;

// ============================================
// Config Caching
// ============================================

let cachedConfig: BitbucketConfig | undefined;
let cachedClient: AxiosInstance | undefined;

/**
 * Pick only the environment variables the schema knows about.
 *
 * `ConfigSchema` is `.strict()`, so handing it the whole `process.env` would
 * make every unrelated system variable (PATH, HOME, ...) a validation error
 * and crash the server on startup. Filtering to `BITBUCKET_*` keys keeps the
 * "unknown option" guard for misspelled Bitbucket settings while ignoring
 * unrelated environment noise.
 */
function pickEnvVars(): Record<string, string | undefined> {
  const picked: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("BITBUCKET_") || key === "MCP_TRANSPORT") picked[key] = value;
  }
  return picked;
}

/**
 * Parse + validate env. Throws a human-readable Error when misconfigured.
 *
 * @throws {ConfigurationError} When required environment variables are missing or invalid
 */
export function getConfig(): BitbucketConfig {
  if (cachedConfig) return cachedConfig;
  const parsed = ConfigSchema.safeParse(pickEnvVars());
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const details = issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new ConfigurationError(
      `Invalid Bitbucket configuration:\n${details}\n\n` +
        `Set BITBUCKET_URL and BITBUCKET_TOKEN environment variables. ` +
        `See .env.example for all options.`,
      issues,
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

// ============================================
// Logging
// ============================================

/** Log levels for structured logging */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const levelStr = LogLevel[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${levelStr}] ${message}${metaStr}`;
}

export function logDebug(message: string, meta?: Record<string, unknown>): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.error(formatLog(LogLevel.DEBUG, message, meta));
  }
}

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.error(formatLog(LogLevel.INFO, message, meta));
  }
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.error(formatLog(LogLevel.WARN, message, meta));
  }
}

export function logError(message: string, meta?: Record<string, unknown>): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(formatLog(LogLevel.ERROR, message, meta));
  }
}

// ============================================
// HTTP Client
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format Bitbucket API error message from axios error
 */
export function formatApiError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: unknown } };
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (typeof data === "string") return `Bitbucket API error (HTTP ${status}): ${data}`;

    if (data && typeof data === "object" && "errors" in data) {
      const errors = (data as { errors?: Array<{ message?: string }> }).errors;
      const message = errors?.map((e) => e.message).join("; ") || String(data);
      return `Bitbucket API error (HTTP ${status}): ${message}`;
    }

    if (data && typeof data === "object" && "message" in data) {
      return `Bitbucket API error (HTTP ${status}): ${(data as { message: string }).message}`;
    }

    return `Bitbucket API error (HTTP ${status}): ${JSON.stringify(data)}`;
  }

  if (error instanceof Error) return error.message;
  return String(error);
}

function createClient(config: BitbucketConfig): AxiosInstance {
  logInfo("Initializing Bitbucket API client", {
    baseURL: config.BITBUCKET_URL,
    timeout: config.BITBUCKET_TIMEOUT_MS,
    maxRetries: config.BITBUCKET_MAX_RETRIES,
  });

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
    logWarn(
      "TLS certificate verification is DISABLED (BITBUCKET_INSECURE_SSL=true). Use only in trusted networks.",
    );
  }

  // Retry with exponential backoff on rate-limit / transient failures.
  client.interceptors.response.use(
    (response) => {
      logDebug("API response received", {
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
    async (error) => {
      const original = error?.config as
        (typeof error.config & { __retryCount?: number }) | undefined;
      const status = error?.response?.status as number | undefined;

      // Format error message for better debugging
      const errorMessage = formatApiError(error);
      logDebug("API error received", { status, message: errorMessage, url: original?.url });

      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!original || !retryable) {
        throw new BitbucketError(errorMessage, status, error);
      }

      original.__retryCount = (original.__retryCount ?? 0) + 1;
      if (original.__retryCount > config.BITBUCKET_MAX_RETRIES) {
        throw new RateLimitError(
          `Max retries (${config.BITBUCKET_MAX_RETRIES}) exceeded: ${errorMessage}`,
          status,
          undefined,
          error,
        );
      }

      const retryAfter = Number(error?.response?.headers?.["retry-after"]);
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** (original.__retryCount - 1), 10000);

      logWarn(`Retry ${original.__retryCount}/${config.BITBUCKET_MAX_RETRIES} after ${delay}ms`, {
        status,
        url: original.url,
      });

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
