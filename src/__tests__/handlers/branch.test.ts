import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetRepoBranches,
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
    it("should return list of branches", async () => {
      const mockBranches = [
        { id: "refs/heads/main", displayId: "main", isDefault: true },
        { id: "refs/heads/feature", displayId: "feature", isDefault: false },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: mockBranches } });

      const result = await handleGetRepoBranches({
        projectKey: "PROJ",
        repoSlug: "my-repo",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        { params: {} }
      );
      expect(result).toEqual(mockBranches);
    });

    it("should filter branches by text", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [] } });

      await handleGetRepoBranches({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        filterText: "feature",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches",
        { params: { filterText: "feature" } }
      );
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
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      expect(result).toEqual(mockBranch);
    });
  });

  describe("handleDeleteBranch", () => {
    it("should delete a branch", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      const result = await handleDeleteBranch({
        projectKey: "PROJ",
        repoSlug: "my-repo",
        branchName: "refs/heads/feature",
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/my-repo/branches/refs%2Fheads%2Ffeature",
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      expect(result).toBe("Branch 'refs/heads/feature' has been deleted successfully.");
    });
  });
});