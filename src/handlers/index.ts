import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { handleListProjects, handleGetProjectDetail } from "./project.js";
import {
  handleListRepositories,
  handleSearchRepositories,
  handleForkRepository,
  handleListWebhooks,
} from "./repository.js";
import {
  handleGetRepoBranches,
  handleGetDefaultBranch,
  handleCreateBranch,
  handleDeleteBranch,
} from "./branch.js";
import { handleGetRepoCommits, handleGetCommitDetail } from "./commit.js";
import { handleGetRepoTags } from "./tag.js";
import {
  handleGetPullRequests,
  handleCreatePullRequest,
  handleGetPullRequestDetail,
  handleMergePullRequest,
  handleDeclinePullRequest,
  handleReopenPullRequest,
  handleGetPullRequestMergeStatus,
  handleGetPullRequestComments,
  handleGetPullRequestActivities,
  handleGetPullRequestReviewers,
  handleGetPullRequestTasks,
  handleGetPullRequestDiff,
  handleListPrCommits,
  handleSetReviewStatus,
  handleUpdatePullRequest,
} from "./pullRequest.js";
import { handleAddComment, handleManageComment } from "./comment.js";
import {
  handleGetFileContent,
  handleGetDirectoryListing,
  handleGetFileDiff,
  handleGetFileHistory,
  handleGetCommitCompare,
} from "./sourceCode.js";
import { handleSearchCode, handleGrep } from "./search.js";
import { handleGetCurrentUser, handleSearchUsers } from "./user.js";

type Handler = (args: any) => Promise<any>;

const handlers: Record<string, Handler> = {
  // Project
  list_projects: handleListProjects,
  get_project_detail: handleGetProjectDetail,
  // Repository
  list_repositories: handleListRepositories,
  search_repositories: handleSearchRepositories,
  fork_repository: handleForkRepository,
  list_webhooks: handleListWebhooks,
  // Branch
  get_repo_branches: handleGetRepoBranches,
  get_default_branch: handleGetDefaultBranch,
  create_branch: handleCreateBranch,
  delete_branch: handleDeleteBranch,
  // Commit
  get_repo_commits: handleGetRepoCommits,
  get_commit_detail: handleGetCommitDetail,
  // Tag
  get_repo_tags: handleGetRepoTags,
  // Pull Request
  get_pull_requests: handleGetPullRequests,
  create_pull_request: handleCreatePullRequest,
  get_pull_request_detail: handleGetPullRequestDetail,
  merge_pull_request: handleMergePullRequest,
  decline_pull_request: handleDeclinePullRequest,
  reopen_pull_request: handleReopenPullRequest,
  get_pull_request_merge_status: handleGetPullRequestMergeStatus,
  get_pull_request_comments: handleGetPullRequestComments,
  get_pull_request_activities: handleGetPullRequestActivities,
  get_pull_request_reviewers: handleGetPullRequestReviewers,
  get_pull_request_tasks: handleGetPullRequestTasks,
  get_pull_request_diff: handleGetPullRequestDiff,
  list_pr_commits: handleListPrCommits,
  set_review_status: handleSetReviewStatus,
  update_pull_request: handleUpdatePullRequest,
  // Comment
  add_comment: handleAddComment,
  manage_comment: handleManageComment,
  // Source Code
  get_file_content: handleGetFileContent,
  get_directory_listing: handleGetDirectoryListing,
  get_file_diff: handleGetFileDiff,
  get_file_history: handleGetFileHistory,
  get_commit_compare: handleGetCommitCompare,
  // Users
  get_current_user: handleGetCurrentUser,
  search_users: handleSearchUsers,
  // Search
  search_code: handleSearchCode,
  grep: handleGrep,
};

/** Required args per tool for fail-fast validation with actionable errors. */
const REQUIRED_ARGS: Record<string, string[]> = {
  get_project_detail: ["projectKey"],
  list_repositories: ["projectKey"],
  search_repositories: ["query"],
  fork_repository: ["projectKey", "repoSlug", "targetProjectKey"],
  list_webhooks: ["projectKey", "repoSlug"],
  get_repo_branches: ["projectKey", "repoSlug"],
  get_default_branch: ["projectKey", "repoSlug"],
  create_branch: ["projectKey", "repoSlug", "name", "startPoint"],
  delete_branch: ["projectKey", "repoSlug", "branchName"],
  get_repo_commits: ["projectKey", "repoSlug"],
  get_commit_detail: ["projectKey", "repoSlug", "commitId"],
  get_repo_tags: ["projectKey", "repoSlug"],
  get_pull_requests: ["projectKey", "repoSlug"],
  create_pull_request: ["projectKey", "repoSlug", "title", "fromRef", "toRef"],
  get_pull_request_detail: ["projectKey", "repoSlug", "pullRequestId"],
  merge_pull_request: ["projectKey", "repoSlug", "pullRequestId", "version"],
  decline_pull_request: ["projectKey", "repoSlug", "pullRequestId", "version"],
  reopen_pull_request: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_merge_status: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_comments: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_activities: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_reviewers: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_tasks: ["projectKey", "repoSlug", "pullRequestId"],
  get_pull_request_diff: ["projectKey", "repoSlug", "pullRequestId"],
  list_pr_commits: ["projectKey", "repoSlug", "pullRequestId"],
  set_review_status: ["projectKey", "repoSlug", "pullRequestId", "status"],
  update_pull_request: ["projectKey", "repoSlug", "pullRequestId"],
  add_comment: ["projectKey", "repoSlug", "pullRequestId", "text"],
  manage_comment: ["projectKey", "repoSlug", "pullRequestId", "commentId", "version", "action"],
  get_file_content: ["projectKey", "repoSlug", "path"],
  get_directory_listing: ["projectKey", "repoSlug"],
  get_file_diff: ["projectKey", "repoSlug", "fromRef", "toRef"],
  get_file_history: ["projectKey", "repoSlug", "path"],
  get_commit_compare: ["projectKey", "repoSlug", "fromRef", "toRef"],
  search_users: ["query"],
  search_code: ["projectKey", "repoSlug", "query"],
  grep: ["projectKey", "repoSlug", "query"],
};

export function listToolNames(): string[] {
  return Object.keys(handlers);
}

export async function routeToolCall(request: CallToolRequest) {
  const toolName = request.params.name;
  const args = (request.params.arguments as Record<string, any>) || {};

  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(
      `Unknown tool: ${toolName}. Available tools: ${Object.keys(handlers).join(", ")}`,
    );
  }

  const required = REQUIRED_ARGS[toolName] || [];
  const missing = required.filter((k) => args[k] === undefined || args[k] === null);
  if (missing.length > 0) {
    throw new Error(`Missing required argument(s) for '${toolName}': ${missing.join(", ")}`);
  }

  return handler(args);
}
