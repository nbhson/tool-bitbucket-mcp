/**
 * Tool definitions registry.
 *
 * Tool definitions are grouped by domain in sibling files that mirror the
 * `handlers/` layout. This barrel re-exports every definition and assembles
 * the `ALL_TOOLS` list served by `ListToolsRequest`.
 */

export * from "./project.js";
export * from "./repository.js";
export * from "./branch.js";
export * from "./commit.js";
export * from "./tag.js";
export * from "./pullRequest.js";
export * from "./comment.js";
export * from "./sourceCode.js";
export * from "./user.js";
export * from "./search.js";

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import {
  CREATE_BRANCH_TOOL,
  DELETE_BRANCH_TOOL,
  GET_DEFAULT_BRANCH_TOOL,
  GET_REPO_BRANCHES_TOOL,
} from "./branch.js";
import { ADD_COMMENT_TOOL, MANAGE_COMMENT_TOOL } from "./comment.js";
import { GET_COMMIT_DETAIL_TOOL, GET_REPO_COMMITS_TOOL } from "./commit.js";
import { GET_PROJECT_DETAIL_TOOL, LIST_PROJECTS_TOOL } from "./project.js";
import {
  CREATE_PULL_REQUEST_TOOL,
  DECLINE_PULL_REQUEST_TOOL,
  GET_PULL_REQUEST_ACTIVITIES_TOOL,
  GET_PULL_REQUEST_COMMENTS_TOOL,
  GET_PULL_REQUEST_DETAIL_TOOL,
  GET_PULL_REQUEST_DIFF_TOOL,
  GET_PULL_REQUEST_MERGE_STATUS_TOOL,
  GET_PULL_REQUEST_REVIEWERS_TOOL,
  GET_PULL_REQUEST_TASKS_TOOL,
  GET_PULL_REQUESTS_TOOL,
  LIST_PR_COMMITS_TOOL,
  MERGE_PULL_REQUEST_TOOL,
  REOPEN_PULL_REQUEST_TOOL,
  SET_REVIEW_STATUS_TOOL,
  UPDATE_PULL_REQUEST_TOOL,
} from "./pullRequest.js";
import {
  FORK_REPOSITORY_TOOL,
  LIST_REPOSITORIES_TOOL,
  LIST_WEBHOOKS_TOOL,
  SEARCH_REPOSITORIES_TOOL,
} from "./repository.js";
import { GREP_TOOL, SEARCH_CODE_TOOL } from "./search.js";
import {
  GET_COMMIT_COMPARE_TOOL,
  GET_FILE_CONTENT_TOOL,
  GET_DIRECTORY_LISTING_TOOL,
  GET_FILE_DIFF_TOOL,
  GET_FILE_HISTORY_TOOL,
} from "./sourceCode.js";
import { GET_REPO_TAGS_TOOL } from "./tag.js";
import { GET_CURRENT_USER_TOOL, SEARCH_USERS_TOOL } from "./user.js";

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
  FORK_REPOSITORY_TOOL,
  LIST_WEBHOOKS_TOOL,
  // Branch
  GET_REPO_BRANCHES_TOOL,
  GET_DEFAULT_BRANCH_TOOL,
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
  REOPEN_PULL_REQUEST_TOOL,
  GET_PULL_REQUEST_MERGE_STATUS_TOOL,
  GET_PULL_REQUEST_COMMENTS_TOOL,
  GET_PULL_REQUEST_ACTIVITIES_TOOL,
  GET_PULL_REQUEST_REVIEWERS_TOOL,
  GET_PULL_REQUEST_TASKS_TOOL,
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
  GET_FILE_HISTORY_TOOL,
  GET_COMMIT_COMPARE_TOOL,
  // Users
  GET_CURRENT_USER_TOOL,
  SEARCH_USERS_TOOL,
  // Search
  SEARCH_CODE_TOOL,
  GREP_TOOL,
];
