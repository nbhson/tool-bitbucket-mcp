import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Commit Tools
// ==========================================

export const GET_REPO_COMMITS_TOOL: Tool = {
  name: "get_repo_commits",
  description:
    "List recent commits in a Bitbucket Server repository. Returns a paged envelope { values, isLastPage, nextPageStart }.",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      until: {
        type: "string",
        description: "Commit SHA, branch, or tag to list commits until",
      },
      since: {
        type: "string",
        description: "Commit SHA to list commits since",
      },
      path: {
        type: "string",
        description: "Optional file path to filter commit history",
      },
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 25)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const GET_COMMIT_DETAIL_TOOL: Tool = {
  name: "get_commit_detail",
  description:
    "Get details of a specific commit: commit metadata, changed file list, or full unified diff. Use detail level to control output size.",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      commitId: {
        type: "string",
        description: "The commit SHA",
      },
      detail: {
        type: "string",
        enum: ["metadata", "files", "full"],
        description:
          "Level of detail: 'metadata' (just commit info), 'files' (changed file list without diffs), 'full' (unified diff for each file)",
      },
    },
    required: ["projectKey", "repoSlug", "commitId"],
  },
};
