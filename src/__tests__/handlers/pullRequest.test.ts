import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetPullRequests,
  handleCreatePullRequest,
  handleGetPullRequestDetail,
  handleMergePullRequest,
  handleDeclinePullRequest,
  handleReopenPullRequest,
  handleGetPullRequestMergeStatus,
  handleGetPullRequestActivities,
  handleGetPullRequestReviewers,
  handleGetPullRequestTasks,
  handleListPrCommits,
  handleSetReviewStatus,
  handleUpdatePullRequest,
} from "../../handlers/pullRequest.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("pullRequest handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleGetPullRequests", () => {
    it("should return a paged envelope of open pull requests by default", async () => {
      const mockPRs = [{ id: 1, title: "PR 1", state: "OPEN" }];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: mockPRs, size: 1, isLastPage: true },
      });

      const result = await handleGetPullRequests({
        projectKey: "PROJ",
        repoSlug: "repo",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests",
        { params: { state: "OPEN", limit: 25, start: 0 } },
      );
      expect(result.values).toEqual(mockPRs);
    });

    it("should filter by state and order", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: [], size: 0, isLastPage: true },
      });

      await handleGetPullRequests({
        projectKey: "PROJ",
        repoSlug: "repo",
        state: "MERGED",
        order: "NEWEST",
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
        params: { state: "MERGED", order: "NEWEST", limit: 25, start: 0 },
      });
    });
  });

  describe("handleCreatePullRequest", () => {
    it("should create a pull request without reviewers", async () => {
      const mockPR = { id: 1, title: "New PR" };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockPR });

      const result = await handleCreatePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        title: "New PR",
        fromRef: "refs/heads/feature",
        toRef: "refs/heads/main",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests",
        expect.objectContaining({
          title: "New PR",
          description: "",
          fromRef: expect.objectContaining({ id: "refs/heads/feature" }),
          toRef: expect.objectContaining({ id: "refs/heads/main" }),
        }),
      );
      expect(result).toEqual(mockPR);
    });

    it("should create a pull request with reviewers", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 1 } });

      await handleCreatePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        title: "New PR",
        fromRef: "refs/heads/feature",
        toRef: "refs/heads/main",
        reviewers: ["user1", "user2"],
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reviewers: [{ user: { name: "user1" } }, { user: { name: "user2" } }],
        }),
      );
    });
  });

  describe("handleMergePullRequest", () => {
    it("should merge a pull request", async () => {
      const mockResult = { id: 1, state: "MERGED" };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResult });

      const result = await handleMergePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        version: 1,
        message: "Merged!",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1/merge",
        { version: 1, message: "Merged!" },
        { headers: { "X-Atlassian-Token": "no-check" } },
      );
      expect(result).toEqual(mockResult);
    });

    it("should pass a merge strategy when provided", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await handleMergePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        version: 2,
        strategy: "squash",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ strategyId: "squash" }),
        expect.any(Object),
      );
    });
  });

  describe("handleDeclinePullRequest", () => {
    it("should decline a pull request", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      const result = await handleDeclinePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        version: 1,
        message: "Not needed",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1/decline",
        { version: 1, message: "Not needed" },
        { headers: { "X-Atlassian-Token": "no-check" } },
      );
      expect(result).toEqual({});
    });
  });

  describe("handleReopenPullRequest", () => {
    it("should auto-fetch version when omitted", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { version: 5 } });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { state: "OPEN" } });

      const result = await handleReopenPullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1/reopen",
        { version: 5 },
        expect.any(Object),
      );
      expect(result).toEqual({ state: "OPEN" });
    });
  });

  describe("handleGetPullRequestMergeStatus", () => {
    it("should summarize merge status and vetoes", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          canMerge: false,
          conflicted: true,
          outcome: "CLEAN",
          vetoes: [{ summaryMessage: "Needs 1 approval" }],
        },
      });

      const result = await handleGetPullRequestMergeStatus({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(result.canMerge).toBe(false);
      expect(result.conflicted).toBe(true);
      expect(result.vetoes).toEqual([
        { summaryMessage: "Needs 1 approval", detailedMessage: undefined },
      ]);
    });
  });

  describe("handleGetPullRequestActivities", () => {
    it("should return a paged envelope", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: [{ action: "APPROVED" }], size: 1, isLastPage: true },
      });

      const result = await handleGetPullRequestActivities({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("/activities"), {
        params: { limit: 100, start: 0 },
      });
      expect(result.values).toHaveLength(1);
    });
  });

  describe("handleGetPullRequestReviewers", () => {
    it("should list participants", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: [{ user: { name: "rev" }, status: "APPROVED" }] },
      });

      const result = await handleGetPullRequestReviewers({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(result).toEqual([{ user: { name: "rev" }, status: "APPROVED" }]);
    });
  });

  describe("handleGetPullRequestTasks", () => {
    it("should filter BLOCKER comments by state", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          values: [
            { id: 1, severity: "BLOCKER", state: "OPEN", text: "fix" },
            { id: 2, severity: "NORMAL", state: "OPEN", text: "ok" },
            { id: 3, severity: "BLOCKER", state: "RESOLVED", text: "done" },
          ],
          isLastPage: true,
        },
      });

      const result = await handleGetPullRequestTasks({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(result).toEqual([{ id: 1, severity: "BLOCKER", state: "OPEN", text: "fix" }]);
    });
  });

  describe("handleListPrCommits", () => {
    it("should return a paged envelope of commits", async () => {
      const mockCommits = [{ id: "abc123", displayId: "abc123", message: "fix" }];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { values: mockCommits, size: 1, isLastPage: true },
      });

      const result = await handleListPrCommits({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(result.values).toEqual(mockCommits);
      expect(result.isLastPage).toBe(true);
    });
  });

  describe("handleSetReviewStatus", () => {
    it("should approve via the participants endpoint as the current user", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { slug: "jdoe", name: "jdoe" },
      });
      vi.mocked(apiClient.put).mockResolvedValue({ data: {} });

      const result = await handleSetReviewStatus({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        status: "APPROVED",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/rest/api/1.0/users/current");
      expect(apiClient.put).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1/participants/jdoe",
        { user: { name: "jdoe" }, approved: true, status: "APPROVED" },
        { headers: { "X-Atlassian-Token": "no-check" } },
      );
      expect(result).toEqual({});
    });

    it("should reject invalid statuses", async () => {
      await expect(
        handleSetReviewStatus({
          projectKey: "PROJ",
          repoSlug: "repo",
          pullRequestId: 1,
          status: "MAYBE",
        }),
      ).rejects.toThrow("Invalid status");
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe("handleUpdatePullRequest", () => {
    it("should update title and description", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: { title: "Updated" } });

      const result = await handleUpdatePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        version: 1,
        title: "Updated",
        description: "New description",
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ version: 1, title: "Updated", description: "New description" }),
        expect.any(Object),
      );
      expect(result).toEqual({ title: "Updated" });
    });

    it("should auto-refetch version on 409 conflict", async () => {
      const conflictError: any = new Error("Conflict");
      conflictError.response = { status: 409 };

      vi.mocked(apiClient.put)
        .mockRejectedValueOnce(conflictError)
        .mockResolvedValueOnce({ data: { title: "Updated" } });
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { version: 3 },
      });

      await handleUpdatePullRequest({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        version: 1,
        title: "Updated",
      });

      expect(apiClient.put).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
