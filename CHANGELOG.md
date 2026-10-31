# Changelog

## 1.5.1

### Fixed

- **P0 — startup crash (config validation)**: `getConfig()` previously passed the
  whole `process.env` to a `.strict()` zod schema, so every unrelated system
  variable (`PATH`, `HOME`, ...) raised "Unrecognized keys" and crashed the
  server on startup in any real environment. Only `BITBUCKET_*` variables (and
  `MCP_TRANSPORT`) are now selected before parsing — misspelled Bitbucket
  options are still rejected.
- **`get_commit_detail` fail-fast**: an invalid `detail` value is now rejected
  before any API call instead of after fetching commit + diff.
- **`get_directory_listing` path handling**: file paths are normalized through
  a shared `normalizePathString()` helper that safely handles both plain
  strings and `RestPath` objects (previously a plain-string `path` leaked the
  `toString` function into the output, which `JSON.stringify` then dropped).
  `get_commit_detail` (files/full) uses the same helper.

### Security

- **HTTP transport**: optional `HOST` env variable (documented but previously
  not implemented) — still defaults to `127.0.0.1`, with a loud warning when
  binding to a non-loopback address.
- **HTTP request body cap**: POST bodies larger than 2 MiB are rejected with
  HTTP 413 instead of being buffered into memory.
- Duplicated error formatting removed; the tool-call error path now reuses the
  canonical `formatApiError()` from `config.ts`.

### Code Quality

- Removed duplicated `if (!userKey)` check and ternary chain in
  `handleSetReviewStatus`.
- New test suites: `commit`, `tag`, handler registry (`routeToolCall`,
  required-args validation), config validation (`getConfig`, `formatApiError`),
  and HTTP host binding (`isLoopbackHost`). 61 → 95 tests, all passing.

## 1.5.0

### Dependencies

- **zod**: Upgraded from `^3.25.76` (v3) to `^4.6.7` (v4). Updated all schema
  definitions to use the new error message API (`{ message }` instead of
  `{ required_error }` / per-rule message strings). All 61 tests pass on zod 4.
- **@types/node**: Bumped to `^22.13.0` (aligned with workspace).
- **axios**: Upgraded from `^1.18.1` to `^1.7.9`.
- **eslint**: Added flat config (`eslint.config.js`) with `@typescript-eslint` strict rules.
- **prettier**: Already configured (`.prettierrc`).

### Features

- **Structured logging**: Added `logDebug`, `logInfo`, `logWarn`, `logError`,
  `setLogLevel`, and `LogLevel` enum for consistent log output with metadata.
- **Custom error types**: `BitbucketError`, `ConfigurationError`, `ValidationError`,
  `RateLimitError` with structured fields (`statusCode`, `originalError`, etc.).
- **Better error formatting**: `formatApiError()` produces actionable messages from
  Bitbucket API responses (HTTP status, server-side error messages).
- **Enhanced logging**: API client logs initialization, retries, and responses.

### Code Quality

- ESLint flat config with strict TypeScript rules.
- All 61 tests pass.
- Format check with Prettier passes.
- Build passes cleanly (`tsc --noEmit` + `tsc`).

### Documentation

- Fixed repository URL in `package.json` (GitHub → Bitbucket).
- Added troubleshooting section to `README.md`.
- Added example prompts for each tool category.
- Repository URL now prominently displayed in `README.md`.

## 1.4.0

### Breaking changes

- Collection tools (`list_projects`, `list_repositories`, `get_repo_branches`,
  `get_repo_commits`, `get_repo_tags`, `get_pull_requests`,
  `get_pull_request_comments`, `list_pr_commits`, `get_pull_request_activities`,
  `search_users`, …) now return a paged envelope
  `{ values, size, isLastPage, nextPageStart, limit, start }` instead of a bare
  array. Pass `nextPageStart` as `start` to fetch the next page.
- `delete_branch` now deletes via the documented `name` query parameter instead
  of URL-encoding the branch id into the path (which broke names containing `/`).
- `set_review_status` now acts as the authenticated user through the
  `participants/{userSlug}` endpoint. It no longer rewrites the whole reviewers
  list (previous behavior could drop other reviewers).
- TLS certificates are now verified by default. Set
  `BITBUCKET_INSECURE_SSL=true` to restore the old skip-verification behavior
  (self-signed certs, trusted networks only).
- Missing `BITBUCKET_URL`/`BITBUCKET_TOKEN` no longer kills the process at
  import time; the server fails fast with an actionable message at startup, and
  API calls throw a descriptive error.

### New tools (12 → 39 total)

- `get_current_user`, `search_users`
- `reopen_pull_request`, `get_pull_request_merge_status`,
  `get_pull_request_activities`, `get_pull_request_reviewers`,
  `get_pull_request_tasks`
- `get_default_branch`, `fork_repository`, `list_webhooks`
- `get_file_history`, `get_commit_compare`

### Improvements

- Server version is read from `package.json` (was hard-coded `1.0.0`).
- `search_repositories` tries the server-side `name` filter first and fans out
  per-project requests concurrently.
- `grep` fixes: resolves the real default branch (no more hard-coded
  `refs/heads/master`), validates the regex, correct `**` glob handling,
  bounded fetch concurrency, `max_files` cap, `count` mode accounting fix.
- `create_branch` supports `message`; `merge_pull_request` supports `strategy`;
  `create_pull_request` scopes refs to the repository; `get_pull_requests`
  supports `order`; `get_pull_request_diff` supports `path`;
  `get_repo_commits` supports `path`; `search_code` supports `limit`;
  `get_directory_listing` is paged.
- Required-argument validation in the router with actionable error messages.
- Bitbucket API errors now surface HTTP status + server messages.
- New Streamable HTTP transport (`--http`, `MCP_TRANSPORT=http`) for remote hosting.
- Axios client: configurable timeout, retry with backoff on 429/5xx honoring
  `Retry-After`, `User-Agent: bitbucket-mcp/<version>`, `.env` file support.
- Ops: `Dockerfile`, `.github/workflows/ci.yml` (Node 18/20/22),
  `prettier`, `.env.example`, `lint`/`format` scripts.
- Tests: 57 tests across 8 suites (was 5 suites), covering new tools and fixes.
