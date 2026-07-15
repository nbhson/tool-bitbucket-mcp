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
    it("should return list of projects", async () => {
      const mockProjects = [
        { key: "PROJ1", name: "Project 1" },
        { key: "PROJ2", name: "Project 2" },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: mockProjects } });

      const result = await handleListProjects();

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects");
      expect(result).toEqual(mockProjects);
    });

    it("should return empty array when no projects exist", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [] } });

      const result = await handleListProjects();

      expect(result).toEqual([]);
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

      await expect(handleGetProjectDetail({ projectKey: "INVALID" })).rejects.toThrow(
        "Not Found"
      );
    });
  });
});