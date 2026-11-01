# Bitbucket MCP Server

> **Repository:** https://bitbucket.org/nbhson/tool-bitbucket-mcp
> MCP (Model Context Protocol) server for Bitbucket Server (Data Center) integration.
> This server provides tools to interact with Bitbucket Server APIs via Personal Access Token (PAT) authentication.

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

## Tool Input Examples

Ready-to-paste `arguments` for every tool (grouped by domain):

### Project Operations

```json
{"tool": "list_projects", "arguments": {"limit": 25}}
{"tool": "get_project_detail", "arguments": {"projectKey": "PROJ1"}}
```

### Repository Operations

```json
{"tool": "list_repositories", "arguments": {"projectKey": "PROJ1", "limit": 50}}
{"tool": "search_repositories", "arguments": {"query": "api", "max_results": 10}}
{"tool": "fork_repository", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "targetProjectKey": "PROJ2"}}
{"tool": "list_webhooks", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo"}}
```

### Branch Operations

```json
{"tool": "get_repo_branches", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "filterText": "feature/"}}
{"tool": "get_default_branch", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo"}}
{"tool": "create_branch", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "name": "feature/login", "startPoint": "refs/heads/main", "message": "Add login feature"}}
{"tool": "delete_branch", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "branchName": "refs/heads/old-feature", "dryRun": true}}
```

### Commit Operations

```json
{"tool": "get_repo_commits", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "until": "refs/heads/main", "limit": 30}}
{"tool": "get_commit_detail", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "commitId": "abcdef123456", "detail": "full"}}
```

### Tag Operations

```json
{"tool": "get_repo_tags", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "filterText": "v1.", "limit": 50}}
```

### Pull Request Operations

```json
{"tool": "get_pull_requests", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "state": "OPEN", "limit": 25}}
{"tool": "get_pull_request_detail", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "create_pull_request", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "title": "Add login", "fromRef": "refs/heads/feature/login", "toRef": "refs/heads/main", "reviewers": ["jsmith"]}}
{"tool": "update_pull_request", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "title": "New title"}}
{"tool": "merge_pull_request", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "version": 3, "strategy": "squash"}}
{"tool": "decline_pull_request", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "version": 3}}
{"tool": "reopen_pull_request", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "get_pull_request_merge_status", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "get_pull_request_comments", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "get_pull_request_activities", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "get_pull_request_reviewers", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "get_pull_request_tasks", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "state": "OPEN"}}
{"tool": "get_pull_request_diff", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "list_pr_commits", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42}}
{"tool": "set_review_status", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "status": "APPROVED"}}
```

### Comment Operations

```json
{"tool": "add_comment", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "text": "LGTM!"}}
{"tool": "add_comment", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "text": "Fix this", "severity": "BLOCKER", "anchor": {"path": "src/main.ts", "line": 12, "lineType": "ADDED"}}}
{"tool": "manage_comment", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "commentId": 101, "version": 1, "action": "edit", "text": "Updated text"}}
{"tool": "manage_comment", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "pullRequestId": 42, "commentId": 101, "version": 1, "action": "delete"}}
```

### Source Code Operations

```json
{"tool": "get_file_content", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "path": "src/main.ts", "at": "refs/heads/main"}}
{"tool": "get_directory_listing", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "path": "src", "at": "refs/heads/main"}}
{"tool": "get_file_diff", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "fromRef": "refs/heads/main", "toRef": "refs/heads/feature/login", "path": "src/main.ts"}}
{"tool": "get_file_history", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "path": "src/main.ts", "limit": 20}}
{"tool": "get_commit_compare", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "fromRef": "v1.0.0", "toRef": "v1.1.0"}}
```

### User Operations

```json
{"tool": "get_current_user", "arguments": {}}
{"tool": "search_users", "arguments": {"query": "john", "limit": 10}}
```

### Code Search Operations

