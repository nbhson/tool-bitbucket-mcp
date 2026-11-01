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

  it("should coerce string numbers to numbers (client sends strings)", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { version: 1 } });
    await routeToolCall({
      method: "tools/call",
      params: {
        name: "get_pull_request_detail",
        arguments: { projectKey: "PROJ", repoSlug: "repo", pullRequestId: "42" },
      },
    } as never);

    // Handler thật chạy trên apiClient mock — kiểm tra URL chứa id đã coerce.
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/pull-requests/42"),
    );
  });

  it("should reject wrong-typed arguments with a detailed message", async () => {
    await expect(
      routeToolCall({
        method: "tools/call",
        params: {
          name: "grep",
          arguments: { projectKey: "PROJ", repoSlug: "repo", query: "x", mode: "bogus" },
        },
      } as never),
    ).rejects.toThrow(/Invalid arguments for 'grep':[\s\S]*mode/);
  });

  it("should have a schema for every registered tool", async () => {
    const { TOOL_SCHEMAS } = await import("../../handlers/schemas.js");
    for (const name of listToolNames()) {
      expect(TOOL_SCHEMAS[name as keyof typeof TOOL_SCHEMAS], `schema for ${name}`).toBeDefined();
    }
  });
});
