#!/usr/bin/env node

import { createServer as createHttpServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getConfig } from "./config.js";
import { routeToolCall } from "./handlers/index.js";
import { SERVER_NAME, SERVER_VERSION } from "./version.js";
import { ALL_TOOLS } from "./tools/index.js";

function formatToolError(error: any): string {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const bitbucketMessage =
    typeof data === "string"
      ? data
      : data?.errors?.map((e: any) => e.message).join("; ") ||
        data?.message ||
        (data ? JSON.stringify(data) : undefined);
  const message = bitbucketMessage || error?.message || String(error);
  return status ? `Bitbucket API error (HTTP ${status}): ${message}` : `Error: ${message}`;
}

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await routeToolCall(request);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`[bitbucket-mcp] tool '${request.params.name}' failed:`, error.message);
      return {
        content: [{ type: "text", text: formatToolError(error) }],
        isError: true,
      };
    }
  });

  return server;
}

function parseArgs(argv: string[]): { http: boolean; port: number; endpoint: string } {
  let http = process.env.MCP_TRANSPORT === "http";
  let port = Number(process.env.PORT || 3000);
  let endpoint = process.env.MCP_ENDPOINT || "/mcp";
  for (const arg of argv) {
    if (arg === "--http") http = true;
    else if (arg.startsWith("--port=")) port = Number(arg.slice("--port=".length)) || port;
    else if (arg.startsWith("--endpoint=")) endpoint = arg.slice("--endpoint=".length);
    else if (arg === "--help" || arg === "-h") {
      console.log(
        `${SERVER_NAME} v${SERVER_VERSION}\n\n` +
          `Usage: bitbucket-mcp [--http] [--port=3000] [--endpoint=/mcp]\n\n` +
          `Transports:\n` +
          `  (default)  stdio — for Claude Desktop, Cline, VS Code\n` +
          `  --http     Streamable HTTP (stateless) on --endpoint — for remote hosting\n\n` +
          `Environment:\n` +
          `  BITBUCKET_URL        required  e.g. https://bitbucket.example.com\n` +
          `  BITBUCKET_TOKEN      required  Personal Access Token\n` +
          `  BITBUCKET_INSECURE_SSL         opt-in 'true' for self-signed certs\n` +
          `  BITBUCKET_TIMEOUT_MS           request timeout (default 30000)\n` +
          `  BITBUCKET_MAX_RETRIES          retries on 429/5xx (default 2)\n` +
          `  MCP_TRANSPORT                  'stdio' (default) or 'http'\n` +
          `  PORT                           HTTP port (default 3000)\n` +
          `  MCP_ENDPOINT                   HTTP endpoint path (default /mcp)\n`,
      );
      process.exit(0);
    }
  }
  return { http, port, endpoint };
}

async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[bitbucket-mcp] v${SERVER_VERSION} running on stdio`);
}

async function runHttp(port: number, endpoint: string): Promise<void> {
  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== endpoint) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Not found. MCP endpoint is ${endpoint}` }));
      return;
    }
    let body: unknown = undefined;
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }
    }
    // Stateless mode: fresh server + transport per request (safe for concurrency).
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error: any) {
      console.error("[bitbucket-mcp] HTTP request failed:", error?.message || error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  });

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  console.error(`[bitbucket-mcp] v${SERVER_VERSION} listening on :${port}${endpoint}`);
}

async function run(): Promise<void> {
  // Parse args first so `--help` works without configured credentials.
  const { http, port, endpoint } = parseArgs(process.argv.slice(2));
  // Fail fast with a clear message when env is misconfigured.
  getConfig();
  if (http) await runHttp(port, endpoint);
  else await runStdio();
}

// Only auto-run when executed as a binary (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error("[bitbucket-mcp] Fatal error:", error?.message || error);
    process.exit(1);
  });
}
