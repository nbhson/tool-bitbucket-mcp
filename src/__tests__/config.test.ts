import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AxiosInstance } from "axios";
import {
  BitbucketError,
  ConfigurationError,
  RateLimitError,
  _resetConfigForTests,
  _resetResponseCacheForTests,
  formatApiError,
  getConfig,
  withGetCache,
} from "../config.js";

describe("error classes", () => {
  it("should carry status code and original error on BitbucketError", () => {
    const cause = new Error("boom");
    const err = new BitbucketError("failed", 500, cause);
    expect(err.name).toBe("BitbucketError");
    expect(err.statusCode).toBe(500);
    expect(err.originalError).toBe(cause);
  });

  it("should carry retryAfter on RateLimitError", () => {
    const err = new RateLimitError("slow down", 429, 2000);
    expect(err.name).toBe("RateLimitError");
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(2000);
  });

  it("should carry issues on ConfigurationError", () => {
    const err = new ConfigurationError("bad config", []);
    expect(err.name).toBe("ConfigurationError");
    expect(err.issues).toEqual([]);
  });
});

describe("formatApiError", () => {
  it("should format a string response body", () => {
    const error = { response: { status: 500, data: "Not found" } };
    // 500 không có hint — message giữ nguyên dạng cũ.
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 500): Not found");
  });

  it("should join Bitbucket errors[].message", () => {
    const error = {
      response: {
        status: 500,
        data: { errors: [{ message: "bad ref" }, { message: "bad path" }] },
      },
    };
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 500): bad ref; bad path");
  });

  it("should use a top-level message when present", () => {
    const error = { response: { status: 500, data: { message: "forbidden" } } };
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 500): forbidden");
  });

  it("should JSON-stringify other object bodies", () => {
    const error = { response: { status: 500, data: { unexpected: true } } };
    expect(formatApiError(error)).toBe(
      `Bitbucket API error (HTTP 500): ${JSON.stringify({ unexpected: true })}`,
    );
  });

  it("should fall back to Error.message for non-axios errors", () => {
    expect(formatApiError(new Error("plain"))).toBe("plain");
    expect(formatApiError("raw string")).toBe("raw string");
  });

  it("should reuse the pre-formatted message of a wrapped BitbucketError", () => {
    expect(formatApiError(new BitbucketError("Bitbucket API error (HTTP 500): x", 500))).toBe(
      "Bitbucket API error (HTTP 500): x",
    );
  });

  it("should append an actionable hint for common HTTP statuses", () => {
    expect(formatApiError({ response: { status: 401, data: "Unauthorized" } })).toMatch(
      /Hint:.*token.*PAT/i,
    );
    expect(formatApiError({ response: { status: 403, data: "denied" } })).toMatch(
      /Hint:.*thiếu quyền/i,
    );
    expect(formatApiError({ response: { status: 404, data: "Not found" } })).toMatch(
      /Hint:.*projectKey\/repoSlug/i,
    );
    expect(formatApiError({ response: { status: 409, data: "conflict" } })).toMatch(
      /Hint:.*version/i,
    );
    expect(formatApiError({ response: { status: 429, data: "slow down" } })).toMatch(
      /Hint:.*rate limit/i,
    );
  });

  it("should keep the original message before the hint", () => {
    const message = formatApiError({ response: { status: 404, data: "Repo not found" } });
    expect(message).toMatch(/^Bitbucket API error \(HTTP 404\): Repo not found\nHint:/);
  });

  it("should not append a hint for uncommon statuses", () => {
    expect(formatApiError({ response: { status: 418, data: "teapot" } })).toBe(
      "Bitbucket API error (HTTP 418): teapot",
    );
  });
});

