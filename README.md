# Bitbucket MCP Server

MCP (Model Context Protocol) server for Bitbucket Server (Data Center) integration. This server provides tools to interact with Bitbucket Server APIs via Personal Access Token (PAT) authentication.

## Tools (39)

### Project Operations

- **list_projects** — List all projects the user has access to (paged: `limit`/`start`, returns `{ values, isLastPage, nextPageStart }`)
- **get_project_detail** — Get detailed information about a specific project

### Repository Operations

- **list_repositories** — List repositories in a specific project (paged)
- **search_repositories** — Find repositories by name or description across all accessible projects (server-side `name` filter with concurrent fallback)
- **fork_repository** — Fork a repository into a target project
- **list_webhooks** — List webhooks configured on a repository (paged)

### Branch Operations

- **get_repo_branches** — List branches in a repository, with optional `filterText` (paged)
- **get_default_branch** — Get the default branch of a repository
- **create_branch** — Create a new branch (with optional `message`)
- **delete_branch** — Delete a branch (with optional `dryRun` check)

### Commit Operations

- **get_repo_commits** — List recent commits in a repository (`until`/`since`/`path` filters, paged)
- **get_commit_detail** — Get commit details with configurable detail level: `metadata`, `files` (changed file list), or `full` (unified diff)

### Tag Operations

- **get_repo_tags** — List tags in a repository, with optional `filterText` (paged)

### Pull Request Operations

- **get_pull_requests** — Get pull requests for a repository (filter by state: OPEN, MERGED, DECLINED, ALL; `order`, paged)
- **get_pull_request_detail** — Get detailed information about a specific pull request
- **create_pull_request** — Create a new pull request (with optional reviewers)
- **update_pull_request** — Update PR title, description, reviewers with auto-refetch and 409 conflict retry
- **merge_pull_request** — Merge a pull request (with optional `strategy` and message)
- **decline_pull_request** — Decline/reject a pull request
- **reopen_pull_request** — Reopen a declined pull request (auto-fetches `version` if omitted)
- **get_pull_request_merge_status** — Check mergeability: `canMerge`, `conflicted`, vetoes
- **get_pull_request_comments** — Get comments on a pull request (paged)
- **get_pull_request_activities** — Get the activity stream of a pull request (paged)
- **get_pull_request_reviewers** — List participants/reviewers with approval status
- **get_pull_request_tasks** — List blocker tasks (BLOCKER comments), filterable by state
- **get_pull_request_diff** — Get the diff of a pull request for code review (optional `path` filter)
- **list_pr_commits** — List commits on a specific pull request with pagination
- **set_review_status** — Set the caller's own review status: APPROVED, NEEDS_WORK, or UNAPPROVED (via participants endpoint, never touches other reviewers)

### Comment Operations

- **add_comment** — Add a comment (general, reply, inline code, or blocker task) to a pull request. Supports anchor for inline comments on specific file paths and line numbers.
- **manage_comment** — Manage a comment or task: edit, delete, resolve, reopen, convert to task, or convert to comment

### Source Code Operations

- **get_file_content** — Get the raw content of a file (supports `at` ref parameter)
- **get_directory_listing** — List files and directories at a given path (paged)
- **get_file_diff** — Get the diff between two commits or branches for a specific file or all files
- **get_file_history** — Get commit history for a single file (paged)
- **get_commit_compare** — List commits between two refs (`fromRef..toRef`), useful for changelogs

### User Operations

- **get_current_user** — Get the Bitbucket user bound to the configured token
- **search_users** — Search users by name, slug, or email (paged)

### Code Search Operations

- **search_code** — Index-backed exact-term search across a repository (case-insensitive, files <512 KiB)
- **grep** — Regex search file contents across a repository (like ripgrep). Supports content/files/count modes, filename glob (`*`, `**`, `?`), path filtering, context lines, case-insensitive search, `max_files` fetch cap. Defaults to the repository's default branch when `ref` is omitted.

## Pagination

Every collection tool returns a stable envelope:

