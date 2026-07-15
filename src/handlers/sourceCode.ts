import { apiClient } from "../config.js";

export async function handleGetFileContent(args: {
  projectKey: string;
  repoSlug: string;
  path: string;
  at?: string;
}) {
  const { projectKey, repoSlug, path, at } = args;
  const response = await apiClient.get(
    `/projects/${projectKey}/repos/${repoSlug}/raw/${path}`,
    { params: at ? { at } : {} }
  );
  return typeof response.data === "string"
    ? response.data
    : JSON.stringify(response.data, null, 2);
}

export async function handleGetDirectoryListing(args: {
  projectKey: string;
  repoSlug: string;
  path?: string;
  at?: string;
}) {
  const { projectKey, repoSlug, path, at } = args;
  const repoPath = path || "";
  const url = repoPath
    ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${repoPath}`
    : `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse`;
  const response = await apiClient.get(url, {
    params: at ? { at } : {},
  });
  const children = response.data.children?.values || [];
  return children.map((child: any) => ({
    name: child.name,
    type: child.type,
    path: child.path,
  }));
}

export async function handleGetFileDiff(args: {
  projectKey: string;
  repoSlug: string;
  fromRef: string;
  toRef: string;
  path?: string;
}) {
  const { projectKey, repoSlug, fromRef, toRef, path } = args;
  const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`;
  const params: any = { from: fromRef, to: toRef };
  if (path) params.path = path;
  const response = await apiClient.get(url, { params });
  return response.data;
}