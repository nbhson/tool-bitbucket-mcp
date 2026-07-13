# Bitbucket MCP Server

MCP (Model Context Protocol) server for Bitbucket Server integration. This server provides tools to interact with Bitbucket Server APIs.

## Features

### Project Operations
- **list_projects**: List all projects the user has access to
- **get_project_detail**: Get detailed information about a specific project

### Repository Operations
- **list_repositories**: List repositories in a specific project
- **get_repo_branches**: List branches in a repository (with optional filter)
- **get_repo_commits**: List recent commits in a repository
- **get_repo_tags**: List tags in a repository (with optional filter)

### Pull Request Operations
- **get_pull_requests**: Get pull requests for a repository
- **get_pull_request_detail**: Get detailed information about a specific pull request
- **create_pull_request**: Create a new pull request (with optional reviewers)
- **merge_pull_request**: Merge a pull request
- **decline_pull_request**: Decline/reject a pull request
- **get_pull_request_comments**: Get comments on a pull request

### Source Code Operations
- **get_file_content**: Get the raw content of a file
- **get_directory_listing**: List files and directories at a given path
- **get_file_diff**: Get the diff between two commits or branches

### Branch Operations
- **create_branch**: Create a new branch
- **delete_branch**: Delete a branch

### Code Review Operations
- **get_pull_request_diff**: Get the diff of a pull request for code review

### Code Search
- **search_code**: Search for code in a repository

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
```

## License

MIT