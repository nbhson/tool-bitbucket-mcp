import { describe, it, expect } from "vitest";
import { isLoopbackHost } from "../index.js";

describe("isLoopbackHost", () => {
  it("should accept loopback hosts", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("::1")).toBe(true);
    expect(isLoopbackHost("[::1]")).toBe(true);
    expect(isLoopbackHost("sub.localhost")).toBe(true);
  });

  it("should reject non-loopback hosts", () => {
    expect(isLoopbackHost("0.0.0.0")).toBe(false);
    expect(isLoopbackHost("192.168.1.10")).toBe(false);
    expect(isLoopbackHost("example.com")).toBe(false);
    expect(isLoopbackHost("")).toBe(false);
  });
});
