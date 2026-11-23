// Part 3: Agent
// An agent is a model, tools and a LOOP: ask -> act -> observe -> repeat, until done.

const { createTools } = require("./tools.js");

const MOCK = process.argv.includes("--mock") || !process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL;

async function callModel(messages, definitions) {
  if (MOCK) return mockModel(messages);
  if (!MODEL) throw new Error("Set MODEL to an Anthropic model ID when using a real API key.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 800, tools: definitions, messages }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// A scripted stand-in for a real model. It decides the next step from what it has observed so far,
// which is exactly the job a real model does inside the loop.
function mockModel(messages) {
  const results = messages
    .filter((m) => Array.isArray(m.content))
    .flatMap((m) => m.content)
    .filter((b) => b.type === "tool_result")
    .map((b) => String(b.content));
  const last = results[results.length - 1] || "";
  const use = (name, input, text) => ({
    stop_reason: "tool_use",
    content: [{ type: "text", text }, { type: "tool_use", id: `toolu_${results.length + 1}`, name, input }],
  });

  if (results.length === 0) return use("run_tests", {}, "First, reproduce the failure.");
  if (last.startsWith("FAIL") && !results.some((r) => r.includes("function checkout")))
    return use("read_file", { path: "checkout.js" }, "It fails. Let me read the code.");
  if (last.includes("function checkout"))
    return use(
      "edit_file",
      { path: "checkout.js", old_text: "total = total + tax;", new_text: "const tax = total * 0.18;\n  total = total + tax;" },
      "`tax` is never defined. Adding it."
    );
  if (last === "edited") return use("run_tests", {}, "Now verify the fix.");
  return { stop_reason: "end_turn", content: [{ type: "text", text: "Tests pass. checkout.js is fixed." }] };
}

async function runAgent({ root, maxTurns = 10, log = console.log } = {}) {
  const { definitions, run } = createTools(root);
  const messages = [{ role: "user", content: "My test fails with 'tax is not defined'. Fix checkout.js and prove it." }];
  const trace = [];

  for (let turn = 1; turn <= maxTurns; turn++) {
    const reply = await callModel(messages, definitions); // ASK
    messages.push({ role: "assistant", content: reply.content });
    const text = reply.content.find((b) => b.type === "text")?.text || "";
    log(`turn ${turn}  MODEL   ${text}`);

    if (reply.stop_reason !== "tool_use") return { done: true, turns: turn, trace }; // DONE

    const results = [];
    for (const call of reply.content.filter((b) => b.type === "tool_use")) {
      const output = run[call.name] ? run[call.name](call.input) : `Unknown tool ${call.name}`; // ACT
      trace.push(call.name);
      log(`        TOOL    ${call.name} -> ${output.split("\n")[0]}`);
      results.push({ type: "tool_result", tool_use_id: call.id, content: output });
    }
    messages.push({ role: "user", content: results }); // OBSERVE, then repeat
  }
  return { done: false, turns: maxTurns, trace }; // a loop always needs a way out
}

if (require.main === module) {
  // Work on a scratch copy so the broken example stays broken for the next run.
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-"));
  fs.copyFileSync(path.join(__dirname, "checkout.js"), path.join(root, "checkout.js"));
  console.log(MOCK ? "(mock mode)" : `(model: ${MODEL})`, `working copy: ${root}\n`);
  runAgent({ root })
    .then((r) => console.log(`\n${r.done ? "Done" : "Stopped at max turns"} after ${r.turns} turns: ${r.trace.join(" -> ")}`))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}

module.exports = { runAgent };
