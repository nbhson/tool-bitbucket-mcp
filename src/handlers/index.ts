import { type CallToolRequest } from "@modelcontextprotocol/sdk/types.js";

import {
  handleGetRepoBranches,
  handleGetDefaultBranch,
  handleCreateBranch,
  handleDeleteBranch,
} from "./branch.js";
import { handleAddComment, handleManageComment } from "./comment.js";
import { handleGetRepoCommits, handleGetCommitDetail } from "./commit.js";
import { handleListProjects, handleGetProjectDetail } from "./project.js";
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
import {
  handleListRepositories,
  handleSearchRepositories,
  handleForkRepository,
  handleListWebhooks,
} from "./repository.js";
import { TOOL_SCHEMAS, type ToolSchemaMap } from "./schemas.js";
import { handleSearchCode, handleGrep } from "./search.js";
import {
  handleGetFileContent,
  handleGetDirectoryListing,
  handleGetFileDiff,
  handleGetFileHistory,
  handleGetCommitCompare,
} from "./sourceCode.js";
import { handleGetRepoTags } from "./tag.js";
import { handleGetCurrentUser, handleSearchUsers } from "./user.js";

/** Handler đã qua validation schema — args được tạo lại từ zod (coerce số, ...). */
type Handler = (args: never) => Promise<unknown>;

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
const MISSING_PREFIX = "Missing required argument: ";

export function listToolNames(): string[] {
  return Object.keys(handlers);
}

/**
 * Dispatch một tool call tới handler sau khi validate args qua zod schema.
 *
 * Thứ tự lỗi giữ nguyên hành vi cũ:
 * 1. Tool không tồn tại → "Unknown tool: ... Available tools: ..."
 * 2. Thiếu arg bắt buộc → "Missing required argument(s) for 'x': a, b"
 * 3. Arg sai kiểu/ra ràng buộc → "Invalid arguments for 'x': ..." kèm chi tiết
 */
export async function routeToolCall(request: CallToolRequest) {
  const toolName = request.params.name;
  const args = (request.params.arguments as Record<string, unknown>) || {};

  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(
      `Unknown tool: ${toolName}. Available tools: ${Object.keys(handlers).join(", ")}`,
    );
  }

  const schema = TOOL_SCHEMAS[toolName as keyof ToolSchemaMap];
  if (!schema) {
    // Defensive: mọi tool trong registry đều phải có schema.
    throw new Error(`No input schema registered for tool: ${toolName}`);
  }

  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .filter((i) => i.message.startsWith(MISSING_PREFIX))
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      throw new Error(`Missing required argument(s) for '${toolName}': ${missing.join(", ")}`);
    }
    const details = parsed.error.issues
      .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid arguments for '${toolName}':\n${details}`);
  }

  return handler(parsed.data as never);
}
