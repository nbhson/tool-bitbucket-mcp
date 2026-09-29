import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleGetPullRequests(
  args: {
    projectKey: string;
    repoSlug: string;
    state?: string;
    order?: string;
  } & PaginationArgs,
) {
  const { projectKey, repoSlug, state = "OPEN", order, ...page } = args;
  const { limit, start } = pageParams(page);
  const params: Record<string, unknown> = { state, limit, start };
  if (order) params.order = order;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`,
    { params },
  );
  return toPage(response.data, limit, start);
}

export async function handleCreatePullRequest(args: {
  projectKey: string;
  repoSlug: string;
  title: string;
  description?: string;
  fromRef: string;
  toRef: string;
  reviewers?: string[];
}) {
  const { projectKey, repoSlug, title, description, fromRef, toRef, reviewers } = args;
  const payload: any = {
    title,
    description: description || "",
    fromRef: { id: fromRef, repository: { slug: repoSlug, project: { key: projectKey } } },
    toRef: { id: toRef, repository: { slug: repoSlug, project: { key: projectKey } } },
  };
  if (reviewers && reviewers.length > 0) {
    payload.reviewers = reviewers.map((username: string) => ({ user: { name: username } }));
  }
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`,
    payload,
  );
  return response.data;
}

export async function handleGetPullRequestDetail(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
}) {
  const { projectKey, repoSlug, pullRequestId } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
  );
  return response.data;
}

export async function handleMergePullRequest(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  version: number;
  message?: string;
  strategy?: string;
}) {
  const { projectKey, repoSlug, pullRequestId, version, message, strategy } = args;
  const payload: Record<string, unknown> = { version, message: message || "" };
  if (strategy) payload.strategyId = strategy;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`,
    payload,
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleDeclinePullRequest(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  version: number;
  message?: string;
}) {
  const { projectKey, repoSlug, pullRequestId, version, message } = args;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/decline`,
    { version, message: message || "" },
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleReopenPullRequest(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  version?: number;
}) {
  const { projectKey, repoSlug, pullRequestId, version } = args;
  let currentVersion = version;
  if (!currentVersion) {
    const pr = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
    );
    currentVersion = pr.data.version;
  }
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/reopen`,
    { version: currentVersion },
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleGetPullRequestMergeStatus(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
}) {
  const { projectKey, repoSlug, pullRequestId } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`,
  );
  const data = response.data;
  return {
    canMerge: data.canMerge,
    conflicted: data.conflicted,
    outcome: data.outcome,
    vetoes: (data.vetoes || []).map((v: any) => ({
      summaryMessage: v.summaryMessage,
      detailedMessage: v.detailedMessage,
    })),
  };
}

export async function handleGetPullRequestComments(
  args: { projectKey: string; repoSlug: string; pullRequestId: number } & PaginationArgs,
) {
  const { projectKey, repoSlug, pullRequestId, ...page } = args;
  const { limit, start } = pageParams(page, 100);
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`,
    { params: { limit, start } },
  );
  return toPage(response.data, limit, start);
}

export async function handleGetPullRequestActivities(
  args: { projectKey: string; repoSlug: string; pullRequestId: number } & PaginationArgs,
) {
  const { projectKey, repoSlug, pullRequestId, ...page } = args;
  const { limit, start } = pageParams(page, 100);
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/activities`,
    { params: { limit, start } },
  );
  return toPage(response.data, limit, start);
}

export async function handleGetPullRequestReviewers(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
}) {
  const { projectKey, repoSlug, pullRequestId } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/participants`,
  );
  return response.data.values || response.data;
}

/**
 * Blocker tasks are stored as BLOCKER-severity comments, so list them by
 * paging through comments and filtering client-side.
 */
export async function handleGetPullRequestTasks(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  state?: "OPEN" | "RESOLVED" | "ALL";
  max_results?: number;
}) {
  const { projectKey, repoSlug, pullRequestId, state = "OPEN", max_results = 100 } = args;
  const tasks: any[] = [];
  let start = 0;
  const pageSize = 100;
  for (;;) {
    const response = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`,
      { params: { limit: pageSize, start } },
    );
    const values = response.data.values || [];
    for (const c of values) {
      if (c.severity !== "BLOCKER") continue;
      if (state !== "ALL" && (c.state || "OPEN") !== state) continue;
      tasks.push(c);
      if (tasks.length >= max_results) return tasks;
    }
    if (response.data.isLastPage || values.length === 0) break;
    start = response.data.nextPageStart ?? start + pageSize;
    if (tasks.length >= max_results) break;
  }
  return tasks.slice(0, max_results);
}

export async function handleGetPullRequestDiff(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  path?: string;
}) {
  const { projectKey, repoSlug, pullRequestId, path } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`,
    {
      headers: { Accept: "text/plain" },
      params: path ? { path } : {},
    },
  );
  return typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
}

export async function handleListPrCommits(
  args: {
    projectKey: string;
    repoSlug: string;
    pullRequestId: number;
    max_results?: number;
  } & PaginationArgs,
) {
  const { projectKey, repoSlug, pullRequestId, max_results, ...page } = args;
  const { limit, start } = pageParams(page, max_results ?? 100);
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/commits`,
    { params: { limit, start } },
  );
  const commits = (response.data.values || response.data || []).map((c: any) => ({
    id: c.id,
    displayId: c.displayId,
    message: c.message,
    author: c.author,
    authorTimestamp: c.authorTimestamp,
  }));
  return { ...toPage({ ...response.data, values: commits }, limit, start) };
}

export async function handleSetReviewStatus(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  status: string;
}) {
  const { projectKey, repoSlug, pullRequestId, status } = args;

  const normalized = status.toUpperCase();
  if (!["APPROVED", "NEEDS_WORK", "UNAPPROVED"].includes(normalized)) {
    throw new Error(`Invalid status: ${status}. Use 'APPROVED', 'NEEDS_WORK', or 'UNAPPROVED'.`);
  }

  // Act as the authenticated user via the participants endpoint — this only
  // touches the caller's own review instead of rewriting the reviewers list.
  const me = await apiClient.get("/rest/api/1.0/users/current");
  const slug: string | undefined = me.data?.slug;
  const name: string | undefined = me.data?.name;
  if (!slug && !name) {
    throw new Error("Could not determine the current user (GET /users/current).");
  }
  const userKey = slug || name;

  const payload =
    normalized === "APPROVED"
      ? { user: { name }, approved: true, status: "APPROVED" }
      : normalized === "NEEDS_WORK"
        ? { user: { name }, approved: false, status: "NEEDS_WORK" }
        : { user: { name }, approved: false, status: "UNAPPROVED" };

  const response = await apiClient.put(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/participants/${encodeURIComponent(userKey!)}`,
    payload,
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleUpdatePullRequest(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  version?: number;
  title?: string;
  description?: string;
  reviewers?: string[];
}) {
  const { projectKey, repoSlug, pullRequestId, version, title, description, reviewers } = args;

  let currentVersion = version;

  if (!currentVersion) {
    const prResponse = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
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
      { headers: { "X-Atlassian-Token": "no-check" } },
    );
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 409) {
      const prResponse = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
      );
      currentVersion = prResponse.data.version;
      const response = await apiClient.put(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`,
        buildPayload(),
        { headers: { "X-Atlassian-Token": "no-check" } },
      );
      return response.data;
    }
    throw err;
  }
}
