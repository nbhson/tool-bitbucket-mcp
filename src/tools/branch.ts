import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Branch Tools
// ==========================================

export const GET_REPO_BRANCHES_TOOL: Tool = {
  name: "get_repo_branches",
  description:
    "List branches in a Bitbucket Server repository. Returns a paged envelope { values, isLastPage, nextPageStart }.",
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
      filterText: {
        type: "string",
        description: "Optional filter to search branch names",
      },
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 100)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const GET_DEFAULT_BRANCH_TOOL: Tool = {
  name: "get_default_branch",
  description: "Get the default branch of a Bitbucket Server repository",
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
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const CREATE_BRANCH_TOOL: Tool = {
  name: "create_branch",
  description: "Create a new branch in a Bitbucket Server repository",
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
      name: {
        type: "string",
        description: "The name for the new branch",
      },
      startPoint: {
        type: "string",
        description: "The commit, branch, or tag to create the branch from (e.g., refs/heads/main)",
      },
      message: {
        type: "string",
        description: "Optional commit message if the start point is a commit",
      },
    },
    required: ["projectKey", "repoSlug", "name", "startPoint"],
  },
};

export const DELETE_BRANCH_TOOL: Tool = {
  name: "delete_branch",
  description: "Delete a branch from a Bitbucket Server repository",
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
      branchName: {
        type: "string",
        description: "The full branch name to delete (e.g., refs/heads/feature-branch)",
      },
      dryRun: {
        type: "boolean",
        description: "If true, only check whether the branch can be deleted (default: false)",
      },
    },
    required: ["projectKey", "repoSlug", "branchName"],
  },
};
