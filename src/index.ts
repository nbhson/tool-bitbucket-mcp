#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import https from "https";

// Bitbucket Server credentials and URL
const BITBUCKET_URL = process.env.BITBUCKET_URL; // e.g., https://eu-gitp-a001.iconcr.com
const BITBUCKET_TOKEN = process.env.BITBUCKET_TOKEN; // Personal Access Token (PAT)

if (!BITBUCKET_URL || !BITBUCKET_TOKEN) {
  console.error("Missing BITBUCKET_URL or BITBUCKET_TOKEN environment variables");
  process.exit(1);
}

// Remove trailing slash from URL if present
const baseUrl = BITBUCKET_URL.replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: baseUrl,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: {
    Authorization: `Bearer ${BITBUCKET_TOKEN}`,
    Accept: "application/json",
  },
});

const server = new Server(
  {
    name: "bitbucket-server-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const LIST_PROJECTS_TOOL: Tool = {
  name: "list_projects",
  description: "List all projects the user has access to in Bitbucket Server",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const LIST_REPOSITORIES_TOOL: Tool = {
  name: "list_repositories",
  description: "List repositories in a specific Bitbucket Server project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
    },
    required: ["projectKey"],
  },
};

const GET_PULL_REQUESTS_TOOL: Tool = {
  name: "get_pull_requests",
  description: "Get pull requests for a repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      state: {
        type: "string",
        description: "State of pull requests to retrieve (e.g., OPEN, MERGED, DECLINED, ALL)",
        default: "OPEN"
      }
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_FILE_CONTENT_TOOL: Tool = {
  name: "get_file_content",
  description: "Get the raw content of a file from a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      path: {
        type: "string",
        description: "The path to the file in the repository",
      },
      at: {
        type: "string",
        description: "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      }
    },
    required: ["projectKey", "repoSlug", "path"],
  },
};

// ==========================================
// Pull Request Operations
// ==========================================

const CREATE_PULL_REQUEST_TOOL: Tool = {
  name: "create_pull_request",
  description: "Create a new pull request in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      title: {
        type: "string",
        description: "The title of the pull request",
      },
      description: {
        type: "string",
        description: "The description/body of the pull request",
      },
      fromRef: {
        type: "string",
        description: "The source branch (e.g., refs/heads/feature-branch)",
      },
      toRef: {
        type: "string",
        description: "The target branch (e.g., refs/heads/main)",
      },
      reviewers: {
        type: "array",
        items: { type: "string" },
        description: "List of reviewer usernames",
      },
    },
    required: ["projectKey", "repoSlug", "title", "fromRef", "toRef"],
  },
};

const GET_PULL_REQUEST_DETAIL_TOOL: Tool = {
  name: "get_pull_request_detail",
  description: "Get detailed information about a specific pull request",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

const MERGE_PULL_REQUEST_TOOL: Tool = {
  name: "merge_pull_request",
  description: "Merge a pull request in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
      version: {
        type: "number",
        description: "The current version of the pull request (required for merge)",
      },
      message: {
        type: "string",
        description: "The merge commit message",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "version"],
  },
};

const DECLINE_PULL_REQUEST_TOOL: Tool = {
  name: "decline_pull_request",
  description: "Decline/reject a pull request in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
      version: {
        type: "number",
        description: "The current version of the pull request",
      },
      message: {
        type: "string",
        description: "The decline message/reason",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId", "version"],
  },
};

