import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleGetPullRequests,
  handleCreatePullRequest,
  handleGetPullRequestDetail,
  handleMergePullRequest,
  handleDeclinePullRequest,
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
    it("should return open pull requests by default", async () => {
      const mockPRs = [{ id: 1, title: "PR 1", state: "OPEN" }];
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: mockPRs } });

      const result = await handleGetPullRequests({
        projectKey: "PROJ",
        repoSlug: "repo",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests",
        { params: { state: "OPEN" } }
      );
      expect(result).toEqual(mockPRs);
    });

    it("should filter by state", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: [] } });

      await handleGetPullRequests({
        projectKey: "PROJ",
        repoSlug: "repo",
        state: "MERGED",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { state: "MERGED" } }
      );
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
        {
          title: "New PR",
          description: "",
          fromRef: { id: "refs/heads/feature" },
          toRef: { id: "refs/heads/main" },
        }
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
        })
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
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      expect(result).toEqual(mockResult);
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
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      expect(result).toEqual({});
    });
  });

  describe("handleListPrCommits", () => {
    it("should return commits for a pull request", async () => {
      const mockCommits = [
        { id: "abc123", displayId: "abc123", message: "fix" },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ data: { values: mockCommits } });

      const result = await handleListPrCommits({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
      });

      expect(result).toEqual(mockCommits);
    });
  });

  describe("handleSetReviewStatus", () => {
    it("should set review status to APPROVED", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { version: 2, author: { user: { name: "author" } } },
      });
      vi.mocked(apiClient.put).mockResolvedValue({ data: {} });

      const result = await handleSetReviewStatus({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        status: "APPROVED",
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1",
        {
          version: 2,
          reviewers: [{ user: { name: "author" }, approved: true, status: "APPROVED" }],
        },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      expect(result).toEqual({});
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
        expect.any(Object)
      );
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

      const result = await handleUpdatePullRequest({
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