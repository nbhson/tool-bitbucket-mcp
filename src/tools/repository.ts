import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Repository Tools
// ==========================================

export const LIST_REPOSITORIES_TOOL: Tool = {
  name: "list_repositories",
  description:
    "List repositories in a specific Bitbucket Server project. Returns a paged envelope { values, isLastPage, nextPageStart }.",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 100, max: 1000)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey"],
  },
};

export const SEARCH_REPOSITORIES_TOOL: Tool = {
  name: "search_repositories",
  description: "Find repositories by name or description across all accessible projects",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for repository name or description",
      },
      projectKey: {
        type: "string",
        description: "Optional project key to limit search scope",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results (default: 25)",
      },
    },
    required: ["query"],
  },
};

export const FORK_REPOSITORY_TOOL: Tool = {
  name: "fork_repository",
  description: "Fork a Bitbucket Server repository into a target project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The source project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The source repository slug",
      },
      targetProjectKey: {
        type: "string",
        description: "The project key to fork into",
      },
      name: {
        type: "string",
        description: "Optional name for the fork (defaults to source name)",
      },
      slug: {
        type: "string",
        description: "Optional slug for the fork",
      },
    },
    required: ["projectKey", "repoSlug", "targetProjectKey"],
  },
};

export const LIST_WEBHOOKS_TOOL: Tool = {
  name: "list_webhooks",
  description:
    "List webhooks configured on a Bitbucket Server repository. Returns a paged envelope.",
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
