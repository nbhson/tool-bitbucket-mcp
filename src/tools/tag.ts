import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Tag Tools
// ==========================================

export const GET_REPO_TAGS_TOOL: Tool = {
  name: "get_repo_tags",
  description:
    "List tags in a Bitbucket Server repository. Returns a paged envelope { values, isLastPage, nextPageStart }.",
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
        description: "Optional filter to search tag names",
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
