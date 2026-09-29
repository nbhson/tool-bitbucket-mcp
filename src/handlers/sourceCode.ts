import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

export async function handleGetFileContent(args: {
  projectKey: string;
  repoSlug: string;
  path: string;
  at?: string;
}) {
  const { projectKey, repoSlug, path, at } = args;
  const response = await apiClient.get(`/projects/${projectKey}/repos/${repoSlug}/raw/${path}`, {
    params: at ? { at } : {},
  });
  return typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
}

export async function handleGetDirectoryListing(
  args: {
    projectKey: string;
    repoSlug: string;
    path?: string;
    at?: string;
  } & PaginationArgs,
) {
  const { projectKey, repoSlug, path, at, ...page } = args;
  const { limit, start } = pageParams(page, 500);
  const repoPath = path || "";
  const url = repoPath
    ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${repoPath}`
    : `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse`;
  const response = await apiClient.get(url, {
    params: { ...(at ? { at } : {}), limit, start },
  });
  const children = response.data.children?.values || [];
  return children.map((child: any) => ({
    name: child.name,
    type: child.type,
    path: child.path?.toString || child.path,
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

/** Commit history for a single file (`path` filter on the commits endpoint). */
export async function handleGetFileHistory(
  args: {
    projectKey: string;
    repoSlug: string;
    path: string;
    at?: string;
  } & PaginationArgs,
) {
  const { projectKey, repoSlug, path, at, ...page } = args;
  const { limit, start } = pageParams(page);
  const params: Record<string, unknown> = { path, limit, start };
  if (at) params.at = at;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`,
    { params },
  );
  const envelope = toPage(response.data, limit, start);
  return {
    ...envelope,
    values: envelope.values.map((c: any) => ({
      id: c.id,
      displayId: c.displayId,
      message: c.message,
      author: c.author,
      authorTimestamp: c.authorTimestamp,
    })),
  };
}

/** Commits between two refs (for changelogs / release notes). */
export async function handleGetCommitCompare(args: {
  projectKey: string;
  repoSlug: string;
  fromRef: string;
  toRef: string;
  limit?: number;
}) {
  const { projectKey, repoSlug, fromRef, toRef, limit = 100 } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/commits`,
    { params: { from: fromRef, to: toRef, limit } },
  );
  const values = (response.data.values || []).map((c: any) => ({
    id: c.id,
    displayId: c.displayId,
    message: c.message,
    author: c.author,
    authorTimestamp: c.authorTimestamp,
  }));
  return {
    fromCommit: response.data.fromCommit && {
      id: response.data.fromCommit.id,
      displayId: response.data.fromCommit.displayId,
    },
    toCommit: response.data.toCommit && {
      id: response.data.toCommit.id,
      displayId: response.data.toCommit.displayId,
    },
    values,
  };
}
