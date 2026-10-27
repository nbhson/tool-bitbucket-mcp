import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// User Tools
// ==========================================

export const GET_CURRENT_USER_TOOL: Tool = {
  name: "get_current_user",
  description:
    "Get the Bitbucket user bound to the configured token. Use it to resolve reviewer names.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const SEARCH_USERS_TOOL: Tool = {
  name: "search_users",
  description: "Search Bitbucket users by name, slug, or email. Returns a paged envelope.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for user display name, slug, or email",
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
    required: ["query"],
  },
};