describe("getConfig validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    _resetConfigForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetConfigForTests();
  });

  it("should reject a missing token", () => {
    delete process.env.BITBUCKET_TOKEN;
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    expect(() => getConfig()).toThrow(ConfigurationError);
    expect(() => getConfig()).toThrow(/BITBUCKET_TOKEN/);
  });

  it("should reject an invalid URL", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "not-a-url";
    expect(() => getConfig()).toThrow(ConfigurationError);
  });

  it("should reject unknown (strict) env keys", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    process.env.BITBUCKET_EXTRA = "nope";
    expect(() => getConfig()).toThrow(/BITBUCKET_EXTRA/);
  });

  it("should strip a trailing slash from the URL", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com/";
    const config = getConfig();
    expect(config.BITBUCKET_URL).toBe("https://bitbucket.example.com");
  });

  it("should apply documented defaults", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    const config = getConfig();
    expect(config.BITBUCKET_INSECURE_SSL).toBe(false);
    expect(config.BITBUCKET_TIMEOUT_MS).toBe(30000);
    expect(config.BITBUCKET_MAX_RETRIES).toBe(2);
  });

  it("should coerce numeric and boolean env strings", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    process.env.BITBUCKET_TIMEOUT_MS = "45000";
    process.env.BITBUCKET_MAX_RETRIES = "3";
    process.env.BITBUCKET_INSECURE_SSL = "1";
    const config = getConfig();
    expect(config.BITBUCKET_TIMEOUT_MS).toBe(45000);
    expect(config.BITBUCKET_MAX_RETRIES).toBe(3);
    expect(config.BITBUCKET_INSECURE_SSL).toBe(true);
  });

  it("should cache the config between calls", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    expect(getConfig()).toBe(getConfig());
  });

  it("should reject out-of-range timeout values", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    process.env.BITBUCKET_TIMEOUT_MS = "100";
    expect(() => getConfig()).toThrow(/at least 1000ms/);
  });

  it("should default the GET cache TTL to 30s and accept 0 to disable", () => {
    process.env.BITBUCKET_TOKEN = "tok";
    process.env.BITBUCKET_URL = "https://bitbucket.example.com";
    expect(getConfig().BITBUCKET_CACHE_TTL_MS).toBe(30000);

    _resetConfigForTests();
    process.env.BITBUCKET_CACHE_TTL_MS = "0";
    expect(getConfig().BITBUCKET_CACHE_TTL_MS).toBe(0);
  });
});

describe("GET response cache", () => {
  /** Fake axios client đếm số lần gọi upstream. */
  function fakeClient(calls: string[]) {
    return {
      get: async (url: string, config?: { params?: unknown }) => {
        calls.push(`${url}:${JSON.stringify(config?.params ?? {})}`);
        return { data: { call: calls.length }, status: 200 };
      },
      post: async (url: string, data?: unknown) => ({ data: { ok: true, url, data }, status: 201 }),
      delete: async (url: string, config?: unknown) => ({ data: { ok: true, url, config } }),
    } as unknown as AxiosInstance;
  }

  afterEach(() => {
    _resetResponseCacheForTests();
  });

  it("should serve repeated GETs with the same URL+params from cache", async () => {
    const calls: string[] = [];
    const cached = withGetCache(fakeClient(calls), 30000);

    const first = await cached.get("/rest/api/1.0/projects");
    const second = await cached.get("/rest/api/1.0/projects");
    expect(calls).toHaveLength(1);
    expect(second).toEqual(first);
  });

  it("should distinguish different params and header Accept", async () => {
    const calls: string[] = [];
    const cached = withGetCache(fakeClient(calls), 30000);

    await cached.get("/repos", { params: { limit: 10 } });
    await cached.get("/repos", { params: { limit: 20 } });
    await cached.get("/repos", {
      params: { limit: 10 },
      headers: { Accept: "text/plain" },
    });
    expect(calls).toHaveLength(3);
  });

  it("should bust the cache when a mutating request runs", async () => {
    const calls: string[] = [];
    const cached = withGetCache(fakeClient(calls), 30000);

    await cached.get("/rest/api/1.0/projects");
    await cached.post("/rest/api/1.0/projects/PROJ/repos", {});
    await cached.get("/rest/api/1.0/projects");
    expect(calls).toHaveLength(2);
  });

  it("should not cache when TTL is 0", async () => {
    const calls: string[] = [];
    const cached = withGetCache(fakeClient(calls), 0);

    await cached.get("/x");
    await cached.get("/x");
    expect(calls).toHaveLength(2);
  });

  it("should expire entries after the TTL", async () => {
    vi.useFakeTimers();
    try {
      const calls: string[] = [];
      const cached = withGetCache(fakeClient(calls), 50);
      await cached.get("/x");
      vi.advanceTimersByTime(60);
      await cached.get("/x");
      expect(calls).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pass delete() config straight through (axios delete(url, config))", async () => {
    const calls: string[] = [];
    const cached = withGetCache(fakeClient(calls), 30000);
    const result = await cached.delete("/repos/1", { params: { version: 2 } });
    expect(result).toEqual({
      data: { ok: true, url: "/repos/1", config: { params: { version: 2 } } },
    });
  });
});
