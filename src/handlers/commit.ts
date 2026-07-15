import { apiClient } from "../config.js";

export async function handleGetRepoCommits(args: {
  projectKey: string;
  repoSlug: string;
  until?: string;
  since?: string;
}) {
  const { projectKey, repoSlug, until, since } = args;
  const params: any = {};
  if (until) params.until = until;
  if (since) params.since = since;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`,
    { params }
  );
  return response.data.values;
}

export async function handleGetCommitDetail(args: {
  projectKey: string;
  repoSlug: string;
  commitId: string;
  detail?: string;
}) {
  const { projectKey, repoSlug, commitId, detail = "metadata" } = args;

  const commitResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits/${commitId}`
  );
  const commit = commitResponse.data;

  if (detail === "metadata") {
    return commit;
  }

  const diffResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`,
    { params: { from: `${commitId}^`, to: commitId } }
  );
  const diffs = diffResponse.data.diffs || [];

  if (detail === "files") {
    const files = diffs.map((d: any) => ({
      path: d.destination?.toString || d.path,
      status: d.type,
      linesAdded: d.lineStats?.linesAdded || 0,
      linesRemoved: d.lineStats?.linesRemoved || 0,
      oldPath: d.source?.toString || null,
    }));
    return {
      commit: { id: commit.id, message: commit.message, author: commit.author },
      files,
    };
  }

  if (detail === "full") {
    const files = diffs.map((d: any) => ({
      path: d.destination?.toString || d.path,
      status: d.type,
      diff: d.hunks || d.content || "",
      oldPath: d.source?.toString || null,
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

  throw new Error(`Invalid detail level: ${detail}. Use 'metadata', 'files', or 'full'.`);
}