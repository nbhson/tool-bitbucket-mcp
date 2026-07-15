import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Project Tools
// ==========================================

export const LIST_PROJECTS_TOOL: Tool = {
  name: "list_projects",
  description: "List all projects the user has access to in Bitbucket Server",
  inputSchema: {
    type: "object",
    properties: {},
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

// ==========================================
// Repository Tools
// ==========================================

export const LIST_REPOSITORIES_TOOL: Tool = {
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

// ==========================================
// Branch Tools
// ==========================================

export const GET_REPO_BRANCHES_TOOL: Tool = {
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
    },
    required: ["projectKey", "repoSlug", "branchName"],
  },
};

// ==========================================
// Commit Tools
// ==========================================

export const GET_REPO_COMMITS_TOOL: Tool = {
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

// ==========================================
// Tag Tools
// ==========================================

export const GET_REPO_TAGS_TOOL: Tool = {
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
// Pull Request Tools
// ==========================================

export const GET_PULL_REQUESTS_TOOL: Tool = {
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
        description:
          "State of pull requests to retrieve (e.g., OPEN, MERGED, DECLINED, ALL)",
        default: "OPEN",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const CREATE_PULL_REQUEST_TOOL: Tool = {
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

export const GET_PULL_REQUEST_DETAIL_TOOL: Tool = {
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

export const MERGE_PULL_REQUEST_TOOL: Tool = {
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

export const DECLINE_PULL_REQUEST_TOOL: Tool = {
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

export const GET_PULL_REQUEST_COMMENTS_TOOL: Tool = {
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

export const GET_PULL_REQUEST_DIFF_TOOL: Tool = {
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

export const LIST_PR_COMMITS_TOOL: Tool = {
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

export const SET_REVIEW_STATUS_TOOL: Tool = {
  name: "set_review_status",
  description:
    "Set review status on a pull request: APPROVED, NEEDS_WORK, or UNAPPROVED. One call, mutually exclusive states.",
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

export const UPDATE_PULL_REQUEST_TOOL: Tool = {
  name: "update_pull_request",
  description:
    "Update an existing pull request (title, description, reviewers). Accepts version from a prior read for conflict prevention; auto-refetches and retries once on 409 conflicts.",
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
        description:
          "Current version from a prior read (saves a fetch; auto-refetch + retry on 409)",
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
    required: [
      "projectKey",
      "repoSlug",
      "pullRequestId",
      "commentId",
      "version",
      "action",
    ],
  },
};

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
        description:
          "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      },
    },
    required: ["projectKey", "repoSlug", "path"],
  },
};

export const GET_DIRECTORY_LISTING_TOOL: Tool = {
  name: "get_directory_listing",
  description:
    "List files and directories at a given path in a Bitbucket Server repository",
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
        description:
          "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

export const GET_FILE_DIFF_TOOL: Tool = {
  name: "get_file_diff",
  description:
    "Get the diff between two commits or branches for a specific file or all files",
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
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};

export const GREP_TOOL: Tool = {
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
        description:
          "Search mode: 'content' (matching lines with optional context), 'files' (list matching file paths), 'count' (match count per file)",
      },
      glob: {
        type: "string",
        description: "Filename glob filter (e.g., '*.ts', '*.java', 'src/**')",
      },
      path: {
        type: "string",
        description:
          "Directory path prefix to limit search scope (e.g., 'src/main')",
      },
      context_lines: {
        type: "number",
        description:
          "Number of context lines before/after each match in content mode (default: 0)",
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
// All tools export
// ==========================================

export const ALL_TOOLS: Tool[] = [
  // Project
  LIST_PROJECTS_TOOL,
  GET_PROJECT_DETAIL_TOOL,
  // Repository
  LIST_REPOSITORIES_TOOL,
  SEARCH_REPOSITORIES_TOOL,
  // Branch
  GET_REPO_BRANCHES_TOOL,
  CREATE_BRANCH_TOOL,
  DELETE_BRANCH_TOOL,
  // Commit
  GET_REPO_COMMITS_TOOL,
  GET_COMMIT_DETAIL_TOOL,
  // Tag
  GET_REPO_TAGS_TOOL,
  // Pull Request
  GET_PULL_REQUESTS_TOOL,
  CREATE_PULL_REQUEST_TOOL,
  GET_PULL_REQUEST_DETAIL_TOOL,
  MERGE_PULL_REQUEST_TOOL,
  DECLINE_PULL_REQUEST_TOOL,
  GET_PULL_REQUEST_COMMENTS_TOOL,
  GET_PULL_REQUEST_DIFF_TOOL,
  LIST_PR_COMMITS_TOOL,
  SET_REVIEW_STATUS_TOOL,
  UPDATE_PULL_REQUEST_TOOL,
  // Comment
  ADD_COMMENT_TOOL,
  MANAGE_COMMENT_TOOL,
  // Source Code
  GET_FILE_CONTENT_TOOL,
  GET_DIRECTORY_LISTING_TOOL,
  GET_FILE_DIFF_TOOL,
  // Search
  SEARCH_CODE_TOOL,
  GREP_TOOL,
];