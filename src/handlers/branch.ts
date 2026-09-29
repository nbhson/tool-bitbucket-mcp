import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleGetRepoBranches(
  args: { projectKey: string; repoSlug: string; filterText?: string } & PaginationArgs,
) {
  const { projectKey, repoSlug, filterText, ...page } = args;
  const { limit, start } = pageParams(page, 100);
  const params: Record<string, unknown> = { limit, start };
  if (filterText) params.filterText = filterText;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
    { params },
  );
  return toPage(response.data, limit, start);
}

export async function handleGetDefaultBranch(args: { projectKey: string; repoSlug: string }) {
  const { projectKey, repoSlug } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches/default`,
  );
  return response.data;
}

export async function handleCreateBranch(args: {
  projectKey: string;
  repoSlug: string;
  name: string;
  startPoint: string;
  message?: string;
}) {
  const { projectKey, repoSlug, name, startPoint, message } = args;
  const payload: Record<string, unknown> = { name, startPoint };
  if (message) payload.message = message;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
    payload,
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleDeleteBranch(args: {
  projectKey: string;
  repoSlug: string;
  branchName: string;
  dryRun?: boolean;
}) {
  const { projectKey, repoSlug, branchName, dryRun = false } = args;
  // NOTE: Bitbucket Server deletes branches via the `name` query parameter —
  // the branch id must NOT be URL-encoded into the path (slashes would break).
  const response = await apiClient.delete(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
    {
      params: { name: branchName, ...(dryRun ? { dryRun: true } : {}) },
      headers: { "X-Atlassian-Token": "no-check" },
    },
  );
  if (dryRun) return response.data;
  return `Branch '${branchName}' has been deleted successfully.`;
}
