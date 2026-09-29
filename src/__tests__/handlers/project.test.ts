import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleListProjects, handleGetProjectDetail } from "../../handlers/project.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("project handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleListProjects", () => {
    it("should return a paged envelope of projects", async () => {
      const mockProjects = [
        { key: "PROJ1", name: "Project 1" },
        { key: "PROJ2", name: "Project 2" },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: mockProjects, size: 2, isLastPage: true },
      });

      const result = await handleListProjects();

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects", {
        params: { limit: 25, start: 0 },
      });
      expect(result.values).toEqual(mockProjects);
      expect(result.isLastPage).toBe(true);
    });

    it("should forward pagination params and nextPageStart", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: [], size: 0, isLastPage: false, nextPageStart: 25 },
      });

      const result = await handleListProjects({ limit: 25, start: 25 });

      expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
        params: { limit: 25, start: 25 },
      });
      expect(result.nextPageStart).toBe(25);
    });
  });

  describe("handleGetProjectDetail", () => {
    it("should return project details", async () => {
      const mockProject = { key: "PROJ1", name: "Project 1", description: "Test" };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockProject });

      const result = await handleGetProjectDetail({ projectKey: "PROJ1" });

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/PROJ1");
      expect(result).toEqual(mockProject);
    });

    it("should propagate API errors", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Not Found"));

      await expect(handleGetProjectDetail({ projectKey: "INVALID" })).rejects.toThrow("Not Found");
    });
  });
});
