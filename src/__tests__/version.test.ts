import { describe, it, expect } from "vitest";
import { SERVER_VERSION, SERVER_NAME } from "../version.js";
import { pageParams, toPage } from "../pagination.js";

describe("version", () => {
  it("should match package.json", async () => {
    const pkg = await import("../../package.json");
    expect(SERVER_VERSION).toBe(pkg.version);
    expect(SERVER_NAME).toBe("bitbucket-server-mcp");
  });
});

describe("pagination helpers", () => {
  it("should apply safe defaults", () => {
    expect(pageParams({})).toEqual({ limit: 25, start: 0 });
    expect(pageParams({ limit: 10, start: 5 }, 100)).toEqual({ limit: 10, start: 5 });
  });

  it("should wrap paged responses in an envelope", () => {
    const page = toPage({ values: [1, 2], size: 2, isLastPage: false, nextPageStart: 2 }, 2, 0);
    expect(page).toEqual({
      values: [1, 2],
      size: 2,
      isLastPage: false,
      nextPageStart: 2,
      limit: 2,
      start: 0,
    });
  });

  it("should omit nextPageStart on the last page", () => {
    const page = toPage({ values: [], size: 0, isLastPage: true }, 25, 0);
    expect(page.nextPageStart).toBeUndefined();
  });
});
