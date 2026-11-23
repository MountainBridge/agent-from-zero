# Part 4: MCP

> Every AI app was rebuilding the same GitHub integration. MCP fixed that.

🎬 Reel: [Before MCP vs after MCP](https://www.instagram.com/stok.eed/reel/DeosdMnzmEj/)

## The idea

In Part 3 the tools lived **inside** the agent. Every app that wanted them had to copy them. The Model Context Protocol (MCP) moves tools behind a standard interface, so **one server works with many clients**.

```
            ┌──────────── JSON-RPC over stdio ────────────┐
 agent  ──▶ │ initialize · tools/list · tools/call        │ ──▶ server.js ──▶ read_file / edit_file / run_tests
 (client)   └─────────────────────────────────────────────┘
```

| | Part 3 | Part 4 |
|---|---|---|
| Where tools live | inside the agent | in a separate server process |
| How the agent learns about them | hard-coded | `tools/list` at runtime |
| Who can reuse them | only this agent | any MCP client |

## Run it

```bash
node client.js     # spawns server.js as a child process and talks to it over stdio
node --test
```

## Honest notes

- `server.js` is a **minimal, dependency-free** implementation of the MCP shape (JSON-RPC 2.0, one message per line, `initialize`, `tools/list`, `tools/call`) so you can read every line. For production, use the official MCP SDK.
- Field names differ by layer: MCP says `inputSchema`, the Anthropic Messages API says `input_schema`. Clients translate.

**Next: [Part 5, Skills](../part-5-skills)**: the agent has every tool and still does it wrong. Tools aren't know-how.
