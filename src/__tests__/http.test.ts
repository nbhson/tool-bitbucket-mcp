import { describe, it, expect, afterAll } from "vitest";
import type { AddressInfo } from "node:net";

import { createHttpMcpServer } from "../index.js";

/**
 * Integration test cho Streamable HTTP transport.
 *
 * Server thật (node:http) lắng nghe port random (`listen(0)`) — không mock
 * tầng HTTP. Không cần BITBUCKET_* env vì tools/list không đụng API client.
 */

const servers: ReturnType<typeof createHttpMcpServer>[] = [];

/**
 * SDK Streamable HTTP trả JSON hoặc SSE (text/event-stream) tùy version —
 * chuẩn hóa về object JSON-RPC.
 */
async function readJsonRpc(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    for (const line of text.split("\n")) {
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data) return JSON.parse(data) as Record<string, unknown>;
      }
    }
    throw new Error(`No data line in SSE response: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** Start server trên port random, trả về base URL. */
async function start(endpoint = "/mcp"): Promise<string> {
  const server = createHttpMcpServer(endpoint);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}${endpoint}`;
}

afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

describe("HTTP transport (integration)", () => {
  it("should answer GET on the MCP endpoint with a health payload", async () => {
    const base = await start();
    const res = await fetch(base);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; version: string };
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe("string");
  });

  it("should serve a valid initialize request over POST", async () => {
    const base = await start();
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "vitest", version: "0.0.0" },
        },
      }),
    });
    expect(res.status).toBe(200);

    const payload = (await readJsonRpc(res)) as unknown as {
      jsonrpc: string;
      result: { serverInfo: { name: string; version: string } };
    };
    expect(payload.jsonrpc).toBe("2.0");
    expect(payload.result.serverInfo.name).toBeTruthy();
    expect(payload.result.serverInfo.version).toBeTruthy();
  });

  it("should list tools over POST (tools/list)", async () => {
    const base = await start();
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    });
    expect(res.status).toBe(200);

    const payload = (await readJsonRpc(res)) as unknown as {
      result: { tools: Array<{ name: string }> };
    };
    const names = payload.result.tools.map((tool) => tool.name);
    expect(names).toContain("grep");
    expect(names).toContain("get_file_content");
    expect(names.length).toBe(39);
  });

  it("should return 413 for a POST body over the 2 MiB cap", async () => {
    const base = await start();
    const bigBody = JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "list_projects",
        arguments: { padding: "x".repeat(2 * 1024 * 1024 + 1024) },
      },
    });

    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bigBody,
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/too large/i);
  });

  it("should return 404 for requests outside the endpoint", async () => {
    const base = await start("/mcp");
    const res = await fetch(base.replace(/\/mcp$/, "/other"));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("/mcp");
  });

  it("should return 400 for an invalid JSON POST body", async () => {
    const base = await start();
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    expect(res.status).toBe(400);
  });

  it("should return 404 for a GET to a non-existent endpoint (custom endpoint)", async () => {
    const base = await start("/api/mcp");
    const health = await fetch(base);
    expect(health.status).toBe(200);
    const wrong = await fetch(base.replace("/api/mcp", "/mcp"));
    expect(wrong.status).toBe(404);
  });
});
