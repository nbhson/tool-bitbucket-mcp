#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import https from "https";

// Bitbucket Server credentials and URL
const BITBUCKET_URL = process.env.BITBUCKET_URL; // e.g., https://eu-gitp-a001.iconcr.com
const BITBUCKET_TOKEN = process.env.BITBUCKET_TOKEN; // Personal Access Token (PAT)

if (!BITBUCKET_URL || !BITBUCKET_TOKEN) {
  console.error("Missing BITBUCKET_URL or BITBUCKET_TOKEN environment variables");
  process.exit(1);
}

// Remove trailing slash from URL if present
const baseUrl = BITBUCKET_URL.replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: baseUrl,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: {
    Authorization: `Bearer ${BITBUCKET_TOKEN}`,
    Accept: "application/json",
  },
});

const server = new Server(
  {
    name: "bitbucket-server-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const LIST_PROJECTS_TOOL: Tool = {
  name: "list_projects",
  description: "List all projects the user has access to in Bitbucket Server",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const LIST_REPOSITORIES_TOOL: Tool = {
  name: "list_repositories",
  description: "List repositories in a specific Bitbucket Server project",
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

const GET_PULL_REQUESTS_TOOL: Tool = {
  name: "get_pull_requests",
  description: "Get pull requests for a repository",
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
      state: {
        type: "string",
        description: "State of pull requests to retrieve (e.g., OPEN, MERGED, DECLINED, ALL)",
        default: "OPEN"
      }
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_FILE_CONTENT_TOOL: Tool = {
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
      }
    },
    required: ["projectKey", "repoSlug", "path"],
  },
};

// ==========================================
// Pull Request Operations
// ==========================================

const CREATE_PULL_REQUEST_TOOL: Tool = {
  name: "create_pull_request",
  description: "Create a new pull request in a Bitbucket Server repository",
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
      title: {
        type: "string",
        description: "The title of the pull request",
      },
      description: {
        type: "string",
        description: "The description/body of the pull request",
      },
      fromRef: {
        type: "string",
        description: "The source branch (e.g., refs/heads/feature-branch)",
      },
      toRef: {
        type: "string",
        description: "The target branch (e.g., refs/heads/main)",
      },
      reviewers: {
        type: "array",
        items: { type: "string" },
        description: "List of reviewer usernames",
      },
    },
    required: ["projectKey", "repoSlug", "title", "fromRef", "toRef"],
  },
};

const GET_PULL_REQUEST_DETAIL_TOOL: Tool = {
  name: "get_pull_request_detail",
  description: "Get detailed information about a specific pull request",
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
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

const MERGE_PULL_REQUEST_TOOL: Tool = {
  name: "merge_pull_request",
  description: "Merge a pull request in a Bitbucket Server repository",
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
      version: {
        type: "number",
        description: "The current version of the pull request (required for merge)",
      },
      message: {
        type: "string",
        description: "The merge commit message",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "version"],
  },
};

const DECLINE_PULL_REQUEST_TOOL: Tool = {
  name: "decline_pull_request",
  description: "Decline/reject a pull request in a Bitbucket Server repository",
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
      version: {
        type: "number",
        description: "The current version of the pull request",
      },
      message: {
        type: "string",
        description: "The decline message/reason",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "version"],
  },
};

const GET_PULL_REQUEST_COMMENTS_TOOL: Tool = {
  name: "get_pull_request_comments",
  description: "Get comments on a specific pull request",
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
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

// ==========================================
// Repository Operations
// ==========================================

const GET_REPO_BRANCHES_TOOL: Tool = {
  name: "get_repo_branches",
  description: "List branches in a Bitbucket Server repository",
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
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_REPO_COMMITS_TOOL: Tool = {
  name: "get_repo_commits",
  description: "List recent commits in a Bitbucket Server repository",
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
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_REPO_TAGS_TOOL: Tool = {
  name: "get_repo_tags",
  description: "List tags in a Bitbucket Server repository",
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
    },
    required: ["projectKey", "repoSlug"],
  },
};

// ==========================================
// Source Code Operations
// ==========================================

const GET_DIRECTORY_LISTING_TOOL: Tool = {
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
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_FILE_DIFF_TOOL: Tool = {
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

// ==========================================
// Project Operations
// ==========================================

const GET_PROJECT_DETAIL_TOOL: Tool = {
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

// ==========================================
// Branch Operations
// ==========================================

const CREATE_BRANCH_TOOL: Tool = {
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
    },
    required: ["projectKey", "repoSlug", "name", "startPoint"],
  },
};

const DELETE_BRANCH_TOOL: Tool = {
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
    },
    required: ["projectKey", "repoSlug", "branchName"],
  },
};