const GET_PULL_REQUEST_COMMENTS_TOOL: Tool = {
  name: "get_pull_request_comments",
  description: "Get comments on a specific pull request",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

// ==========================================
// Repository Operations
// ==========================================

const GET_REPO_BRANCHES_TOOL: Tool = {
  name: "get_repo_branches",
  description: "List branches in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      filterText: {
        type: "string",
        description: "Optional filter to search branch names",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_REPO_COMMITS_TOOL: Tool = {
  name: "get_repo_commits",
  description: "List recent commits in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      until: {
        type: "string",
        description: "Commit SHA, branch, or tag to list commits until",
      },
      since: {
        type: "string",
        description: "Commit SHA to list commits since",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_REPO_TAGS_TOOL: Tool = {
  name: "get_repo_tags",
  description: "List tags in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      filterText: {
        type: "string",
        description: "Optional filter to search tag names",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

// ==========================================
// Source Code Operations
// ==========================================

const GET_DIRECTORY_LISTING_TOOL: Tool = {
  name: "get_directory_listing",
  description: "List files and directories at a given path in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      path: {
        type: "string",
        description: "The directory path (empty string for root)",
      },
      at: {
        type: "string",
        description: "The commit hash, branch name, or tag (e.g., refs/heads/main)",
      },
    },
    required: ["projectKey", "repoSlug"],
  },
};

const GET_FILE_DIFF_TOOL: Tool = {
  name: "get_file_diff",
  description: "Get the diff between two commits or branches for a specific file or all files",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      fromRef: {
        type: "string",
        description: "The source commit/branch/tag",
      },
      toRef: {
        type: "string",
        description: "The target commit/branch/tag",
      },
      path: {
        type: "string",
        description: "Optional specific file path to diff",
      },
    },
    required: ["projectKey", "repoSlug", "fromRef", "toRef"],
  },
};

// ==========================================
// Project Operations
// ==========================================

const GET_PROJECT_DETAIL_TOOL: Tool = {
  name: "get_project_detail",
  description: "Get detailed information about a specific Bitbucket Server project",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
    },
    required: ["projectKey"],
  },
};

// ==========================================
// Branch Operations
// ==========================================

const CREATE_BRANCH_TOOL: Tool = {
  name: "create_branch",
  description: "Create a new branch in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      name: {
        type: "string",
        description: "The name for the new branch",
      },
      startPoint: {
        type: "string",
        description: "The commit, branch, or tag to create the branch from (e.g., refs/heads/main)",
      },
    },
    required: ["projectKey", "repoSlug", "name", "startPoint"],
  },
};

const DELETE_BRANCH_TOOL: Tool = {
  name: "delete_branch",
  description: "Delete a branch from a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      branchName: {
        type: "string",
        description: "The full branch name to delete (e.g., refs/heads/feature-branch)",
      },
    },
    required: ["projectKey", "repoSlug", "branchName"],
  },
};

// ==========================================
// Code Review Operations
// ==========================================

const GET_PULL_REQUEST_DIFF_TOOL: Tool = {
  name: "get_pull_request_diff",
  description: "Get the diff of a pull request for code review",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      pullRequestId: {
        type: "number",
        description: "The pull request ID",
      },
    },
    required: ["projectKey", "repoSlug", "pullRequestId"],
  },
};

// ==========================================
// Code Search Operations
// ==========================================

