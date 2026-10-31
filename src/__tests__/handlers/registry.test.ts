import { describe, it, expect, vi, beforeEach } from "vitest";
import { routeToolCall, listToolNames } from "../../handlers/index.js";
import { handleListProjects } from "../../handlers/project.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock("../../handlers/project.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../handlers/project.js")>();
  return {
    ...actual,
    handleListProjects: vi.fn(async () => ({ values: [], isLastPage: true })),
  };
});

import { apiClient } from "../../config.js";

describe("handler registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register every documented tool", () => {
    const names = listToolNames();
    expect(names).toContain("list_projects");
    expect(names).toContain("get_repo_branches");
    expect(names).toContain("create_pull_request");
    expect(names).toContain("search_code");
    expect(names).toContain("grep");
    // 39 tools documented in the README.
    expect(names.length).toBe(39);
  });

  it("should dispatch a known tool to its handler", async () => {
    const result = await routeToolCall({
      method: "tools/call",
      params: { name: "list_projects", arguments: {} },
    } as never);

    expect(handleListProjects).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ values: [], isLastPage: true });
  });

  it("should default missing arguments to an empty object", async () => {
    await routeToolCall({
      method: "tools/call",
      params: { name: "list_projects" },
    } as never);

    expect(handleListProjects).toHaveBeenCalledWith({});
  });

  it("should reject unknown tools with the list of valid tools", async () => {
    await expect(
      routeToolCall({
        method: "tools/call",
        params: { name: "not_a_tool", arguments: {} },
      } as never),
    ).rejects.toThrow(/^Unknown tool: not_a_tool\. Available tools: /);
  });

  it("should reject calls missing required arguments", async () => {
    await expect(
      routeToolCall({
        method: "tools/call",
        params: { name: "create_branch", arguments: { projectKey: "PROJ", repoSlug: "repo" } },
      } as never),
    ).rejects.toThrow("Missing required argument(s) for 'create_branch': name, startPoint");
  });

  it("should treat null the same as missing for required arguments", async () => {
    await expect(
      routeToolCall({
        method: "tools/call",
        params: { name: "get_project_detail", arguments: { projectKey: null } },
      } as never),
    ).rejects.toThrow("Missing required argument(s) for 'get_project_detail': projectKey");
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
