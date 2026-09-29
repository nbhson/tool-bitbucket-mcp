import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetFileHistory,
  handleGetCommitCompare,
  handleGetDirectoryListing,
} from "../../handlers/sourceCode.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("sourceCode handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return file history as a paged envelope", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        values: [{ id: "abc", displayId: "abc", message: "fix", author: {} }],
        size: 1,
        isLastPage: true,
      },
    });

    const result = await handleGetFileHistory({
      projectKey: "P",
      repoSlug: "r",
      path: "src/a.ts",
    });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/P/repos/r/commits", {
      params: { path: "src/a.ts", limit: 25, start: 0 },
    });
    expect(result.values).toHaveLength(1);
  });

  it("should compare two refs", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        fromCommit: { id: "a", displayId: "a" },
        toCommit: { id: "b", displayId: "b" },
        values: [{ id: "b", message: "feat" }],
      },
    });

    const result = await handleGetCommitCompare({
      projectKey: "P",
      repoSlug: "r",
      fromRef: "v1",
      toRef: "v2",
    });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/P/repos/r/compare/commits", {
      params: { from: "v1", to: "v2", limit: 100 },
    });
    expect(result.values).toHaveLength(1);
  });

  it("should page directory listings", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { children: { values: [{ name: "a.ts", type: "FILE", path: "a.ts" }] } },
    });

    const result = await handleGetDirectoryListing({ projectKey: "P", repoSlug: "r" });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/P/repos/r/browse", {
      params: { limit: 500, start: 0 },
    });
    expect(result).toHaveLength(1);
  });
});
