import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleSearchCode,
  handleGrep,
  globToRegex,
  _resetSearchCacheForTests,
} from "../../handlers/search.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

const defaultBranch = () =>
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: { id: "refs/heads/main", displayId: "main" },
  });

describe("search handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetSearchCacheForTests();
  });

  describe("handleSearchCode", () => {
    it("should search for code and return results", async () => {
      const mockResults = {
        values: [{ path: "src/main.ts", content: "const x = 1;" }],
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResults });

      const result = await handleSearchCode({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "const x",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/PROJ/repos/repo/search", {
        params: { q: "const x", limit: 25 },
      });
      expect(result).toEqual(mockResults.values);
    });
  });

  describe("handleGrep", () => {
    it("should perform regex search in content mode", async () => {
      defaultBranch();
      // Search API returns file list
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "src/main.ts" }] },
      });
      // Raw file content
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: "line1\nconst x = 1;\nline3",
      });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "const x",
        mode: "content",
      });

      expect(result.total).toBe(1);
      expect(result.results[0].file).toBe("src/main.ts");
      expect(result.results[0].content).toContain("const x");
    });

    it("should reuse an explicit ref without resolving the default branch", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "a.ts" }] },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: "hello" });

      await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "hello",
        ref: "refs/heads/develop",
      });

      expect(apiClient.get).not.toHaveBeenCalledWith(
        expect.stringContaining("branches/default"),
        expect.anything(),
      );
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("/raw/a.ts"), {
        params: { at: "refs/heads/develop" },
      });
    });

    it("should handle case-insensitive search", async () => {
      defaultBranch();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "test.txt" }] },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: "HELLO WORLD",
      });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "hello",
        case_insensitive: true,
      });

      expect(result.total).toBe(1);
    });

    it("should reject invalid regex with a clear error", async () => {
      await expect(
        handleGrep({ projectKey: "PROJ", repoSlug: "repo", query: "([a-z" }),
      ).rejects.toThrow("Invalid regex query");
    });

    it("should reject invalid modes", async () => {
      await expect(
        handleGrep({ projectKey: "PROJ", repoSlug: "repo", query: "x", mode: "nope" }),
      ).rejects.toThrow("Invalid mode");
    });

    it("should limit results by max_results", async () => {
      defaultBranch();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "data.txt" }] },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: "a\nb\nc\nd\ne",
      });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: ".*",
        max_results: 2,
      });

      expect(result.total).toBe(2);
      expect(result.results.length).toBe(2);
    });

    it("should filter by glob pattern", async () => {
      defaultBranch();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          values: [{ path: "src/main.ts" }, { path: "test/main.test.ts" }],
        },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: "content1" });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: "content2" });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "content",
        glob: "src/**",
      });

      expect(result.total).toBe(1);
      expect(result.results[0].file).toBe("src/main.ts");
    });

    it("should count matches per file in count mode", async () => {
      defaultBranch();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "a.txt" }] },
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: "x\nx\nno\nx" });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "^x$",
        mode: "count",
      });

      expect(result.results).toEqual([{ file: "a.txt", matches: 3 }]);
    });

    it("should handle empty results gracefully", async () => {
      defaultBranch();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [] },
      });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "nonexistent",
      });

      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe("globToRegex", () => {
    it("should match ** across directories including zero dirs", () => {
      expect(globToRegex("src/**").test("src/file.ts")).toBe(true);
      expect(globToRegex("src/**").test("src/a/b/c.ts")).toBe(true);
      expect(globToRegex("**/*.ts").test("a/b/c.ts")).toBe(true);
      expect(globToRegex("**/*.ts").test("c.ts")).toBe(true);
    });

    it("should restrict single * to one path segment", () => {
      expect(globToRegex("*.ts").test("a.ts")).toBe(true);
      expect(globToRegex("*.ts").test("a/b.ts")).toBe(false);
      expect(globToRegex("src/*.ts").test("src/a/b.ts")).toBe(false);
    });
  });
});
