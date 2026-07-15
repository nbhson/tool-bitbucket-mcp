import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { handleListProjects, handleGetProjectDetail } from "./project.js";
import { handleListRepositories, handleSearchRepositories } from "./repository.js";
import { handleGetRepoBranches, handleCreateBranch, handleDeleteBranch } from "./branch.js";
import { handleGetRepoCommits, handleGetCommitDetail } from "./commit.js";
import { handleGetRepoTags } from "./tag.js";
import {
  handleGetPullRequests,
  handleCreatePullRequest,
  handleGetPullRequestDetail,
  handleMergePullRequest,
  handleDeclinePullRequest,
  handleGetPullRequestComments,
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
} from "./sourceCode.js";
import { handleSearchCode, handleGrep } from "./search.js";

type Handler = (args: any) => Promise<any>;

const handlers: Record<string, Handler> = {
  // Project
  list_projects: handleListProjects,
  get_project_detail: handleGetProjectDetail,
  // Repository
  list_repositories: handleListRepositories,
  search_repositories: handleSearchRepositories,
  // Branch
  get_repo_branches: handleGetRepoBranches,
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
  get_pull_request_comments: handleGetPullRequestComments,
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
  // Search
  search_code: handleSearchCode,
  grep: handleGrep,
};

export async function routeToolCall(request: CallToolRequest) {
  const toolName = request.params.name;
  const args = (request.params.arguments as Record<string, any>) || {};

  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return handler(args);
}