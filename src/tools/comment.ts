import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Comment Tools
// ==========================================

export const ADD_COMMENT_TOOL: Tool = {
  name: "add_comment",
  description:
    "Add a comment (general, reply, inline, or blocker task) to a pull request in Bitbucket Server",
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
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
      text: {
        type: "string",
        description: "The content of the comment",
      },
      parentId: {
        type: "number",
        description: "Optional ID of a parent comment to reply to (threaded comment)",
      },
      severity: {
        type: "string",
        enum: ["NORMAL", "BLOCKER"],
        description:
          "Optional comment severity. Use 'BLOCKER' to create a task, 'NORMAL' for a standard comment",
      },
      anchor: {
        type: "object",
        description: "Optional anchoring information for an inline/code comment",
        properties: {
          path: {
            type: "string",
            description: "The file path in the repository",
          },
          line: {
            type: "number",
            description: "The line number in the file",
          },
          lineType: {
            type: "string",
            enum: ["ADDED", "REMOVED", "CONTEXT"],
            description: "The type of line in the diff (default: ADDED)",
          },
          fileType: {
            type: "string",
            enum: ["TO", "FROM"],
            description: "Which side of the diff the comment attaches to (default: TO)",
          },
          diffType: {
            type: "string",
            enum: ["COMMIT", "EFFECTIVE", "RANGE"],
            description: "The type of diff (default: EFFECTIVE)",
          },
          fromHash: {
            type: "string",
            description: "The source commit hash",
          },
          toHash: {
            type: "string",
            description: "The destination commit hash",
          },
          srcPath: {
            type: "string",
            description: "The source file path if renamed/moved",
          },
        },
        required: ["path", "line"],
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "text"],
  },
};

export const MANAGE_COMMENT_TOOL: Tool = {
  name: "manage_comment",
  description:
    "Manage a comment or task on a pull request (edit, delete, resolve, reopen, convert to task, convert to comment)",
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
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
      commentId: {
        type: "number",
        description: "The comment/task ID",
      },
      version: {
        type: "number",
        description:
          "The current version of the comment (required by Bitbucket Server for conflict prevention)",
      },
      action: {
        type: "string",
        enum: ["edit", "delete", "resolve", "reopen", "to_task", "to_comment"],
        description: "The action to perform on the comment or task",
      },
      text: {
        type: "string",
        description: "The updated text of the comment (required for 'edit')",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "commentId", "version", "action"],
  },
};
