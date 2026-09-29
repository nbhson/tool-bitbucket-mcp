# Changelog

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
