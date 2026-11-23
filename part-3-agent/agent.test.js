const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runAgent } = require("./agent.js");

const sandbox = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afz3-"));
  fs.copyFileSync(path.join(__dirname, "checkout.js"), path.join(dir, "checkout.js"));
  return dir;
};

test("the loop reproduces, reads, edits and verifies until the tests pass", async () => {
  const dir = sandbox();
  const r = await runAgent({ root: dir, log: () => {} });
  assert.strictEqual(r.done, true);
  assert.deepStrictEqual(r.trace, ["run_tests", "read_file", "edit_file", "run_tests"]);
  assert.match(fs.readFileSync(path.join(dir, "checkout.js"), "utf8"), /const tax = total \* 0.18;/);
});

test("max turns is a hard stop", async () => {
  const r = await runAgent({ root: sandbox(), maxTurns: 2, log: () => {} });
  assert.strictEqual(r.done, false);
  assert.strictEqual(r.turns, 2);
});
