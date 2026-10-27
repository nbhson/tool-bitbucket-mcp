import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Project Tools
// ==========================================

export const LIST_PROJECTS_TOOL: Tool = {
  name: "list_projects",
  description:
    "List all projects the user has access to in Bitbucket Server. Returns a paged envelope { values, isLastPage, nextPageStart }.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 25, max: 1000)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
  },
};

export const GET_PROJECT_DETAIL_TOOL: Tool = {
  name: "get_project_detail",
  description: "Get detailed information about a specific Bitbucket Server project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
    },
    required: ["projectKey"],
  },
};
