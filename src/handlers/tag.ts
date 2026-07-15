import { apiClient } from "../config.js";

export async function handleGetRepoTags(args: {
  projectKey: string;
  repoSlug: string;
  filterText?: string;
}) {
  const { projectKey, repoSlug, filterText } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/tags`,
    { params: filterText ? { filterText } : {} }
  );
  return response.data.values;
}