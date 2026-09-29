import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetRepoBranches,
  handleGetDefaultBranch,
  handleCreateBranch,
  handleDeleteBranch,
} from "../../handlers/branch.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("branch handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleGetRepoBranches", () => {
    it("should return a paged envelope of branches", async () => {
      const mockBranches = [
        { id: "refs/heads/main", displayId: "main", isDefault: true },
        { id: "refs/heads/feature", displayId: "feature", isDefault: false },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: mockBranches, size: 2, isLastPage: true },
      });

      const result = await handleGetRepoBranches({
        projectKey: "PROJ",
        repoSlug: "my-repo",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        { params: { limit: 100, start: 0 } },
      );
      expect(result.values).toEqual(mockBranches);
      expect(result.isLastPage).toBe(true);
    });

    it("should filter branches by text and honor pagination", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: [], size: 0, isLastPage: true },
      });

      await handleGetRepoBranches({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        filterText: "feature",
        limit: 10,
        start: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        { params: { filterText: "feature", limit: 10, start: 10 } },
      );
    });
  });

  describe("handleGetDefaultBranch", () => {
    it("should return the default branch", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: "refs/heads/main", displayId: "main" },
      });

      const result = await handleGetDefaultBranch({
        projectKey: "PROJ",
        repoSlug: "my-repo",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches/default",
      );
      expect(result.displayId).toBe("main");
    });
  });

  describe("handleCreateBranch", () => {
    it("should create a new branch", async () => {
      const mockBranch = { id: "refs/heads/feature", displayId: "feature" };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockBranch });

      const result = await handleCreateBranch({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        name: "refs/heads/feature",
        startPoint: "refs/heads/main",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        { name: "refs/heads/feature", startPoint: "refs/heads/main" },
        { headers: { "X-Atlassian-Token": "no-check" } },
      );
      expect(result).toEqual(mockBranch);
    });
  });

  describe("handleDeleteBranch", () => {
    it("should delete a branch via the name query param (slashes intact)", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });

      const result = await handleDeleteBranch({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        branchName: "refs/heads/feature",
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        {
          params: { name: "refs/heads/feature" },
          headers: { "X-Atlassian-Token": "no-check" },
        },
      );
      expect(result).toBe("Branch 'refs/heads/feature' has been deleted successfully.");
    });

    it("should support dryRun", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { canDelete: true } });

      const result = await handleDeleteBranch({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        branchName: "refs/heads/feature",
        dryRun: true,
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: { name: "refs/heads/feature", dryRun: true } }),
      );
      expect(result).toEqual({ canDelete: true });
    });
  });
});
