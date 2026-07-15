import { apiClient } from "../config.js";

export async function handleListRepositories(args: { projectKey: string }) {
  const response = await apiClient.get(`/rest/api/1.0/projects/${args.projectKey}/repos`);
  return response.data.values;
}

export async function handleSearchRepositories(args: {
  query: string;
  projectKey?: string;
  max_results?: number;
}) {
  const { query, projectKey, max_results = 25 } = args;
  let repos: any[] = [];

  if (projectKey) {
    const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`, {
      params: { limit: max_results },
    });
    repos = response.data.values || [];
    const lowerQuery = query.toLowerCase();
    repos = repos.filter(
      (r: any) =>
        (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
        (r.slug && r.slug.toLowerCase().includes(lowerQuery)) ||
        (r.description && r.description.toLowerCase().includes(lowerQuery))
    );
  } else {
    const projectsResponse = await apiClient.get("/rest/api/1.0/projects", {
      params: { limit: 100 },
    });
    const projects = projectsResponse.data.values || [];
    const lowerQuery = query.toLowerCase();

    for (const project of projects) {
      if (repos.length >= max_results) break;
      try {
        const reposResponse = await apiClient.get(
          `/rest/api/1.0/projects/${project.key}/repos`,
          { params: { limit: 100 } }
        );
        const matched = (reposResponse.data.values || []).filter(
          (r: any) =>
            (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
            (r.slug && r.slug.toLowerCase().includes(lowerQuery)) ||
            (r.description && r.description.toLowerCase().includes(lowerQuery))
        );
        repos.push(...matched);
      } catch {
        // Skip projects we don't have access to
      }
    }
  }

  return repos.slice(0, max_results).map((r: any) => ({
    project: r.project?.key,
    name: r.name,
    slug: r.slug,
    description: r.description || "",
    url: r.links?.clone?.[0]?.href || "",
  }));
}