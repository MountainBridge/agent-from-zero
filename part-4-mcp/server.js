// Part 4: MCP server
// The same tools as Part 3, now behind a standard interface: JSON-RPC 2.0 over stdio,
// one JSON message per line. Any MCP-style client can discover and call them.
// Minimal and dependency-free for teaching; production servers should use the official MCP SDK.

const readline = require("node:readline");
const path = require("node:path");
const { createTools } = require("../part-3-agent/tools.js");

const root = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
const { definitions, run } = createTools(root);

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const ok = (id, result) => send({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

const handlers = {
  initialize: () => ({
    protocolVersion: "2025-06-18",
    capabilities: { tools: {} },
    serverInfo: { name: "checkout-tools", version: "1.0.0" },
  }),
  "tools/list": () => ({
    // MCP names the schema `inputSchema`; the Messages API calls it `input_schema`.
    tools: definitions.map(({ name, description, input_schema }) => ({ name, description, inputSchema: input_schema })),
  }),
  "tools/call": ({ name, arguments: args = {} }) => {
    if (!run[name]) return { content: [{ type: "text", text: `Unknown tool ${name}` }], isError: true };
    try {
      return { content: [{ type: "text", text: run[name](args) }], isError: false };
    } catch (e) {
      return { content: [{ type: "text", text: e.message }], isError: true };
    }
  },
};

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return fail(null, -32700, "Parse error");
  }
  if (msg.id === undefined) return; // notifications (e.g. notifications/initialized) need no reply
  const handler = handlers[msg.method];
  if (!handler) return fail(msg.id, -32601, `Method not found: ${msg.method}`);
  ok(msg.id, handler(msg.params || {}));
});
