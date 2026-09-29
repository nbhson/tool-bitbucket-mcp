import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleAddComment, handleManageComment } from "../../handlers/comment.js";

vi.mock("../../config.js", () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../../config.js";

describe("comment handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleAddComment", () => {
    it("should add a general comment", async () => {
      const mockComment = { id: 10, text: "Looks good!" };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockComment });

      const result = await handleAddComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        text: "Looks good!",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/rest/api/1.0/projects/PROJ/repos/repo/pull-requests/1/comments",
        { text: "Looks good!" },
      );
      expect(result).toEqual(mockComment);
    });

    it("should add a threaded reply", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 11 } });

      await handleAddComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        text: "Reply",
        parentId: 10,
      });

      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), {
        text: "Reply",
        parent: { id: 10 },
      });
    });

    it("should add an inline comment with anchor", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 12 } });

      await handleAddComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        text: "Fix this",
        anchor: {
          path: "src/main.ts",
          line: 42,
          lineType: "ADDED",
          fromHash: "abc123",
          toHash: "def456",
        },
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: "Fix this",
          anchor: expect.objectContaining({
            path: "src/main.ts",
            line: 42,
            lineType: "ADDED",
          }),
        }),
      );
    });

    it("should add a blocker task", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 13 } });

      await handleAddComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        text: "Must fix",
        severity: "BLOCKER",
      });

      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), {
        text: "Must fix",
        severity: "BLOCKER",
      });
    });
  });

  describe("handleManageComment", () => {
    it("should edit a comment", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: { id: 1, text: "Updated" } });

      const result = await handleManageComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        commentId: 1,
        version: 1,
        action: "edit",
        text: "Updated text",
      });

      expect(apiClient.put).toHaveBeenCalledWith(expect.any(String), {
        version: 1,
        text: "Updated text",
      });
    });

    it("should throw on edit without text", async () => {
      await expect(
        handleManageComment({
          projectKey: "PROJ",
          repoSlug: "repo",
          pullRequestId: 1,
          commentId: 1,
          version: 1,
          action: "edit",
        }),
      ).rejects.toThrow("Parameter 'text' is required when action is 'edit'");
    });

    it("should delete a comment", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      const result = await handleManageComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        commentId: 5,
        version: 1,
        action: "delete",
      });

      expect(apiClient.delete).toHaveBeenCalledWith(expect.any(String), { params: { version: 1 } });
      expect(result).toBe("Comment/Task 5 has been successfully deleted.");
    });

    it("should resolve a comment", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: {} });

      await handleManageComment({
        projectKey: "PROJ",
        repoSlug: "repo",
        pullRequestId: 1,
        commentId: 1,
        version: 1,
        action: "resolve",
      });

      expect(apiClient.put).toHaveBeenCalledWith(expect.any(String), {
        version: 1,
        state: "RESOLVED",
      });
    });

    it("should throw on invalid action", async () => {
      await expect(
        handleManageComment({
          projectKey: "PROJ",
          repoSlug: "repo",
          pullRequestId: 1,
          commentId: 1,
          version: 1,
          action: "invalid",
        }),
      ).rejects.toThrow("Invalid action: invalid");
    });
  });
});
