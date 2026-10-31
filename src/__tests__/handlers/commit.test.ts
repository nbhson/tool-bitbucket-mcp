import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetRepoCommits, handleGetCommitDetail } from "../../handlers/commit.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("commit handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleGetRepoCommits", () => {
    it("should list commits with pagination", async () => {
      const mockPage = { values: [{ id: "abc" }], size: 1, isLastPage: true };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

      const result = await handleGetRepoCommits({
        projectKey: "PROJ",
        repoSlug: "repo",
        limit: 10,
        start: 5,
      });

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/PROJ/repos/repo/commits", {
        params: { limit: 10, start: 5 },
      });
      expect(result.values).toEqual([{ id: "abc" }]);
      expect(result.isLastPage).toBe(true);
    });

    it("should pass until/since/path filters", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [], isLastPage: true } });

      await handleGetRepoCommits({
        projectKey: "PROJ",
        repoSlug: "repo",
        until: "main",
        since: "dev",
        path: "src/main.ts",
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
        params: {
          limit: 25,
          start: 0,
          until: "main",
          since: "dev",
          path: "src/main.ts",
        },
      });
    });
  });

  describe("handleGetCommitDetail", () => {
    const mockCommit = {
      id: "abc123",
      message: "feat: add thing",
      author: { name: "jdoe" },
      authorTimestamp: 1700000000,
    };

    it("should return metadata by default", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCommit });

      const result = await handleGetCommitDetail({
        projectKey: "PROJ",
        repoSlug: "repo",
        commitId: "abc123",
      });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/commits/abc123",
      );
      expect(result).toEqual(mockCommit);
    });

    it("should return changed file list for detail=files", async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (String(url).endsWith("/commits/abc123")) return { data: mockCommit };
        return {
          data: {
            diffs: [
              {
                type: "MODIFY",
                destination: { toString: "src/main.ts" },
                source: { toString: "src/old.ts" },
                lineStats: { linesAdded: 3, linesRemoved: 1 },
              },
            ],
          },
        };
      });

      const result = await handleGetCommitDetail({
        projectKey: "PROJ",
        repoSlug: "repo",
        commitId: "abc123",
        detail: "files",
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("/compare/diff"), {
        params: { from: "abc123^", to: "abc123" },
      });
      expect(result.files).toEqual([
        {
          path: "src/main.ts",
          status: "MODIFY",
          linesAdded: 3,
          linesRemoved: 1,
          oldPath: "src/old.ts",
        },
      ]);
    });

    it("should return unified diff for detail=full", async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (String(url).endsWith("/commits/abc123")) return { data: mockCommit };
        return {
          data: {
            diffs: [
              { type: "ADD", destination: { toString: "new.ts" }, hunks: [{ segments: [] }] },
            ],
          },
        };
      });

      const result = await handleGetCommitDetail({
        projectKey: "PROJ",
        repoSlug: "repo",
        commitId: "abc123",
        detail: "full",
      });

      expect(result.files).toEqual([
        { path: "new.ts", status: "ADD", diff: [{ segments: [] }], oldPath: null },
      ]);
      expect(result.commit).toEqual({
        id: "abc123",
        message: "feat: add thing",
        author: { name: "jdoe" },
        date: 1700000000,
      });
    });

    it("should reject invalid detail levels without calling the diff endpoint", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCommit });

      await expect(
        handleGetCommitDetail({
          projectKey: "PROJ",
          repoSlug: "repo",
          commitId: "abc123",
          detail: "everything",
        }),
      ).rejects.toThrow("Invalid detail level: everything");
      expect(apiClient.get).toHaveBeenCalledTimes(0);
    });
  });
});
