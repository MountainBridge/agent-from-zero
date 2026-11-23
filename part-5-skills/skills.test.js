const test = require("node:test");
const assert = require("node:assert");
const { run } = require("./agent.js");
const { loadSkills } = require("./skills.js");
const quiet = { log: () => {} };

test("tools only: the agent refunds an order outside the window", async () => {
  const r = await run({ withSkills: false, request: { customerId: "C-7", orderId: "1042" }, ...quiet });
  assert.deepStrictEqual(r.actions, ["issue_refund:1042"]);
});

test("with skills: it loads the policy first and offers store credit instead", async () => {
  const r = await run({ withSkills: true, request: { customerId: "C-7", orderId: "1042" }, ...quiet });
  assert.strictEqual(r.trace[0], "load_skill");
  assert.deepStrictEqual(r.actions, ["offer_store_credit:1042"]);
});

test("with skills: it refuses to act on someone else's order", async () => {
  const r = await run({ withSkills: true, request: { customerId: "C-7", orderId: "2001" }, ...quiet });
  assert.deepStrictEqual(r.actions, []);
});

test("with skills: a recent order is refunded", async () => {
  const r = await run({ withSkills: true, request: { customerId: "C-7", orderId: "1043" }, ...quiet });
  assert.deepStrictEqual(r.actions, ["issue_refund:1043"]);
});

test("the index is much smaller than loading every skill up front", () => {
  const s = loadSkills();
  assert.ok(s.index.length < s.fullText.length);
});
