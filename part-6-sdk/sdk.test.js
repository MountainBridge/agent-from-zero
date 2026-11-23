const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createAgent } = require("./mini-sdk.js");

const noSleep = { sleep: async () => {} };
const end = (text) => ({ stop_reason: "end_turn", content: [{ type: "text", text }] });
const use = (id, name, input = {}) => ({ stop_reason: "tool_use", content: [{ type: "tool_use", id, name, input }] });
const tool = (run) => ({ description: "", input_schema: { type: "object", properties: {} }, run });

test("retries transient model errors, then gives up on persistent ones", async () => {
  let n = 0;
  const flaky = async () => (++n < 3 ? Promise.reject(Object.assign(new Error("529"), { transient: true })) : end("ok"));
  assert.strictEqual((await createAgent({ model: flaky, retries: 2, ...noSleep }).run("hi")).text, "ok");

  const down = async () => Promise.reject(Object.assign(new Error("529"), { transient: true }));
  await assert.rejects(createAgent({ model: down, retries: 2, ...noSleep }).run("hi"), /529/);
});

test("denied tools never execute; the model is told why", async () => {
  let ran = false;
  const seen = [];
  const model = async (msgs) => (msgs.length === 1 ? use("t1", "delete_all") : end("ok"));
  await createAgent({
    model,
    tools: { delete_all: tool(() => (ran = true)) },
    permissions: { deny: ["delete_all"] },
    hooks: { onToolCall: (e) => seen.push(e.output) },
  }).run("go");
  assert.strictEqual(ran, false);
  assert.match(seen[0], /BLOCKED/);
});

test("maxTurns stops a runaway loop", async () => {
  const loopForever = async () => use(`t${Math.random()}`, "noop");
  await assert.rejects(createAgent({ model: loopForever, tools: { noop: tool(() => "x") }, maxTurns: 3 }).run("go"), /3 turns/);
});

test("old tool output is trimmed from context", async () => {
  let n = 0;
  let lastMessages;
  const model = async (msgs) => ((lastMessages = msgs), ++n <= 5 ? use(`t${n}`, "big") : end("done"));
  await createAgent({ model, tools: { big: tool(() => "x".repeat(1000)) }, maxToolResults: 2 }).run("go");
  const results = lastMessages.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((b) => b.type === "tool_result");
  assert.strictEqual(results.filter((r) => r.content.startsWith("[trimmed")).length, 3);
});

test("sessions can be resumed from disk", async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "afz6-")), "s.json");
  await createAgent({ model: async () => end("first"), sessionFile: file }).run("remember: blue");
  const r = await createAgent({
    model: async (msgs) => end(msgs.some((m) => m.content === "remember: blue") ? "you said blue" : "no memory"),
    sessionFile: file,
  }).run("what did I say?", { resume: true });
  assert.strictEqual(r.text, "you said blue");
});

test("a tool that throws doesn't crash the loop", async () => {
  const outputs = [];
  const model = async (msgs) => (msgs.length === 1 ? use("t1", "boom") : end("recovered"));
  const r = await createAgent({
    model,
    tools: { boom: tool(() => { throw new Error("disk full"); }) },
    hooks: { onToolCall: (e) => outputs.push(e.output) },
  }).run("go");
  assert.strictEqual(r.text, "recovered");
  assert.match(outputs[0], /ERROR: disk full/);
});
