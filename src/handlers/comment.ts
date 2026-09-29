import { apiClient } from "../config.js";

export async function handleAddComment(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  text: string;
  parentId?: number;
  severity?: string;
  anchor?: {
    path: string;
    line: number;
    lineType?: string;
    fileType?: string;
    diffType?: string;
    fromHash?: string;
    toHash?: string;
    srcPath?: string;
  };
}) {
  const { projectKey, repoSlug, pullRequestId, text, parentId, severity, anchor } = args;
  const payload: any = { text };

  if (parentId) {
    payload.parent = { id: parentId };
  }
  if (severity) {
    payload.severity = severity;
  }
  if (anchor) {
    payload.anchor = {
      path: anchor.path,
      line: anchor.line,
      lineType: anchor.lineType || "ADDED",
      fileType: anchor.fileType || "TO",
      diffType: anchor.diffType || "EFFECTIVE",
    };
    if (anchor.fromHash) payload.anchor.fromHash = anchor.fromHash;
    if (anchor.toHash) payload.anchor.toHash = anchor.toHash;
    if (anchor.srcPath) payload.anchor.srcPath = anchor.srcPath;
  }

  const response = await apiClient.post(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`,
    payload,
  );
  return response.data;
}

export async function handleManageComment(args: {
  projectKey: string;
  repoSlug: string;
  pullRequestId: number;
  commentId: number;
  version: number;
  action: string;
  text?: string;
}) {
  const { projectKey, repoSlug, pullRequestId, commentId, version, action, text } = args;
  const baseUrl = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;

  if (action === "delete") {
    await apiClient.delete(baseUrl, { params: { version } });
    return `Comment/Task ${commentId} has been successfully deleted.`;
  }

  const payload: any = { version };
  if (action === "edit") {
    if (!text) {
      throw new Error("Parameter 'text' is required when action is 'edit'");
    }
    payload.text = text;
  } else if (action === "resolve") {
    payload.state = "RESOLVED";
  } else if (action === "reopen") {
    payload.state = "OPEN";
  } else if (action === "to_task") {
    payload.severity = "BLOCKER";
  } else if (action === "to_comment") {
    payload.severity = "NORMAL";
  } else {
    throw new Error(`Invalid action: ${action}`);
  }

  const response = await apiClient.put(baseUrl, payload);
  return response.data;
}