// ==========================================
// Code Review Operations
// ==========================================

const GET_PULL_REQUEST_DIFF_TOOL: Tool = {
  name: "get_pull_request_diff",
  description: "Get the diff of a pull request for code review",
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
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

// ==========================================
// Code Search Operations
// ==========================================

const SEARCH_CODE_TOOL: Tool = {
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
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};

const ADD_COMMENT_TOOL: Tool = {
  name: "add_comment",
  description: "Add a comment (general, reply, inline, or blocker task) to a pull request in Bitbucket Server",
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
        description: "Optional comment severity. Use 'BLOCKER' to create a task, 'NORMAL' for a standard comment",
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

const MANAGE_COMMENT_TOOL: Tool = {
  name: "manage_comment",
  description: "Manage a comment or task on a pull request (edit, delete, resolve, reopen, convert to task, convert to comment)",
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
        description: "The current version of the comment (required by Bitbucket Server for conflict prevention)",
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

// ==========================================
// Tier 1: Review Status & PR Update
// ==========================================

const SET_REVIEW_STATUS_TOOL: Tool = {
  name: "set_review_status",
  description: "Set review status on a pull request: APPROVED, NEEDS_WORK, or UNAPPROVED. One call, mutually exclusive states.",
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
      status: {
        type: "string",
        enum: ["APPROVED", "NEEDS_WORK", "UNAPPROVED"],
        description: "The review status to set (mutually exclusive)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "status"],
  },
};

const UPDATE_PULL_REQUEST_TOOL: Tool = {
  name: "update_pull_request",
  description: "Update an existing pull request (title, description, reviewers). Accepts version from a prior read for conflict prevention; auto-refetches and retries once on 409 conflicts.",
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
        description: "The pull request ID to update",
      },
      version: {
        type: "number",
        description: "Current version from a prior read (saves a fetch; auto-refetch + retry on 409)",
      },
      title: {
        type: "string",
        description: "New title for the pull request",
      },
      description: {
        type: "string",
        description: "New description/body for the pull request",
      },
      reviewers: {
        type: "array",
        items: { type: "string" },
        description: "New list of reviewer usernames (replaces existing reviewers)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

// ==========================================
// Tier 1: Grep (Regex Search)
// ==========================================

const GREP_TOOL: Tool = {
  name: "grep",
  description:
    "Regex search file contents across a repository, like ripgrep on a local clone. " +
    "Supports content/files/count modes, filename glob, path filtering, context lines, and case-insensitive search. " +
    "One archive download per repo+commit, streamed in constant memory, cached in-process.",
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
        description: "Search mode: 'content' (matching lines with optional context), 'files' (list matching file paths), 'count' (match count per file)",
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
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};

// ==========================================
// Tier 2: Repositories Search & Commit Details
// ==========================================

const SEARCH_REPOSITORIES_TOOL: Tool = {
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

const GET_COMMIT_DETAIL_TOOL: Tool = {
  name: "get_commit_detail",
  description: "Get details of a specific commit: commit metadata, changed file list, or full unified diff. Use detail level to control output size.",
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
        description: "Level of detail: 'metadata' (just commit info), 'files' (changed file list without diffs), 'full' (unified diff for each file)",
      },
    },
    required: ["projectKey", "repoSlug", "commitId"],
  },
};

const LIST_PR_COMMITS_TOOL: Tool = {
  name: "list_pr_commits",
  description: "List commits on a specific pull request with pagination",
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
      max_results: {
        type: "number",
        description: "Maximum number of commits to return (default: 100)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      LIST_PROJECTS_TOOL,
      LIST_REPOSITORIES_TOOL,
      GET_PULL_REQUESTS_TOOL,
      GET_FILE_CONTENT_TOOL,
      CREATE_PULL_REQUEST_TOOL,
      GET_PULL_REQUEST_DETAIL_TOOL,
      MERGE_PULL_REQUEST_TOOL,
      DECLINE_PULL_REQUEST_TOOL,
      GET_PULL_REQUEST_COMMENTS_TOOL,
      GET_REPO_BRANCHES_TOOL,
      GET_REPO_COMMITS_TOOL,
      GET_REPO_TAGS_TOOL,
      GET_DIRECTORY_LISTING_TOOL,
      GET_FILE_DIFF_TOOL,
      GET_PROJECT_DETAIL_TOOL,
      CREATE_BRANCH_TOOL,
      DELETE_BRANCH_TOOL,
      GET_PULL_REQUEST_DIFF_TOOL,
      SEARCH_CODE_TOOL,
      ADD_COMMENT_TOOL,
      MANAGE_COMMENT_TOOL,
      // Tier 1
      SET_REVIEW_STATUS_TOOL,
      UPDATE_PULL_REQUEST_TOOL,
      GREP_TOOL,
      // Tier 2
      SEARCH_REPOSITORIES_TOOL,
      GET_COMMIT_DETAIL_TOOL,
      LIST_PR_COMMITS_TOOL,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "list_projects") {
      const response = await apiClient.get('/rest/api/1.0/projects');
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    } 
    
    if (request.params.name === "list_repositories") {
      const { projectKey } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_requests") {
      const { projectKey, repoSlug, state = "OPEN" } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`, {
        params: { state }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_file_content") {
      const { projectKey, repoSlug, path, at } = request.params.arguments as any;
      const response = await apiClient.get(`/projects/${projectKey}/repos/${repoSlug}/raw/${path}`, {
        params: at ? { at } : {}
      });
      return {
        content: [{ type: "text", text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Pull Request Operations Handlers
    // ==========================================

    if (request.params.name === "create_pull_request") {
      const { projectKey, repoSlug, title, description, fromRef, toRef, reviewers } = request.params.arguments as any;
      const payload: any = {
        title,
        description: description || "",
        fromRef: { id: fromRef },
        toRef: { id: toRef },
      };
      if (reviewers && reviewers.length > 0) {
        payload.reviewers = reviewers.map((username: string) => ({ user: { name: username } }));
      }
      const response = await apiClient.post(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`, payload);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_request_detail") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "merge_pull_request") {
      const { projectKey, repoSlug, pullRequestId, version, message } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`,
        { version, message: message || "" },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "decline_pull_request") {
      const { projectKey, repoSlug, pullRequestId, version, message } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/decline`,
        { version, message: message || "" },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_request_comments") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "add_comment") {
      const { projectKey, repoSlug, pullRequestId, text, parentId, severity, anchor } = request.params.arguments as any;
      const payload: any = {
        text,
      };
      if (parentId) {
        payload.parent = { id: parentId };
      }
      if (severity) {
        payload.severity = severity;
      }
      if (anchor) {
        payload.anchor = {
          path: anchor.path,
          line: anchor.line,
          lineType: anchor.lineType || "ADDED",
          fileType: anchor.fileType || "TO",
          diffType: anchor.diffType || "EFFECTIVE",
        };
        if (anchor.fromHash) payload.anchor.fromHash = anchor.fromHash;
        if (anchor.toHash) payload.anchor.toHash = anchor.toHash;
        if (anchor.srcPath) payload.anchor.srcPath = anchor.srcPath;
      }
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`,
        payload
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "manage_comment") {
      const { projectKey, repoSlug, pullRequestId, commentId, version, action, text } = request.params.arguments as any;
      const baseUrl = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
      
      if (action === "delete") {
        await apiClient.delete(baseUrl, {
          params: { version }
        });
        return {
          content: [{ type: "text", text: `Comment/Task ${commentId} has been successfully deleted.` }],
        };
      }
      
      const payload: any = { version };
      if (action === "edit") {
        if (!text) {
          throw new Error("Parameter 'text' is required when action is 'edit'");
        }
        payload.text = text;
      } else if (action === "resolve") {
        payload.state = "RESOLVED";
      } else if (action === "reopen") {
        payload.state = "OPEN";
      } else if (action === "to_task") {
        payload.severity = "BLOCKER";
      } else if (action === "to_comment") {
        payload.severity = "NORMAL";
      } else {
        throw new Error(`Invalid action: ${action}`);
      }

      const response = await apiClient.put(baseUrl, payload);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Repository Operations Handlers
    // ==========================================

    if (request.params.name === "get_repo_branches") {
      const { projectKey, repoSlug, filterText } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`, {
        params: filterText ? { filterText } : {},
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_repo_commits") {
      const { projectKey, repoSlug, until, since } = request.params.arguments as any;
      const params: any = {};
      if (until) params.until = until;
      if (since) params.since = since;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`, { params });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_repo_tags") {
      const { projectKey, repoSlug, filterText } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/tags`, {
        params: filterText ? { filterText } : {},
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    // ==========================================
    // Source Code Operations Handlers
    // ==========================================

    if (request.params.name === "get_directory_listing") {
      const { projectKey, repoSlug, path, at } = request.params.arguments as any;
      const repoPath = path || "";
      const url = repoPath
        ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${repoPath}`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse`;
      const response = await apiClient.get(url, {
        params: at ? { at } : {},
      });
      const children = response.data.children?.values || [];
      const result = children.map((child: any) => ({
        name: child.name,
        type: child.type,
        path: child.path,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (request.params.name === "get_file_diff") {
      const { projectKey, repoSlug, fromRef, toRef, path } = request.params.arguments as any;
      let url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`;
      const params: any = { from: fromRef, to: toRef };
      if (path) params.path = path;
      const response = await apiClient.get(url, { params });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Project Operations Handlers
    // ==========================================

    if (request.params.name === "get_project_detail") {
      const { projectKey } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Branch Operations Handlers
    // ==========================================

    if (request.params.name === "create_branch") {
      const { projectKey, repoSlug, name, startPoint } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
        { name, startPoint },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "delete_branch") {
      const { projectKey, repoSlug, branchName } = request.params.arguments as any;
      const encodedBranch = encodeURIComponent(branchName);
      await apiClient.delete(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches/${encodedBranch}`,
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: `Branch '${branchName}' has been deleted successfully.` }],
      };
    }

    // ==========================================
    // Code Review Operations Handlers
    // ==========================================

    if (request.params.name === "get_pull_request_diff") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`,
        { headers: { Accept: "text/plain" } }
      );
      return {
        content: [{ type: "text", text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Code Search Operations Handlers
    // ==========================================

    if (request.params.name === "search_code") {
      const { projectKey, repoSlug, query } = request.params.arguments as any;
      const response = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
        { params: { q: query } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values || response.data, null, 2) }],
      };
    }

    // ==========================================
    // Tier 1: Review Status Handler
    // ==========================================

    if (request.params.name === "set_review_status") {
      const { projectKey, repoSlug, pullRequestId, status } = request.params.arguments as any;

      // First, fetch current PR version
      const prResponse = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`
      );
      const currentVersion = prResponse.data.version;

      // Map status to Bitbucket Server participant role state
      const stateMap: Record<string, string> = {
        APPROVED: "APPROVED",
        NEEDS_WORK: "UNAPPROVED",
        UNAPPROVED: "UNAPPROVED",
      };

      const payload = {
        version: currentVersion,
        reviewers: [
          {
            user: { name: prResponse.data.author.user?.name || prResponse.data.author.name },
            approved: status === "APPROVED",
            status: stateMap[status] || status,
          },
        ],
      };

      const response = await apiClient.put(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
        payload,
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Tier 1: Update Pull Request Handler
    // ==========================================

    if (request.params.name === "update_pull_request") {
      const { projectKey, repoSlug, pullRequestId, version, title, description, reviewers } = request.params.arguments as any;

      let currentVersion = version;

      // Auto-refetch version if not provided
      if (!currentVersion) {
        const prResponse = await apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`
        );
        currentVersion = prResponse.data.version;
      }

      const buildPayload = () => {
        const payload: any = { version: currentVersion };
        if (title) payload.title = title;
        if (description !== undefined) payload.description = description;
        if (reviewers) {
          payload.reviewers = reviewers.map((username: string) => ({ user: { name: username } }));
        }
        return payload;
      };

      try {
        const response = await apiClient.put(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
          buildPayload(),
          { headers: { "X-Atlassian-Token": "no-check" } }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (err: any) {
        // Retry once on 409 conflict
        if (err.response?.status === 409) {
          const prResponse = await apiClient.get(
            `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`
          );
          currentVersion = prResponse.data.version;
          const response = await apiClient.put(
            `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
            buildPayload(),
            { headers: { "X-Atlassian-Token": "no-check" } }
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
          };
        }
        throw err;
      }
    }

    // ==========================================
    // Tier 1: Grep (Regex Search) Handler
    // ==========================================

    if (request.params.name === "grep") {
      const { projectKey, repoSlug, query, ref, mode = "content", glob, path: searchPath, context_lines = 0, case_insensitive = false, max_results = 200 } = request.params.arguments as any;

      // Bitbucket Server has a built-in search API — use it to get file contents
      // Then apply regex locally. For large repos, we limit scope.
      const at = ref || "refs/heads/master";

      // Step 1: If glob or path provided, narrow down the file list via browse API
      let filePaths: string[] = [];

      if (glob || searchPath) {
        // Use the search API to find matching files
        const globPattern = glob || "**/*";
        const searchQuery = searchPath ? `${searchPath} ${globPattern}` : globPattern;
        const searchResponse = await apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
          { params: { q: "", type: "file", context: searchPath || "", limit: 500 } }
        );
        filePaths = (searchResponse.data.values || [])
          .map((r: any) => r.path?.toString || r.path || "")
          .filter((p: string) => p);
      }

      // Step 2: Build the regex
      const flags = case_insensitive ? "gi" : "g";
      const regex = new RegExp(query, flags);

      const results: any[] = [];
      let totalMatches = 0;

      // Helper: convert glob to simple regex
      const globToRegex = (g: string): RegExp => {
        const escaped = g
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*\*/g, ".*")
          .replace(/\*/g, "[^/]*")
          .replace(/\?/g, "[^/]");
        return new RegExp(`^${escaped}$`);
      };

      const globRegex = glob ? globToRegex(glob) : null;

      // Helper: search a single file content
      const searchFileContent = (filePath: string, content: string) => {
        if (max_results > 0 && totalMatches >= max_results) return;

        // Apply glob filter
        if (globRegex && !globRegex.test(filePath)) return;

        // Apply path filter
        if (searchPath && !filePath.startsWith(searchPath)) return;

        const lines = content.split("\n");
        const fileMatches: any[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          regex.lastIndex = 0;
          if (regex.test(line)) {
            if (mode === "files") {
              if (!results.find((r: any) => r.file === filePath)) {
                results.push({ file: filePath });
                totalMatches++;
              }
              break;
            }

            if (mode === "count") {
              fileMatches.push({ line: i + 1 });
            } else {
              // content mode with context
              const match: any = { file: filePath, line: i + 1, content: line.trim() };
              if (context_lines > 0) {
                const start = Math.max(0, i - context_lines);
                const end = Math.min(lines.length - 1, i + context_lines);
                match.context = lines.slice(start, end + 1).map((l: string, idx: number) => ({
                  line: start + idx + 1,
                  content: l,
                }));
              }
              fileMatches.push(match);
              totalMatches++;
            }

            if (max_results > 0 && totalMatches >= max_results) break;
          }
        }

        if (mode === "count" && fileMatches.length > 0) {
          results.push({ file: filePath, matches: fileMatches.length });
        } else if (mode === "content") {
          results.push(...fileMatches);
        }
      };

      if (filePaths.length > 0) {
        // Search specific files
        for (const fp of filePaths) {
          if (max_results > 0 && totalMatches >= max_results) break;
          try {
            const fileResponse = await apiClient.get(
              `/projects/${projectKey}/repos/${repoSlug}/raw/${fp}`,
              { params: { at } }
            );
            if (typeof fileResponse.data === "string") {
              searchFileContent(fp, fileResponse.data);
            }
          } catch {
            // Skip files that can't be read (binary, deleted, etc.)
          }
        }
      } else {
        // Broad search: use Bitbucket's search API to find files containing the term
        const searchResponse = await apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
          { params: { q: query, limit: Math.min(max_results, 100) } }
        );
        const searchResults = searchResponse.data.values || [];

        // Group by file and get content for each
        const filesToFetch = new Set<string>();
        for (const result of searchResults) {
          if (max_results > 0 && totalMatches >= max_results) break;
          const filePath = result.path || result.path?.toString;
          if (!filePath) continue;
          if (globRegex && !globRegex.test(filePath)) continue;
          if (searchPath && !filePath.startsWith(searchPath)) continue;
          filesToFetch.add(filePath);
        }

        for (const fp of filesToFetch) {
          if (max_results > 0 && totalMatches >= max_results) break;
          try {
            const fileResponse = await apiClient.get(
              `/projects/${projectKey}/repos/${repoSlug}/raw/${fp}`,
              { params: { at } }
            );
            if (typeof fileResponse.data === "string") {
              searchFileContent(fp, fileResponse.data);
            }
          } catch {
            // Skip files that can't be read
          }
        }

        // Also add files found by search that weren't content-matched
        if (mode === "files") {
          for (const result of searchResults) {
            if (totalMatches >= max_results) break;
            const filePath = result.path || result.path?.toString;
            if (!filePath) continue;
            if (globRegex && !globRegex.test(filePath)) continue;
            if (searchPath && !filePath.startsWith(searchPath)) continue;
            if (!results.find((r: any) => r.file === filePath)) {
              results.push({ file: filePath });
              totalMatches++;
            }
          }
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ total: totalMatches, results: results.slice(0, max_results) }, null, 2) }],
      };
    }

    // ==========================================
    // Tier 2: Search Repositories Handler
    // ==========================================

    if (request.params.name === "search_repositories") {
      const { query, projectKey, max_results = 25 } = request.params.arguments as any;

      let repos: any[] = [];

      if (projectKey) {
        // Search within a specific project
        const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`, {
          params: { limit: max_results },
        });
        repos = response.data.values || [];
        // Filter by query on client side since project-scoped search has limited filtering
        const lowerQuery = query.toLowerCase();
        repos = repos.filter((r: any) =>
          (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
          (r.slug && r.slug.toLowerCase().includes(lowerQuery)) ||
          (r.description && r.description.toLowerCase().includes(lowerQuery))
        );
      } else {
        // Cross-project search: list all projects and search repos within each
        const projectsResponse = await apiClient.get('/rest/api/1.0/projects', {
          params: { limit: 100 },
        });
        const projects = projectsResponse.data.values || [];
        const lowerQuery = query.toLowerCase();

        for (const project of projects) {
          if (repos.length >= max_results) break;
          try {
            const reposResponse = await apiClient.get(`/rest/api/1.0/projects/${project.key}/repos`, {
              params: { limit: 100 },
            });
            const matched = (reposResponse.data.values || []).filter((r: any) =>
              (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
              (r.slug && r.slug.toLowerCase().includes(lowerQuery)) ||
              (r.description && r.description.toLowerCase().includes(lowerQuery))
            );
            repos.push(...matched);
          } catch {
            // Skip projects we don't have access to
          }
        }
      }

      const summary = repos.slice(0, max_results).map((r: any) => ({
        project: r.project?.key,
        name: r.name,
        slug: r.slug,
        description: r.description || "",
        url: r.links?.clone?.[0]?.href || "",
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    }

    // ==========================================
    // Tier 2: Get Commit Detail Handler
    // ==========================================

    if (request.params.name === "get_commit_detail") {
      const { projectKey, repoSlug, commitId, detail = "metadata" } = request.params.arguments as any;

      // Always get the base commit info
      const commitResponse = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits/${commitId}`
      );
      const commit = commitResponse.data;

      if (detail === "metadata") {
        return {
          content: [{ type: "text", text: JSON.stringify(commit, null, 2) }],
        };
      }

      if (detail === "files") {
        // Get the list of changed files using diff endpoint
        const diffResponse = await apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`,
          { params: { from: `${commitId}^`, to: commitId } }
        );
        const diffs = diffResponse.data.diffs || [];
        const files = diffs.map((d: any) => ({
          path: d.destination?.toString || d.path,
          status: d.type,
          linesAdded: d.lineStats?.linesAdded || 0,
          linesRemoved: d.lineStats?.linesRemoved || 0,
          oldPath: d.source?.toString || null,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify({ commit: { id: commit.id, message: commit.message, author: commit.author }, files }, null, 2) }],
        };
      }

      if (detail === "full") {
        // Full unified diff for each changed file
        const diffResponse = await apiClient.get(
          `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`,
          { params: { from: `${commitId}^`, to: commitId } }
        );
        const diffs = diffResponse.data.diffs || [];
        const files = diffs.map((d: any) => ({
          path: d.destination?.toString || d.path,
          status: d.type,
          diff: d.hunks || d.content || "",
          oldPath: d.source?.toString || null,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify({ commit: { id: commit.id, message: commit.message, author: commit.author, date: commit.authorTimestamp }, files }, null, 2) }],
        };
      }

      throw new Error(`Invalid detail level: ${detail}. Use 'metadata', 'files', or 'full'.`);
    }

    // ==========================================
    // Tier 2: List PR Commits Handler
    // ==========================================

    if (request.params.name === "list_pr_commits") {
      const { projectKey, repoSlug, pullRequestId, max_results = 100 } = request.params.arguments as any;
      const response = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/commits`,
        { params: { limit: max_results } }
      );
      const commits = (response.data.values || response.data || []).map((c: any) => ({
        id: c.id,
        displayId: c.displayId,
        message: c.message,
        author: c.author,
        authorTimestamp: c.authorTimestamp,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(commits, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error: any) {
    console.error("Error executing tool", error.message);
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    return {
      content: [{ type: "text", text: `Error: ${errMessage}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bitbucket Server MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
