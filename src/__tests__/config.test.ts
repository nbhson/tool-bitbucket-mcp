import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BitbucketError,
  ConfigurationError,
  RateLimitError,
  _resetConfigForTests,
  formatApiError,
  getConfig,
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
    const error = { response: { status: 404, data: "Not found" } };
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 404): Not found");
  });

  it("should join Bitbucket errors[].message", () => {
    const error = {
      response: {
        status: 400,
        data: { errors: [{ message: "bad ref" }, { message: "bad path" }] },
      },
    };
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 400): bad ref; bad path");
  });

  it("should use a top-level message when present", () => {
    const error = { response: { status: 403, data: { message: "forbidden" } } };
    expect(formatApiError(error)).toBe("Bitbucket API error (HTTP 403): forbidden");
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
});
