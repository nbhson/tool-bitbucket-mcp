import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Search Tools
// ==========================================

export const SEARCH_CODE_TOOL: Tool = {
  name: "search_code",
  description: "Search for code in a Bitbucket Server repository",
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
      query: {
        type: "string",
        description: "The search query string",
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 25)",
      },
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};

export const GREP_TOOL: Tool = {
  name: "grep",
  description:
    "Regex search file contents across a repository, like ripgrep over index-backed candidates. " +
    "Supports content/files/count modes, filename glob, path filtering, context lines, and case-insensitive search. " +
    "Defaults to the repository's default branch when ref is omitted.",
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
      query: {
        type: "string",
        description: "Regex pattern to search for in file contents",
      },
      ref: {
        type: "string",
        description: "Branch, tag, or commit SHA to search (default: default branch)",
      },
      mode: {
        type: "string",
        enum: ["content", "files", "count"],
        description:
          "Search mode: 'content' (matching lines with optional context), 'files' (list matching file paths), 'count' (match count per file)",
      },
      glob: {
        type: "string",
        description: "Filename glob filter (e.g., '*.ts', '*.java', 'src/**')",
      },
      path: {
        type: "string",
        description: "Directory path prefix to limit search scope (e.g., 'src/main')",
      },
      context_lines: {
        type: "number",
        description: "Number of context lines before/after each match in content mode (default: 0)",
      },
      case_insensitive: {
        type: "boolean",
        description: "Case-insensitive search (default: false)",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return (default: 200)",
      },
      max_files: {
        type: "number",
        description: "Maximum number of candidate files to fetch content for (default: 50)",
      },
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};
