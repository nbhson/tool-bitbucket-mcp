import { apiClient } from "../config.js";

export async function handleListProjects() {
  const response = await apiClient.get("/rest/api/1.0/projects");
  return response.data.values;
}

export async function handleGetProjectDetail(args: { projectKey: string }) {
  const response = await apiClient.get(`/rest/api/1.0/projects/${args.projectKey}`);
  return response.data;
}