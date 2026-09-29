import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleListRepositories(args: { projectKey: string } & PaginationArgs) {
  const { projectKey, ...page } = args;
  const { limit, start } = pageParams(page, 100);
  const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`, {
    params: { limit, start },
  });
  return toPage(response.data, limit, start);
}

export async function handleSearchRepositories(args: {
  query: string;
  projectKey?: string;
  max_results?: number;
}) {
  const { query, projectKey, max_results = 25 } = args;

  const summarize = (r: any) => ({
    project: r.project?.key,
    name: r.name,
    slug: r.slug,
    description: r.description || "",
    url: r.links?.clone?.[0]?.href || "",
  });

  // Fast path: server-side `name` filter on the global repos endpoint.
  try {
    const params: Record<string, unknown> = { name: query, limit: Math.min(max_results, 100) };
    const url = projectKey ? `/rest/api/1.0/projects/${projectKey}/repos` : `/rest/api/1.0/repos`;
    const response = await apiClient.get(url, { params });
    const values = response.data.values || [];
    if (values.length > 0 || projectKey) {
      return values.slice(0, max_results).map(summarize);
    }
    // Empty global result without project scope → fall through to fuzzy match.
  } catch {
    // Older servers may reject the `name` filter — fall back below.
  }

  const lowerQuery = query.toLowerCase();
  const matches = (r: any) =>
    (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
    (r.slug && r.slug.toLowerCase().includes(lowerQuery)) ||
    (r.description && r.description.toLowerCase().includes(lowerQuery));

  if (projectKey) {
    const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`, {
      params: { limit: 100 },
    });
    const repos = (response.data.values || []).filter(matches);
    return repos.slice(0, max_results).map(summarize);
  }

  // Cross-project fallback: fetch repo lists concurrently instead of serially.
  const projectsResponse = await apiClient.get("/rest/api/1.0/projects", {
    params: { limit: 100 },
  });
  const projects = projectsResponse.data.values || [];
  const settled = await Promise.allSettled(
    projects.map((project: any) =>
      apiClient.get(`/rest/api/1.0/projects/${project.key}/repos`, {
        params: { limit: 100 },
      }),
    ),
  );
  const repos: any[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const r of s.value.data.values || []) {
      if (repos.length >= max_results) break;
      if (matches(r)) repos.push(r);
    }
    if (repos.length >= max_results) break;
  }
  return repos.slice(0, max_results).map(summarize);
}

export async function handleForkRepository(args: {
  projectKey: string;
  repoSlug: string;
  targetProjectKey: string;
  name?: string;
  slug?: string;
}) {
  const { projectKey, repoSlug, targetProjectKey, name, slug } = args;
  const payload: Record<string, unknown> = {
    project: { key: targetProjectKey },
  };
  if (name) payload.name = name;
  if (slug) payload.slug = slug;
  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/forks`,
    payload,
    { headers: { "X-Atlassian-Token": "no-check" } },
  );
  return response.data;
}

export async function handleListWebhooks(
  args: { projectKey: string; repoSlug: string } & PaginationArgs,
) {
  const { projectKey, repoSlug, ...page } = args;
  const { limit, start } = pageParams(page);
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/webhooks`,
    { params: { limit, start } },
  );
  return toPage(response.data, limit, start);
}
