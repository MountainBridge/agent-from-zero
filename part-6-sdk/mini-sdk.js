// Part 6: SDK
// The same loop as Part 3, plus everything a hand-written loop needs before production.
// This is what agent SDKs package for you. Built by hand here so each piece is visible.

const fs = require("node:fs");

function createAgent({
  model,                 // async (messages, toolDefs) => { stop_reason, content }
  tools = {},            // { name: { description, input_schema, run(input) } }
  permissions = {},      // { deny: [name], ask: [name], approve: (name, input) => boolean }
  maxTurns = 10,         // 1. a hard stop
  retries = 2,           // 2. transient model errors are retried with backoff
  maxToolResults = 6,    // 3. context management: old tool output is trimmed
  sessionFile,           // 4. sessions: conversation saved after every turn, resumable
  hooks = {},            // 5. hooks: observe or audit every tool call
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const defs = Object.entries(tools).map(([name, t]) => ({ name, description: t.description, input_schema: t.input_schema }));

  async function callWithRetry(messages) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await model(messages, defs);
      } catch (e) {
        if (!e.transient || attempt >= retries) throw e;
        hooks.onRetry?.({ attempt: attempt + 1, error: e.message });
        await sleep(100 * 2 ** attempt);
      }
    }
  }

  function allowed(name, input) {
    if (permissions.deny?.includes(name)) return { ok: false, reason: `${name} is denied by policy` };
    if (permissions.ask?.includes(name) && !permissions.approve?.(name, input))
      return { ok: false, reason: `${name} needs human approval` };
    return { ok: true };
  }

  function trimContext(messages) {
    let seen = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!Array.isArray(messages[i].content)) continue;
      for (const block of messages[i].content) {
        if (block.type !== "tool_result") continue;
        if (++seen > maxToolResults && !String(block.content).startsWith("[trimmed")) {
          block.content = `[trimmed: ${String(block.content).length} chars of old tool output]`;
        }
      }
    }
  }

  const save = (messages) => sessionFile && fs.writeFileSync(sessionFile, JSON.stringify(messages, null, 2));
  const load = () => (sessionFile && fs.existsSync(sessionFile) ? JSON.parse(fs.readFileSync(sessionFile, "utf8")) : []);

  return {
    async run(prompt, { resume = false } = {}) {
      const messages = resume ? load() : [];
      if (prompt) messages.push({ role: "user", content: prompt });

      for (let turn = 1; turn <= maxTurns; turn++) {
        trimContext(messages);
        const reply = await callWithRetry(messages);
        messages.push({ role: "assistant", content: reply.content });
        save(messages);
        if (reply.stop_reason !== "tool_use") {
          return { text: reply.content.find((b) => b.type === "text")?.text, turns: turn, messages };
        }
        const results = [];
        for (const call of reply.content.filter((b) => b.type === "tool_use")) {
          const gate = allowed(call.name, call.input);
          let output;
          if (!gate.ok) output = `BLOCKED: ${gate.reason}`;
          else if (!tools[call.name]) output = `Unknown tool ${call.name}`;
          else {
            try {
              output = String(await tools[call.name].run(call.input));
            } catch (e) {
              output = `ERROR: ${e.message}`; // tool errors go back to the model, they don't crash the loop
            }
          }
          hooks.onToolCall?.({ name: call.name, input: call.input, output, allowed: gate.ok });
          results.push({ type: "tool_result", tool_use_id: call.id, content: output });
        }
        messages.push({ role: "user", content: results });
        save(messages);
      }
      throw new Error(`Stopped after ${maxTurns} turns`);
    },
  };
}

module.exports = { createAgent };
