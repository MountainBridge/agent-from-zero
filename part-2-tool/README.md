# Part 2: Tool

> The model does not touch your project. It **requests** a tool; your application executes it.

🎬 Reel: [Does Claude Code's model open your files? Never. The client application does.](https://www.instagram.com/stok.eed/reel/DehUVBqz27t/)

## The idea

A tool is a capability described by a definition (`name`, `description`, `input_schema`). The model returns a structured `tool_use` request. Your application validates it, runs the implementation and sends a `tool_result` back.

**Model decides. Application executes.**

## Run it

```bash
node tool.js --mock
node --test
```

## What happens

1. Model asks for `read_file("checkout.js")`.
2. **Your code** reads the file and returns it.
3. Model asks for `edit_file(...)`.
4. **We stop.** Nothing keeps the cycle going. That missing loop is Part 3.

```
MODEL ──tool_use──▶ APPLICATION ──validate + execute──▶ TOOL ──▶ PROJECT
  ▲                                                                │
  └──────────────────────────── tool_result ◀──────────────────────┘
```

## Security

The application owns the boundary: `tools.js` refuses any path outside the project (there's a test for it). Production systems add authorization, logging, timeouts and audit trails.

**Next: [Part 3, Agent](../part-3-agent)**
