const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { McpClient, runWithMcp } = require("./client.js");

test("server answers initialize and lists tools with inputSchema", async () => {
  const c = new McpClient(process.execPath, [path.join(__dirname, "server.js"), __dirname]);
  try {
    const info = await c.connect();
    assert.strictEqual(info.serverInfo.name, "checkout-tools");
    const { tools } = await c.request("tools/list", {});
    assert.deepStrictEqual(tools.map((t) => t.name), ["read_file", "edit_file", "run_tests"]);
    assert.ok(tools[0].inputSchema.properties.path);
    await assert.rejects(c.request("nope", {}), /Method not found/);
  } finally {
    c.close();
  }
});

test("an agent can fix the bug using only tools discovered over MCP", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afz4-"));
  fs.copyFileSync(path.join(__dirname, "checkout.js"), path.join(dir, "checkout.js"));
  const r = await runWithMcp({ root: dir, log: () => {} });
  assert.strictEqual(r.done, true);
  assert.deepStrictEqual(r.trace, ["run_tests", "read_file", "edit_file", "run_tests"]);
});