```json
{
  "values": [...],
  "size": 25,
  "isLastPage": false,
  "nextPageStart": 25,
  "limit": 25,
  "start": 0
}
```

Pass `nextPageStart` as `start` in the next call to fetch the following page.

## Installation

### Using npx (recommended)

```bash
npx sbitbucket-mcp-server
```

### Using npm

```bash
npm install -g sbitbucket-mcp-server
```

### Using Docker

```bash
docker build -t bitbucket-mcp .
docker run --rm -i \
  -e BITBUCKET_URL=https://bitbucket.example.com \
  -e BITBUCKET_TOKEN=your-token \
  bitbucket-mcp
```

Remote HTTP mode:

```bash
docker run --rm -p 3000:3000 \
  -e BITBUCKET_URL=https://bitbucket.example.com \
  -e BITBUCKET_TOKEN=your-token \
  bitbucket-mcp
# MCP endpoint: http://localhost:3000/mcp
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                 | Required | Default | Description                                                                       |
| ------------------------ | -------- | ------- | --------------------------------------------------------------------------------- |
| `BITBUCKET_URL`          | Yes      | —       | Your Bitbucket Server URL (e.g., `https://bitbucket.example.com`)                 |
| `BITBUCKET_TOKEN`        | Yes      | —       | Personal Access Token (PAT) for authentication                                    |
| `BITBUCKET_INSECURE_SSL` | No       | `false` | Set to `true` to skip TLS verification (self-signed certs, trusted networks only) |
| `BITBUCKET_TIMEOUT_MS`   | No       | `30000` | Per-request timeout in milliseconds                                               |
| `BITBUCKET_MAX_RETRIES`  | No       | `2`     | Retries with backoff on HTTP 429/5xx                                              |
| `MCP_TRANSPORT`          | No       | `stdio` | `stdio` or `http`                                                                 |
| `PORT`                   | No       | `3000`  | HTTP port in `http` mode                                                          |
| `MCP_ENDPOINT`           | No       | `/mcp`  | HTTP endpoint path in `http` mode                                                 |

> TLS certificates are verified by default. The legacy behavior of blindly
> accepting any certificate now requires explicit opt-in via
> `BITBUCKET_INSECURE_SSL=true`.

### Transports

Stdio (default, for Claude Desktop / Cline / VS Code):

```bash
npx sbitbucket-mcp-server
```

Streamable HTTP (stateless, for remote hosting):

```bash
npx sbitbucket-mcp-server --http --port=3000 --endpoint=/mcp
# or: npm run start:http
```

### Claude Desktop Configuration

Add to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["-y", "sbitbucket-mcp-server"],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

### Cline / VS Code Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["-y", "sbitbucket-mcp-server"],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type-check (lint)
npm run lint

# Format / check formatting
npm run format
npm run format:check

# Development mode (watch)
npm run dev

# Start server (stdio)
npm start

# Start server (HTTP)
npm run start:http

# Run tests
npm test
```

## Project Structure

```
src/
├── index.ts              # Server entry point (stdio + Streamable HTTP)
├── version.ts            # Version from package.json (single source of truth)
├── config.ts             # Validated config (zod) + axios client w/ retry
├── pagination.ts         # Shared paging helpers + envelope type
├── tools/
│   └── index.ts          # All tool definitions (39 tools)
├── handlers/
│   ├── index.ts          # Handler registry + required-arg validation
│   ├── project.ts        # Project operations
│   ├── repository.ts     # Repository operations (+ fork, webhooks)
│   ├── branch.ts         # Branch operations (+ default branch)
│   ├── commit.ts         # Commit operations
│   ├── tag.ts            # Tag operations
│   ├── pullRequest.ts    # Pull request operations (+ reopen, merge status, ...)
│   ├── comment.ts        # Comment operations
│   ├── sourceCode.ts     # Source code operations (+ history, compare)
│   ├── user.ts           # User operations
│   └── search.ts         # Search operations
└── __tests__/
    └── handlers/         # Vitest suites (57 tests)
```

## License

MIT
