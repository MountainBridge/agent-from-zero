// Part 6 demo: the same mini-SDK surviving the 3 a.m. problems from the reel.

const os = require("node:os");
const path = require("node:path");
const { createAgent } = require("./mini-sdk.js");

const transient = (msg) => Object.assign(new Error(msg), { transient: true });
const toolUse = (id, name, input, text) => ({
  stop_reason: "tool_use",
  content: [{ type: "text", text }, { type: "tool_use", id, name, input }],
});

// A scripted model that (1) hits a flaky API once, (2) tries something dangerous, (3) recovers.
function scriptedModel() {
  let calls = 0;
  return async (messages) => {
    calls++;
    if (calls === 1) throw transient("529 overloaded");
    const results = messages.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((b) => b.type === "tool_result");
    if (results.length === 0) return toolUse("t1", "run_shell", { cmd: "rm -rf build/" }, "Clean the build folder first.");
    if (results.length === 1) return toolUse("t2", "run_tests", {}, "Blocked. Fine, just run the tests.");
    return { stop_reason: "end_turn", content: [{ type: "text", text: "Tests pass. No files deleted." }] };
  };
}

async function main() {
  const sessionFile = path.join(os.tmpdir(), "afz-session.json");
  const agent = createAgent({
    model: scriptedModel(),
    tools: {
      run_tests: { description: "Run tests", input_schema: { type: "object", properties: {} }, run: () => "PASS: 12 tests" },
      run_shell: { description: "Run a shell command", input_schema: { type: "object", properties: { cmd: { type: "string" } } }, run: () => "should never run" },
    },
    permissions: { ask: ["run_shell"], approve: (name, input) => !/rm\s+-rf/.test(input.cmd) },
    sessionFile,
    hooks: {
      onRetry: ({ attempt, error }) => console.log(`  RETRY  attempt ${attempt} after "${error}"`),
      onToolCall: ({ name, input, output }) => console.log(`  TOOL   ${name}(${JSON.stringify(input)}) -> ${output}`),
    },
  });
  const r = await agent.run("Make sure the build is green.");
  console.log(`  MODEL  ${r.text}`);
  console.log(`\nDone in ${r.turns} turns. Session saved to ${sessionFile} (resumable).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
