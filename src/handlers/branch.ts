import { apiClient } from "../config.js";

export async function handleGetRepoBranches(args: {
  projectKey: string;
  repoSlug: string;
  filterText?: string;
}) {
  const { projectKey, repoSlug, filterText } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
    { params: filterText ? { filterText } : {} }
  );
  return response.data.values;
}

export async function handleCreateBranch(args: {
  projectKey: string;
  repoSlug: string;
  name: string;
  startPoint: string;
}) {
  const { projectKey, repoSlug, name, startPoint } = args;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
    { name, startPoint },
    { headers: { "X-Atlassian-Token": "no-check" } }
  );
  return response.data;
}

export async function handleDeleteBranch(args: {
  projectKey: string;
  repoSlug: string;
  branchName: string;
}) {
  const { projectKey, repoSlug, branchName } = args;
  const encodedBranch = encodeURIComponent(branchName);
  await apiClient.delete(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches/${encodedBranch}`,
    { headers: { "X-Atlassian-Token": "no-check" } }
  );
  return `Branch '${branchName}' has been deleted successfully.`;
}