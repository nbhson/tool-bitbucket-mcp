import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetRepoTags } from "../../handlers/tag.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("tag handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list tags with pagination", async () => {
    const mockPage = {
      values: [{ displayId: "v1.0.0" }],
      size: 1,
      isLastPage: false,
      nextPageStart: 1,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await handleGetRepoTags({
      projectKey: "PROJ",
      repoSlug: "repo",
      limit: 1,
      start: 0,
    });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/PROJ/repos/repo/tags", {
      params: { limit: 1, start: 0 },
    });
    expect(result.values).toEqual([{ displayId: "v1.0.0" }]);
    expect(result.nextPageStart).toBe(1);
  });

  it("should pass filterText when provided", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [], isLastPage: true } });

    await handleGetRepoTags({ projectKey: "PROJ", repoSlug: "repo", filterText: "v2" });

    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
      params: { limit: 100, start: 0, filterText: "v2" },
    });
  });

  it("should omit filterText when not provided", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [], isLastPage: true } });

    await handleGetRepoTags({ projectKey: "PROJ", repoSlug: "repo" });

    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
      params: { limit: 100, start: 0 },
    });
  });
});
