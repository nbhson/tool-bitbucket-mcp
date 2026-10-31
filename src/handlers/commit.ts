import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";
import { normalizePathString } from "./pathUtils.js";

export async function handleGetRepoCommits(
  args: {
    projectKey: string;
    repoSlug: string;
    until?: string;
    since?: string;
    path?: string;
  } & PaginationArgs,
) {
  const { projectKey, repoSlug, until, since, path, ...page } = args;
  const { limit, start } = pageParams(page);
  const params: Record<string, unknown> = { limit, start };
  if (until) params.until = until;
  if (since) params.since = since;
  if (path) params.path = path;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`,
    { params },
  );
  return toPage(response.data, limit, start);
}

export async function handleGetCommitDetail(args: {
  projectKey: string;
  repoSlug: string;
  commitId: string;
  detail?: string;
}) {
  const { projectKey, repoSlug, commitId, detail = "metadata" } = args;

  if (!["metadata", "files", "full"].includes(detail)) {
    throw new Error(`Invalid detail level: ${detail}. Use 'metadata', 'files', or 'full'.`);
  }

  const commitResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits/${commitId}`,
  );
  const commit = commitResponse.data;

  if (detail === "metadata") {
    return commit;
  }

  const diffResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`,
    { params: { from: `${commitId}^`, to: commitId } },
  );
  const diffs = diffResponse.data.diffs || [];

  if (detail === "files") {
    const files = diffs.map((d: any) => ({
      path: normalizePathString(d.destination) ?? normalizePathString(d.path),
      status: d.type,
      linesAdded: d.lineStats?.linesAdded || 0,
      linesRemoved: d.lineStats?.linesRemoved || 0,
      oldPath: normalizePathString(d.source),
    }));
    return {
      commit: { id: commit.id, message: commit.message, author: commit.author },
      files,
    };
  }

  if (detail === "full") {
    const files = diffs.map((d: any) => ({
      path: normalizePathString(d.destination) ?? normalizePathString(d.path),
      status: d.type,
      diff: d.hunks || d.content || "",
      oldPath: normalizePathString(d.source),
    }));
    return {
      commit: {
        id: commit.id,
        message: commit.message,
        author: commit.author,
        date: commit.authorTimestamp,
      },
      files,
    };
  }

  return commit;
}
