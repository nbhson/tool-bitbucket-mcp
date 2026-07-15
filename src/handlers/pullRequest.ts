import { apiClient } from "../config.js";

export async function handleGetPullRequests(args: {
  projectKey: string;
  repoSlug: string;
  state?: string;
}) {
  const { projectKey, repoSlug, state = "OPEN" } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`,
    { params: { state } }
  );
  return response.data.values;
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
    fromRef: { id: fromRef },
    toRef: { id: toRef },
  };
  if (reviewers && reviewers.length > 0) {
    payload.reviewers = reviewers.map((username: string) => ({ user: { name: username } }));
  }
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`,
    payload
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
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`
  );
  return response.data;
}

export async function handleMergePullRequest(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  version: number;
  message?: string;
}) {
  const { projectKey, repoSlug, pullRequestId, version, message } = args;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`,
    { version, message: message || "" },
    { headers: { "X-Atlassian-Token": "no-check" } }
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
    { headers: { "X-Atlassian-Token": "no-check" } }
  );
  return response.data;
}

export async function handleGetPullRequestComments(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
}) {
  const { projectKey, repoSlug, pullRequestId } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`
  );
  return response.data.values;
}

export async function handleGetPullRequestDiff(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
}) {
  const { projectKey, repoSlug, pullRequestId } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`,
    { headers: { Accept: "text/plain" } }
  );
  return typeof response.data === "string"
    ? response.data
    : JSON.stringify(response.data, null, 2);
}

export async function handleListPrCommits(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  max_results?: number;
}) {
  const { projectKey, repoSlug, pullRequestId, max_results = 100 } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/commits`,
    { params: { limit: max_results } }
  );
  return (response.data.values || response.data || []).map((c: any) => ({
    id: c.id,
    displayId: c.displayId,
    message: c.message,
    author: c.author,
    authorTimestamp: c.authorTimestamp,
  }));
}

export async function handleSetReviewStatus(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  status: string;
}) {
  const { projectKey, repoSlug, pullRequestId, status } = args;

  const prResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`
  );
  const currentVersion = prResponse.data.version;

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
    return response.data;
  } catch (err: any) {
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
      return response.data;
    }
    throw err;
  }
}