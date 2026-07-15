import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearchCode, handleGrep } from "../../handlers/search.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("search handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/search",
        { params: { q: "const x" } }
      );
      expect(result).toEqual(mockResults.values);
    });
  });

  describe("handleGrep", () => {
    it("should perform regex search in content mode", async () => {
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

    it("should handle case-insensitive search", async () => {
      // Search API returns file containing "hello"
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "test.txt" }] },
      });
      // Raw file content
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

    it("should limit results by max_results", async () => {
      // Search API returns a file
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { values: [{ path: "data.txt" }] },
      });
      // Raw file with many matches
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
      // Glob branch: search API to find files
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          values: [{ path: "src/main.ts" }, { path: "test/main.test.ts" }],
        },
      });
      // Raw file content for src/main.ts
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: "content1",
      });
      // Raw file content for test/main.test.ts
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: "content2",
      });

      const result = await handleGrep({
        projectKey: "PROJ",
        repoSlug: "repo",
        query: "content",
        glob: "src/**",
      });

      expect(result.total).toBe(1);
      expect(result.results[0].file).toBe("src/main.ts");
    });

    it("should handle empty results gracefully", async () => {
      // Search API returns no files
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
});