const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { main } = require("./tool.js");

test("the app executes one tool call; the edit request is left pending (no loop)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afz2-"));
  fs.copyFileSync(path.join(__dirname, "checkout.js"), path.join(dir, "checkout.js"));
  const result = await main({ root: dir, quiet: true });
  assert.deepStrictEqual(result, { executed: ["read_file"], pending: "edit_file" });
  assert.match(fs.readFileSync(path.join(dir, "checkout.js"), "utf8"), /total = total \+ tax;/);
});

test("tools refuse paths outside the project", () => {
  const { createTools } = require("./tools.js");
  const { run } = createTools(__dirname);
  assert.throws(() => run.read_file({ path: "../../etc/passwd" }), /outside project/);
});
