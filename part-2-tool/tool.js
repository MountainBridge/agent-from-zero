// Part 2: Tool
// The model requests a tool. Our application executes it and sends the result back.
// There is deliberately no loop yet. That is Part 3: Agent.

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
    body: JSON.stringify({ model: MODEL, max_tokens: 500, tools: definitions, messages }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function mockModel(messages) {
  if (messages.length === 1) {
    return {
      stop_reason: "tool_use",
      content: [
        { type: "text", text: "Let me look at the file first." },
        { type: "tool_use", id: "toolu_1", name: "read_file", input: { path: "checkout.js" } },
      ],
    };
  }
  return {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "tax is never defined. I will add it." },
      {
        type: "tool_use",
        id: "toolu_2",
        name: "edit_file",
        input: { path: "checkout.js", old_text: "total = total + tax;", new_text: "const tax = total * 0.18;\n  total = total + tax;" },
      },
    ],
  };
}

const show = (label, value) =>
  console.log(`${label.padEnd(12)}${typeof value === "string" ? value : JSON.stringify(value)}`);

async function main({ root, quiet } = {}) {
  const { definitions, run } = createTools(root);
  const log = quiet ? () => {} : show;
  if (!quiet) console.log(MOCK ? "(mock mode)\n" : `(model: ${MODEL})\n`);

  const messages = [{ role: "user", content: "My test fails with 'tax is not defined'. Fix checkout.js." }];

  const reply1 = await callModel(messages, definitions);
  const call = reply1.content.find((b) => b.type === "tool_use");
  if (!call || !run[call.name]) throw new Error("Model did not request a known tool.");
  log("MODEL ->", reply1.content.find((b) => b.type === "text")?.text || "");
  log("ASKS FOR ->", { tool: call.name, input: call.input });

  const result = run[call.name](call.input); // the APPLICATION executes, not the model
  log("CODE RAN ->", `${call.name} -> ${result.split("\n").length} lines`);

  messages.push({ role: "assistant", content: reply1.content });
  messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: call.id, content: result }] });

  const reply2 = await callModel(messages, definitions);
  const next = reply2.content.find((b) => b.type === "tool_use");
  log("MODEL ->", reply2.content.find((b) => b.type === "text")?.text || "");
  if (next) log("ASKS FOR ->", { tool: next.name, input: next.input });

  if (!quiet) {
    console.log("\nThe model decides. Your code does.");
    console.log("The script stops here because there is no loop yet. Part 3 adds the agent loop.");
  }
  return { executed: [call.name], pending: next && next.name };
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { main };
