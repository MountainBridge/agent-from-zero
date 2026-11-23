// Part 4: MCP client + agent
// The agent no longer owns the tools. It discovers them from a server at runtime.

const { spawn } = require("node:child_process");
const readline = require("node:readline");
const path = require("node:path");

class McpClient {
  constructor(command, args) {
    this.proc = spawn(command, args, { stdio: ["pipe", "pipe", "inherit"] });
    this.pending = new Map();
    this.nextId = 1;
    readline.createInterface({ input: this.proc.stdout }).on("line", (line) => {
      const msg = JSON.parse(line);
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
    });
  }
  request(method, params) {
    const id = this.nextId++;
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  notify(method, params) {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  }
  async connect() {
    const info = await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "agent-from-zero", version: "1.0.0" },
    });
    this.notify("notifications/initialized");
    return info;
  }
  close() {
    this.proc.kill();
  }
}

// Same scripted "model" idea as Part 3, kept tiny.
function mockModel(observations) {
  const last = observations[observations.length - 1] || "";
  const step = (name, input, text) => ({ text, call: { name, input } });
  if (!observations.length) return step("run_tests", {}, "Reproduce the failure.");
  if (last.startsWith("FAIL") && observations.length === 1) return step("read_file", { path: "checkout.js" }, "Read the code.");
  if (last.includes("function checkout"))
    return step("edit_file", { path: "checkout.js", old_text: "total = total + tax;", new_text: "const tax = total * 0.18;\n  total = total + tax;" }, "Define tax.");
  if (last === "edited") return step("run_tests", {}, "Verify.");
  return { text: "Tests pass. Done.", call: null };
}

async function runWithMcp({ root, log = console.log, maxTurns = 10 } = {}) {
  const client = new McpClient(process.execPath, [path.join(__dirname, "server.js"), root || __dirname]);
  try {
    const { serverInfo } = await client.connect();
    const { tools } = await client.request("tools/list", {});
    log(`connected to ${serverInfo.name}; discovered tools: ${tools.map((t) => t.name).join(", ")}\n`);

    const observations = [];
    const trace = [];
    for (let turn = 1; turn <= maxTurns; turn++) {
      const { text, call } = mockModel(observations);
      log(`turn ${turn}  MODEL  ${text}`);
      if (!call) return { done: true, tools: tools.map((t) => t.name), trace };
      const result = await client.request("tools/call", { name: call.name, arguments: call.input });
      const output = result.content.map((c) => c.text).join("\n");
      trace.push(call.name);
      log(`        MCP    tools/call ${call.name} -> ${output.split("\n")[0]}`);
      observations.push(output);
    }
    return { done: false, tools: tools.map((t) => t.name), trace };
  } finally {
    client.close();
  }
}

if (require.main === module) {
  const fs = require("node:fs"), os = require("node:os");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-"));
  fs.copyFileSync(path.join(__dirname, "checkout.js"), path.join(root, "checkout.js"));
  console.log("(mock model, real MCP server process)\n");
  runWithMcp({ root }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { McpClient, runWithMcp };
