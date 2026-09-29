import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetCurrentUser, handleSearchUsers } from "../../handlers/user.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("user handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the current user", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { name: "jdoe", slug: "jdoe", displayName: "Jane Doe", active: true },
    });

    const result = await handleGetCurrentUser();

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/users/current");
    expect(result.name).toBe("jdoe");
  });

  it("should search users with a filter and paging", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { values: [{ name: "jdoe" }], size: 1, isLastPage: true },
    });

    const result = await handleSearchUsers({ query: "jane" });

    expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/users", {
      params: { filter: "jane", limit: 25, start: 0 },
    });
    expect(result.values).toHaveLength(1);
  });
});
