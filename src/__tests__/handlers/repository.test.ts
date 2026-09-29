import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleSearchRepositories,
  handleForkRepository,
  handleListWebhooks,
} from "../../handlers/repository.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("repository handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use the server-side name filter first", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { values: [{ name: "api", slug: "api", project: { key: "P" } }] },
    });

    const result = await handleSearchRepositories({ query: "api" });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/repos", {
      params: { name: "api", limit: 25 },
    });
    expect(result).toHaveLength(1);
  });

  it("should scope server-side search to a project key", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [] } });

    await handleSearchRepositories({ query: "zzz", projectKey: "P", max_results: 5 });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/P/repos", {
      params: { name: "zzz", limit: 5 },
    });
  });

  it("should fork into the target project", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { slug: "api-fork" } });

    const result = await handleForkRepository({
      projectKey: "SRC",
      repoSlug: "api",
      targetProjectKey: "DST",
      name: "api-fork",
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/rest/api/1.0/projects/SRC/repos/api/forks",
      { project: { key: "DST" }, name: "api-fork" },
      expect.any(Object),
    );
    expect(result).toEqual({ slug: "api-fork" });
  });

  it("should list webhooks as a paged envelope", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { values: [{ id: 1 }], size: 1, isLastPage: true },
    });

    const result = await handleListWebhooks({ projectKey: "P", repoSlug: "r" });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/projects/P/repos/r/webhooks", {
      params: { limit: 25, start: 0 },
    });
    expect(result.values).toHaveLength(1);
  });
});
