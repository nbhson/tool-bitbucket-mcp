/**
 * Zod input schemas cho từng tool — ranh giới validation duy nhất giữa
 * client MCP và handlers.
 *
 * - REQUIRED_ARGS cũ được thay bằng `.min(1)` trên các field bắt buộc, để
 *   vẫn báo "Missing required argument(s)" như trước.
 * - Số (`pullRequestId`, `version`) được coerce từ string: nhiều client
 *   gửi mọi giá trị dưới dạng string.
 * - Đây là nguồn sự thật cho cả tool inputSchema (`src/tools/*` định nghĩa
 *   riêng để hiển thị lên client, schema ở đây để validate runtime).
 */
import { z } from "zod";

import { PaginationSchema } from "../pagination.js";

/** Chuyển null → undefined để client gửi null cũng được coi là "thiếu". */
const unnull = (schema: z.ZodType) => z.preprocess((v) => (v === null ? undefined : v), schema);

/**
 * Bắt buộc non-empty string — message khớp format "Missing required
 * argument(s)" của routeToolCall (hành vi của REQUIRED_ARGS cũ).
 */
const required = (label: string) =>
  unnull(
    z
      .string({
        error: (iss) =>
          iss.input === undefined
            ? `Missing required argument: ${label}`
            : `Invalid argument '${label}': expected a string`,
      })
      .min(1, `Missing required argument: ${label}`),
  );

/** Bắt buộc số nguyên (pullRequestId, version, commentId). */
const requiredInt = (label: string) =>
  unnull(
    z.coerce
      .number({
        error: (iss) =>
          iss.input === undefined
            ? `Missing required argument: ${label}`
            : `Invalid argument '${label}': expected a number`,
      })
      .int(`Invalid argument '${label}': must be an integer`),
  );

const str = z.string();
const int = z.coerce.number().int();

/** Pagination trừ đi yêu cầu .strict() — tool args cho phép thêm field. */
const page = PaginationSchema.partial();

export const TOOL_SCHEMAS = {
  // Project
  list_projects: page,
  get_project_detail: z.object({ projectKey: required("projectKey") }),
  // Repository
  list_repositories: z.object({ projectKey: required("projectKey") }).extend(page.shape),
  search_repositories: z.object({
    query: required("query"),
    projectKey: str.optional(),
    max_results: z.coerce.number().int().min(1).max(1000).optional(),
  }),
  fork_repository: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    targetProjectKey: required("targetProjectKey"),
    name: str.optional(),
    slug: str.optional(),
  }),
  list_webhooks: z
    .object({ projectKey: required("projectKey"), repoSlug: required("repoSlug") })
    .extend(page.shape),
  // Branch
  get_repo_branches: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      filterText: str.optional(),
    })
    .extend(page.shape),
  get_default_branch: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
  }),
  create_branch: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    name: required("name"),
    startPoint: required("startPoint"),
    message: str.optional(),
  }),
  delete_branch: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    branchName: required("branchName"),
    dryRun: z.boolean().optional(),
  }),
  // Commit
  get_repo_commits: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      until: str.optional(),
      since: str.optional(),
      path: str.optional(),
    })
    .extend(page.shape),
  get_commit_detail: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    commitId: required("commitId"),
    detail: z.enum(["metadata", "files", "full"]).optional(),
  }),
  // Tag
  get_repo_tags: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      filterText: str.optional(),
    })
    .extend(page.shape),
  // Pull Request
  get_pull_requests: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      state: z.enum(["OPEN", "MERGED", "DECLINED", "ALL"]).optional(),
      order: str.optional(),
    })
    .extend(page.shape),
  create_pull_request: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    title: required("title"),
    description: str.optional(),
    fromRef: required("fromRef"),
    toRef: required("toRef"),
    reviewers: z.array(str).optional(),
  }),
  get_pull_request_detail: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
  }),
  merge_pull_request: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    version: requiredInt("version"),
    message: str.optional(),
    strategy: str.optional(),
  }),
  decline_pull_request: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    version: requiredInt("version"),
    message: str.optional(),
  }),
  reopen_pull_request: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    version: int.optional(),
  }),
  get_pull_request_merge_status: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
  }),
  get_pull_request_comments: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      pullRequestId: requiredInt("pullRequestId"),
    })
    .extend(page.shape),
  get_pull_request_activities: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      pullRequestId: requiredInt("pullRequestId"),
    })
    .extend(page.shape),
  get_pull_request_reviewers: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
  }),
  get_pull_request_tasks: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    state: z.enum(["OPEN", "RESOLVED", "ALL"]).optional(),
    max_results: z.coerce.number().int().min(1).max(1000).optional(),
  }),
  get_pull_request_diff: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    path: str.optional(),
  }),
  list_pr_commits: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      pullRequestId: requiredInt("pullRequestId"),
      max_results: z.coerce.number().int().min(1).max(1000).optional(),
    })
    .extend(page.shape),
  set_review_status: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    status: required("status"),
  }),
  update_pull_request: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    version: int.optional(),
    title: str.optional(),
    description: str.optional(),
    reviewers: z.array(str).optional(),
  }),
  // Comment
  add_comment: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    text: required("text"),
    parentId: int.optional(),
    severity: str.optional(),
    anchor: z
      .object({
        path: str,
        line: int,
        lineType: str.optional(),
        fileType: str.optional(),
        diffType: str.optional(),
        fromHash: str.optional(),
        toHash: str.optional(),
        srcPath: str.optional(),
      })
      .optional(),
  }),
  manage_comment: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    pullRequestId: requiredInt("pullRequestId"),
    commentId: requiredInt("commentId"),
    version: requiredInt("version"),
    action: required("action"),
    text: str.optional(),
  }),
  // Source Code
  get_file_content: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    path: required("path"),
    at: str.optional(),
  }),
  get_directory_listing: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      path: str.optional(),
      at: str.optional(),
    })
    .extend(page.shape),
  get_file_diff: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    fromRef: required("fromRef"),
    toRef: required("toRef"),
    path: str.optional(),
  }),
  get_file_history: z
    .object({
      projectKey: required("projectKey"),
      repoSlug: required("repoSlug"),
      path: required("path"),
      at: str.optional(),
    })
    .extend(page.shape),
  get_commit_compare: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    fromRef: required("fromRef"),
    toRef: required("toRef"),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
  }),
  // Users
  get_current_user: z.object({}),
  search_users: z.object({ query: required("query") }).extend(page.shape),
  // Search
  search_code: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    query: required("query"),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
  }),
  grep: z.object({
    projectKey: required("projectKey"),
    repoSlug: required("repoSlug"),
    query: required("query"),
    ref: str.optional(),
    mode: z.enum(["content", "files", "count"]).optional(),
    glob: str.optional(),
    path: str.optional(),
    context_lines: z.coerce.number().int().min(0).max(50).optional(),
    case_insensitive: z.boolean().optional(),
    max_results: z.coerce.number().int().min(1).max(10000).optional(),
    max_files: z.coerce.number().int().min(1).max(1000).optional(),
  }),
} as const;

export type ToolSchemaMap = typeof TOOL_SCHEMAS;
