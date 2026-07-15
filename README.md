# Bitbucket MCP Server

MCP (Model Context Protocol) server for Bitbucket Server (Data Center) integration. This server provides tools to interact with Bitbucket Server APIs via Personal Access Token (PAT) authentication.

## Tools (27)

### Project Operations
- **list_projects** — List all projects the user has access to
- **get_project_detail** — Get detailed information about a specific project

### Repository Operations
- **list_repositories** — List repositories in a specific project
- **search_repositories** — Find repositories by name or description across all accessible projects

### Branch Operations
- **get_repo_branches** — List branches in a repository (with optional filter)
- **create_branch** — Create a new branch
- **delete_branch** — Delete a branch

### Commit Operations
- **get_repo_commits** — List recent commits in a repository (with `until`/`since` filters)
- **get_commit_detail** — Get commit details with configurable detail level: `metadata`, `files` (changed file list), or `full` (unified diff)

### Tag Operations
- **get_repo_tags** — List tags in a repository (with optional filter)

### Pull Request Operations
- **get_pull_requests** — Get pull requests for a repository (filter by state: OPEN, MERGED, DECLINED, ALL)
- **get_pull_request_detail** — Get detailed information about a specific pull request
- **create_pull_request** — Create a new pull request (with optional reviewers)
- **update_pull_request** — Update PR title, description, reviewers with auto-refetch and 409 conflict retry
- **merge_pull_request** — Merge a pull request
- **decline_pull_request** — Decline/reject a pull request
- **get_pull_request_comments** — Get comments on a pull request
- **get_pull_request_diff** — Get the diff of a pull request for code review
- **list_pr_commits** — List commits on a specific pull request with pagination
- **set_review_status** — Set review status: APPROVED, NEEDS_WORK, or UNAPPROVED (mutually exclusive)

### Comment Operations
- **add_comment** — Add a comment (general, reply, inline code, or blocker task) to a pull request. Supports anchor for inline comments on specific file paths and line numbers.
- **manage_comment** — Manage a comment or task: edit, delete, resolve, reopen, convert to task, or convert to comment

### Source Code Operations
- **get_file_content** — Get the raw content of a file (supports `at` ref parameter)
- **get_directory_listing** — List files and directories at a given path
- **get_file_diff** — Get the diff between two commits or branches for a specific file or all files

### Code Search Operations
- **search_code** — Index-backed exact-term search across a repository (case-insensitive, files <512 KiB)
- **grep** — Regex search file contents across a repository (like ripgrep). Supports content/files/count modes, filename glob, path filtering, context lines, and case-insensitive search

## Installation

### Using npx (recommended)

```bash
npx sbitbucket-mcp-server
```

### Using npm

```bash
npm install -g sbitbucket-mcp-server
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_URL` | Yes | Your Bitbucket Server URL (e.g., `https://bitbucket.example.com`) |
| `BITBUCKET_TOKEN` | Yes | Personal Access Token (PAT) for authentication |

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

# Development mode (watch)
npm run dev

# Start server
npm start

# Run tests
npm test
```

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── config.ts             # Configuration and API client setup
├── tools/
│   └── index.ts          # All tool definitions (27 tools)
└── handlers/
    ├── index.ts           # Handler registry
    ├── project.ts         # Project operations
    ├── repository.ts      # Repository operations
    ├── branch.ts          # Branch operations
    ├── commit.ts          # Commit operations
    ├── tag.ts             # Tag operations
    ├── pullRequest.ts     # Pull request operations
    ├── comment.ts         # Comment operations
    ├── sourceCode.ts      # Source code operations
    └── search.ts          # Search operations
```

## License

MIT