const SEARCH_CODE_TOOL: Tool = {
  name: "search_code",
  description: "Search for code in a Bitbucket Server repository",
  inputSchema: {
    type: "object",
    properties: {
      projectKey: {
        type: "string",
        description: "The project key (e.g., PROJ)",
      },
      repoSlug: {
        type: "string",
        description: "The repository slug",
      },
      query: {
        type: "string",
        description: "The search query string",
      },
    },
    required: ["projectKey", "repoSlug", "query"],
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      LIST_PROJECTS_TOOL,
      LIST_REPOSITORIES_TOOL,
      GET_PULL_REQUESTS_TOOL,
      GET_FILE_CONTENT_TOOL,
      CREATE_PULL_REQUEST_TOOL,
      GET_PULL_REQUEST_DETAIL_TOOL,
      MERGE_PULL_REQUEST_TOOL,
      DECLINE_PULL_REQUEST_TOOL,
      GET_PULL_REQUEST_COMMENTS_TOOL,
      GET_REPO_BRANCHES_TOOL,
      GET_REPO_COMMITS_TOOL,
      GET_REPO_TAGS_TOOL,
      GET_DIRECTORY_LISTING_TOOL,
      GET_FILE_DIFF_TOOL,
      GET_PROJECT_DETAIL_TOOL,
      CREATE_BRANCH_TOOL,
      DELETE_BRANCH_TOOL,
      GET_PULL_REQUEST_DIFF_TOOL,
      SEARCH_CODE_TOOL,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "list_projects") {
      const response = await apiClient.get('/rest/api/1.0/projects');
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    } 
    
    if (request.params.name === "list_repositories") {
      const { projectKey } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_requests") {
      const { projectKey, repoSlug, state = "OPEN" } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`, {
        params: { state }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_file_content") {
      const { projectKey, repoSlug, path, at } = request.params.arguments as any;
      const response = await apiClient.get(`/projects/${projectKey}/repos/${repoSlug}/raw/${path}`, {
        params: at ? { at } : {}
      });
      return {
        content: [{ type: "text", text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Pull Request Operations Handlers
    // ==========================================

    if (request.params.name === "create_pull_request") {
      const { projectKey, repoSlug, title, description, fromRef, toRef, reviewers } = request.params.arguments as any;
      const payload: any = {
        title,
        description: description || "",
        fromRef: { id: fromRef },
        toRef: { id: toRef },
      };
      if (reviewers && reviewers.length > 0) {
        payload.reviewers = reviewers.map((username: string) => ({ user: { name: username } }));
      }
      const response = await apiClient.post(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`, payload);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_request_detail") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "merge_pull_request") {
      const { projectKey, repoSlug, pullRequestId, version, message } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`,
        { version, message: message || "" },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "decline_pull_request") {
      const { projectKey, repoSlug, pullRequestId, version, message } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/decline`,
        { version, message: message || "" },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "get_pull_request_comments") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    // ==========================================
    // Repository Operations Handlers
    // ==========================================

    if (request.params.name === "get_repo_branches") {
      const { projectKey, repoSlug, filterText } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`, {
        params: filterText ? { filterText } : {},
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_repo_commits") {
      const { projectKey, repoSlug, until, since } = request.params.arguments as any;
      const params: any = {};
      if (until) params.until = until;
      if (since) params.since = since;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/commits`, { params });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    if (request.params.name === "get_repo_tags") {
      const { projectKey, repoSlug, filterText } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/tags`, {
        params: filterText ? { filterText } : {},
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values, null, 2) }],
      };
    }

    // ==========================================
    // Source Code Operations Handlers
    // ==========================================

    if (request.params.name === "get_directory_listing") {
      const { projectKey, repoSlug, path, at } = request.params.arguments as any;
      const repoPath = path || "";
      const url = repoPath
        ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${repoPath}`
        : `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse`;
      const response = await apiClient.get(url, {
        params: at ? { at } : {},
      });
      const children = response.data.children?.values || [];
      const result = children.map((child: any) => ({
        name: child.name,
        type: child.type,
        path: child.path,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (request.params.name === "get_file_diff") {
      const { projectKey, repoSlug, fromRef, toRef, path } = request.params.arguments as any;
      let url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/compare/diff`;
      const params: any = { from: fromRef, to: toRef };
      if (path) params.path = path;
      const response = await apiClient.get(url, { params });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Project Operations Handlers
    // ==========================================

    if (request.params.name === "get_project_detail") {
      const { projectKey } = request.params.arguments as any;
      const response = await apiClient.get(`/rest/api/1.0/projects/${projectKey}`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Branch Operations Handlers
    // ==========================================

    if (request.params.name === "create_branch") {
      const { projectKey, repoSlug, name, startPoint } = request.params.arguments as any;
      const response = await apiClient.post(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
        { name, startPoint },
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (request.params.name === "delete_branch") {
      const { projectKey, repoSlug, branchName } = request.params.arguments as any;
      const encodedBranch = encodeURIComponent(branchName);
      await apiClient.delete(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches/${encodedBranch}`,
        { headers: { "X-Atlassian-Token": "no-check" } }
      );
      return {
        content: [{ type: "text", text: `Branch '${branchName}' has been deleted successfully.` }],
      };
    }

    // ==========================================
    // Code Review Operations Handlers
    // ==========================================

    if (request.params.name === "get_pull_request_diff") {
      const { projectKey, repoSlug, pullRequestId } = request.params.arguments as any;
      const response = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`,
        { headers: { Accept: "text/plain" } }
      );
      return {
        content: [{ type: "text", text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2) }],
      };
    }

    // ==========================================
    // Code Search Operations Handlers
    // ==========================================

    if (request.params.name === "search_code") {
      const { projectKey, repoSlug, query } = request.params.arguments as any;
      const response = await apiClient.get(
        `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
        { params: { q: query } }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response.data.values || response.data, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error: any) {
    console.error("Error executing tool", error.message);
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    return {
      content: [{ type: "text", text: `Error: ${errMessage}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bitbucket Server MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
