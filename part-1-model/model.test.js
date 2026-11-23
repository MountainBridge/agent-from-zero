const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { callModel } = require("./model.js");

test("a model can describe the fix but the file stays broken", async () => {
  const before = fs.readFileSync(path.join(__dirname, "checkout.js"), "utf8");
  const answer = await callModel("fix it");
  assert.match(answer, /tax/);
  const after = fs.readFileSync(path.join(__dirname, "checkout.js"), "utf8");
  assert.strictEqual(after, before, "text in, text out: nothing on disk changes");
});
