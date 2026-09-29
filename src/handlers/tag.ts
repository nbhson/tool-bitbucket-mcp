import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleGetRepoTags(
  args: { projectKey: string; repoSlug: string; filterText?: string } & PaginationArgs,
) {
  const { projectKey, repoSlug, filterText, ...page } = args;
  const { limit, start } = pageParams(page, 100);
  const params: Record<string, unknown> = { limit, start };
  if (filterText) params.filterText = filterText;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/tags`,
    { params },
  );
  return toPage(response.data, limit, start);
}