```json
{"tool": "search_code", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "query": "TODO", "limit": 25}}
{"tool": "grep", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "query": "function\\s+handle\\w+", "mode": "content", "glob": "src/**/*.ts", "context_lines": 2, "max_results": 50}}
{"tool": "grep", "arguments": {"projectKey": "PROJ1", "repoSlug": "my-repo", "query": "FIXME", "mode": "count", "ref": "refs/heads/main"}}
```

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
# GET on the endpoint returns a health payload: {"ok": true, ...}
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                 | Required | Default     | Description                                                                       |
| ------------------------ | -------- | ----------- | --------------------------------------------------------------------------------- |
| `BITBUCKET_URL`          | Yes      | —           | Your Bitbucket Server URL (e.g., `https://bitbucket.example.com`)                 |
| `BITBUCKET_TOKEN`        | Yes      | —           | Personal Access Token (PAT) for authentication                                    |
| `BITBUCKET_INSECURE_SSL` | No       | `false`     | Set to `true` to skip TLS verification (self-signed certs, trusted networks only) |
| `BITBUCKET_TIMEOUT_MS`   | No       | `30000`     | Per-request timeout in milliseconds                                               |
| `BITBUCKET_MAX_RETRIES`  | No       | `2`         | Retries with backoff on HTTP 429/5xx                                              |
| `BITBUCKET_CACHE_TTL_MS` | No       | `30000`     | Short TTL cache for GET responses (fewer repeated API calls); `0` disables        |
| `MCP_TRANSPORT`          | No       | `stdio`     | `stdio` or `http`                                                                 |
| `PORT`                   | No       | `3000`      | HTTP port in `http` mode                                                          |
| `MCP_ENDPOINT`           | No       | `/mcp`      | HTTP endpoint path in `http` mode                                                 |
| `HOST`                   | No       | `127.0.0.1` | HTTP bind address in `http` mode (non-loopback = insecure, warned at startup)     |

> TLS certificates are verified by default. The legacy behavior of blindly
> accepting any certificate now requires explicit opt-in via
> `BITBUCKET_INSECURE_SSL=true`.

### Transports

Stdio (default, for Claude Desktop / Cline / VS Code):

```bash
npx sbitbucket-mcp-server
```

Streamable HTTP (stateless, binds to **127.0.0.1** by default for security):

```bash
npx sbitbucket-mcp-server --http --port=3000 --endpoint=/mcp
# or: npm run start:http

# NOTE: HTTP transport binds to 127.0.0.1 — only accessible locally.
# To bind on all interfaces (INSECURE — anyone on the network can invoke
# your Bitbucket PAT), override with HOST=0.0.0.0 in the environment.
# For remote hosting, put this behind a reverse proxy with TLS + auth.
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

# Lint with ESLint + TypeScript
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

## Troubleshooting

### Common Issues

**`BITBUCKET_URL must be a valid URL` error**

- Ensure `BITBUCKET_URL` uses `https://` and doesn't end with a trailing slash
- Example: `https://bitbucket.example.com` (not `https://bitbucket.example.com/`)

**`BITBUCKET_TOKEN is required` error**

- Generate a Personal Access Token (PAT) in Bitbucket:
  1. Go to **Profile → Personal access tokens**
  2. Create a token with appropriate permissions (read/write based on your needs)
  3. Set `BITBUCKET_TOKEN=your-token` in your environment

**TLS/SSL certificate errors**

- For self-signed certificates in dev environments: set `BITBUCKET_INSECURE_SSL=true`
- **Warning:** Only use this in trusted networks, never in production

**Rate limiting (HTTP 429)**

- The server automatically retries with exponential backoff (default: 2 retries)
- Adjust `BITBUCKET_MAX_RETRIES` for more retries
- For heavy workloads, consider adding delays between requests

**Branch names with slashes fail to delete**

- Branch names containing `/` must be passed as full ref: `refs/heads/feature/my-branch`

**Merge conflicts not detected**

- Use `get_pull_request_merge_status` to check for conflicts before merging
- Check `vetoes` array in the response for blocking reviews

### Debug Mode

Enable verbose logging by checking the console output:

```bash
# Stdio mode logs to stderr
npm start 2>debug.log
```

### Performance Tips

- **Pagination:** Always use pagination for large result sets
- **Search:** Use `grep` with specific paths (`path` parameter) for faster results
- **Batch operations:** Use `Promise.allSettled` for concurrent operations

## Example Prompts

Here are example prompts for each tool category:

### Project Operations

```
"List all projects I'm a member of"
"Get details of the PROJ1 project"
```

### Repository Operations

```
"List repositories in the PROJ1 project"
"Find repositories with 'api' in the name"
"Fork the myrepo repository from PROJ1 to PROJ2"
```

### Branch Operations

```
"List all branches in myrepo"
"Get the default branch for myrepo"
"Create a new branch feature/login from main"
"Delete the old-feature branch"
```

### Pull Request Operations

```
"Get all open pull requests in myrepo"
"Create a PR from feature branch to main"
"Check if PR #42 can be merged"
"Approve the pull request"
"Add a comment to PR #42: 'LGTM!'"
```

### Code Search

```
"Find all occurrences of 'TODO' in the codebase"
"Search for files containing 'auth' in the src directory"
"Get the diff between main and feature branch"
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
    ├── handlers/         # Vitest suites (per-handler units)
    ├── http.test.ts      # Integration: Streamable HTTP transport (413, health, JSON-RPC)
    └── *.test.ts         # Config, registry, version
```

## License

MIT
