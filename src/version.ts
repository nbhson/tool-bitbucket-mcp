import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Single source of truth for the server version (package.json).
// `../package.json` resolves correctly both from src/ (vitest) and
// from build/ (compiled output, where this file sits at build/version.js).
function readVersion(): string {
  try {
    const pkg = require("../package.json") as { version?: string };
    if (pkg?.version) return pkg.version;
  } catch {
    // ignore — fall through to default
  }
  return "0.0.0-dev";
}

export const SERVER_VERSION = readVersion();
export const SERVER_NAME = "bitbucket-server-mcp";
