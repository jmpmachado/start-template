# ECC — MCP (Model Context Protocol) Module

> Source: `utils/ECC/mcp-configs/mcp-servers.json` · Root config: `utils/ECC/.mcp.json`
> Count: 15+ preconfigured MCP servers

MCP (Model Context Protocol) servers extend the harness with external tool capabilities —
live documentation lookup, web search, browser automation, database access, memory, and
infrastructure management. ECC ships preconfigured server definitions for the most common
integrations.

---

## MCP Server Catalog

### Research & Knowledge

| Server | Transport | Purpose |
|---|---|---|
| `context7` | HTTP (Upstash) | Live documentation lookup — resolves library docs at query time |
| `exa` | HTTP | Semantic web search and research synthesis |
| `sequential-thinking` | stdio | Chain-of-thought reasoning and multi-step problem decomposition |
| `firecrawl` | HTTP | Structured web scraping and content extraction |

### Memory & Persistence

| Server | Transport | Purpose |
|---|---|---|
| `memory` | stdio | Key-value session memory — persists facts across responses |
| `omega-memory` | HTTP | Rich semantic memory with embedding search |
| `longhand` | stdio | Session history indexing and recall |

### Version Control & Issues

| Server | Transport | Purpose |
|---|---|---|
| `github` | stdio | PR creation, issue management, repo operations |
| `jira` | HTTP | Issue tracking, sprint management (optional) |

### Browser Automation

| Server | Transport | Purpose |
|---|---|---|
| `playwright` | stdio | Headless browser control, screenshot, E2E test execution |

### Database

| Server | Transport | Purpose |
|---|---|---|
| `supabase` | HTTP | Supabase database queries, realtime, storage |

### Infrastructure & Deployment

| Server | Transport | Purpose |
|---|---|---|
| `cloudflare-workers` | HTTP | Cloudflare Workers deploy and management |
| `cloudflare-d1` | HTTP | Cloudflare D1 SQLite database |
| `railway` | HTTP | Railway deployment and environment management |
| `vercel` | HTTP | Vercel project deploy, logs, and env vars |

---

## Root MCP Config (`.mcp.json`)

The root `.mcp.json` at the ECC install root activates 6 default servers:

```jsonc
{
  "mcpServers": {
    "github": { "command": "npx", "args": ["@modelcontextprotocol/server-github"] },
    "context7": { "command": "npx", "args": ["@upstash/context7-mcp"] },
    "exa": { "command": "npx", "args": ["exa-mcp-server"] },
    "memory": { "command": "npx", "args": ["@modelcontextprotocol/server-memory"] },
    "playwright": { "command": "npx", "args": ["@playwright/mcp"] },
    "sequential-thinking": { "command": "npx", "args": ["@modelcontextprotocol/server-sequential-thinking"] }
  }
}
```

Additional servers from `mcp-configs/mcp-servers.json` are opt-in and activated per project.

---

## Environment Variables

MCP servers requiring authentication read from environment:

| Variable | Server | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | `github` | GitHub API access |
| `EXA_API_KEY` | `exa` | Exa search API |
| `FIRECRAWL_API_KEY` | `firecrawl` | Firecrawl scraping API |
| `SUPABASE_URL` | `supabase` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `supabase` | Supabase service role key |
| `JIRA_URL` | `jira` | Jira instance URL |
| `JIRA_TOKEN` | `jira` | Jira API token |
| `VERCEL_TOKEN` | `vercel` | Vercel deploy token |
| `RAILWAY_TOKEN` | `railway` | Railway API token |

Set these in `.env` (project root) or export them in the shell before starting the harness.

---

## Using MCP in Skills and Agents

Reference MCP server capabilities directly in skill definitions:

```markdown
## Steps
1. Use the `context7` MCP server to look up the current React 19 docs.
2. Use `exa` to search for recent CVEs affecting the detected dependency versions.
3. Use `playwright` to run the E2E test suite in headless mode.
```

The harness resolves MCP tool calls from skills automatically when the server is configured.

---

## Harness Compatibility

| Harness | MCP Support |
|---|---|
| Claude Code | Full (native) |
| Codex | Partial (HTTP transports only) |
| OpenCode | Full (TypeScript plugin wraps MCP) |
| Cursor | Partial (via `.cursor/hooks.json`) |
| Gemini | Partial |
| Zed | In development |

---

## Adding a New MCP Server

1. Add the server definition to `mcp-configs/mcp-servers.json`.
2. Document required env vars.
3. Add a health-check entry in `hooks/hooks.json` (`pre:mcp:health-check`).
4. Add a test in `tests/integration/mcp-<name>.test.js`.
5. Update this document and [INDEX.md](INDEX.md).

---

## See Also

- [HOOKS.md](HOOKS.md) — `pre:mcp:health-check` hook
- [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) — per-harness MCP configuration
- `utils/ECC/mcp-configs/mcp-servers.json` — full server definitions
- `utils/ECC/.mcp.json` — root MCP configuration
