import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ==========================================
// Pull Request Tools
// ==========================================

export const GET_PULL_REQUESTS_TOOL: Tool = {
  name: "get_pull_requests",
  description:
    "Get pull requests for a repository. Returns a paged envelope { values, isLastPage, nextPageStart }.",
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
        default: "OPEN",
      },
      order: {
        type: "string",
        description: "Sort order: OLDEST (default) or NEWEST",
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
      strategy: {
        type: "string",
        description:
          "Optional merge strategy id (e.g., squash, squash-ff-only). Omit for server default.",
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

export const REOPEN_PULL_REQUEST_TOOL: Tool = {
  name: "reopen_pull_request",
  description: "Reopen a declined pull request in a Bitbucket Server repository",
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
        description: "The current version of the pull request (auto-fetched if omitted)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

export const GET_PULL_REQUEST_MERGE_STATUS_TOOL: Tool = {
  name: "get_pull_request_merge_status",
  description: "Check whether a pull request can be merged (conflicts, vetoes, required checks)",
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

export const GET_PULL_REQUEST_COMMENTS_TOOL: Tool = {
  name: "get_pull_request_comments",
  description:
    "Get comments on a specific pull request. Returns a paged envelope { values, isLastPage, nextPageStart }.",
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
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 100)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

export const GET_PULL_REQUEST_ACTIVITIES_TOOL: Tool = {
  name: "get_pull_request_activities",
  description:
    "Get the activity stream of a pull request (comments, approvals, merges). Returns a paged envelope.",
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
      limit: {
        type: "number",
        description: "Maximum number of items per page (default: 100)",
      },
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

export const GET_PULL_REQUEST_REVIEWERS_TOOL: Tool = {
  name: "get_pull_request_reviewers",
  description: "List participants/reviewers of a pull request with their approval status",
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

export const GET_PULL_REQUEST_TASKS_TOOL: Tool = {
  name: "get_pull_request_tasks",
  description:
    "List blocker tasks (BLOCKER-severity comments) on a pull request, optionally filtered by state",
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
      state: {
        type: "string",
        enum: ["OPEN", "RESOLVED", "ALL"],
        description: "Task state filter (default: OPEN)",
      },
      max_results: {
        type: "number",
        description: "Maximum number of tasks to return (default: 100)",
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
      path: {
        type: "string",
        description: "Optional file path to limit the diff to",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

export const LIST_PR_COMMITS_TOOL: Tool = {
  name: "list_pr_commits",
  description: "List commits on a specific pull request with pagination. Returns a paged envelope.",
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
      start: {
        type: "number",
        description: "Zero-based start index (use nextPageStart from previous response)",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

export const SET_REVIEW_STATUS_TOOL: Tool = {
  name: "set_review_status",
  description:
    "Set the caller's own review status on a pull request: APPROVED, NEEDS_WORK, or UNAPPROVED. Acts as the authenticated user via the participants endpoint without touching other reviewers.",
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
