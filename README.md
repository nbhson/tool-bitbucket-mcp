# Bitbucket MCP Server

MCP (Model Context Protocol) server for Bitbucket Server integration. This server provides tools to interact with Bitbucket Server APIs.

## Features

- **list_projects**: List all projects the user has access to
- **list_repositories**: List repositories in a specific project
- **get_pull_requests**: Get pull requests for a repository
- **get_file_content**: Get the raw content of a file from a repository

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
