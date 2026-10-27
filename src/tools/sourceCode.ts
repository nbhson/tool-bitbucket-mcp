import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Source Code Tools
// ==========================================

export const GET_FILE_CONTENT_TOOL: Tool = {
  name: "get_file_content",
  description: "Get the raw content of a file from a Bitbucket Server repository",
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
      path: {
        type: "string",
        description: "The path to the file in the repository",
      },
      at: {
        type: "string",
        description: "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      },
    },
    required: ["projectKey", "repoSlug", "path"],
  },
};

export const GET_DIRECTORY_LISTING_TOOL: Tool = {
  name: "get_directory_listing",
  description: "List files and directories at a given path in a Bitbucket Server repository",
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
      path: {
        type: "string",
        description: "The directory path (empty string for root)",
      },
      at: {
        type: "string",
        description: "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      },
      limit: {
        type: "number",
        description: "Maximum number of entries per page (default: 500)",
      },
      start: {
        type: "number",
        description: "Zero-based start index for pagination",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const GET_FILE_DIFF_TOOL: Tool = {
  name: "get_file_diff",
  description: "Get the diff between two commits or branches for a specific file or all files",
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
      fromRef: {
        type: "string",
        description: "The source commit/branch/tag",
      },
      toRef: {
        type: "string",
        description: "The target commit/branch/tag",
      },
      path: {
        type: "string",
        description: "Optional specific file path to diff",
      },
    },
    required: ["projectKey", "repoSlug", "fromRef", "toRef"],
  },
};

export const GET_FILE_HISTORY_TOOL: Tool = {
  name: "get_file_history",
  description: "Get commit history for a single file. Returns a paged envelope of commits.",
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
      path: {
        type: "string",
        description: "The file path in the repository",
      },
      at: {
        type: "string",
        description: "The commit hash, branch name, or tag",
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
    required: ["projectKey", "repoSlug", "path"],
  },
};

export const GET_COMMIT_COMPARE_TOOL: Tool = {
  name: "get_commit_compare",
  description:
    "List commits between two refs (fromRef..toRef), useful for changelogs and release notes",
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
      fromRef: {
        type: "string",
        description: "The source commit/branch/tag (exclusive)",
      },
      toRef: {
        type: "string",
        description: "The target commit/branch/tag (inclusive)",
      },
      limit: {
        type: "number",
        description: "Maximum number of commits (default: 100)",
      },
    },
    required: ["projectKey", "repoSlug", "fromRef", "toRef"],
  },
};
