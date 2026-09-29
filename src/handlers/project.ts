import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleListProjects(args: PaginationArgs = {}) {
  const { limit, start } = pageParams(args);
  const response = await apiClient.get("/rest/api/1.0/projects", {
    params: { limit, start },
  });
  return toPage(response.data, limit, start);
}

export async function handleGetProjectDetail(args: { projectKey: string }) {
  const response = await apiClient.get(`/rest/api/1.0/projects/${args.projectKey}`);
  return response.data;
}
