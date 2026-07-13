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
