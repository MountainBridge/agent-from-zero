// Part 1: Model
// Text in, text out. The model can explain the fix, but it cannot apply it.

const fs = require("node:fs");
const path = require("node:path");

const MOCK = process.argv.includes("--mock") || !process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL;

async function callModel(prompt) {
  if (MOCK) {
    return "`tax` is used but never defined. Add `const tax = total * 0.18;` before it is used.";
  }
  if (!MODEL) throw new Error("Set MODEL to an Anthropic model ID when using a real API key.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.map((b) => b.text || "").join("");
}

async function main() {
  const code = fs.readFileSync(path.join(__dirname, "checkout.js"), "utf8");
  console.log(MOCK ? "(mock mode)\n" : `(model: ${MODEL})\n`);

  // You are the "agent" here: you copy the code in...
  const prompt = `My test fails with "tax is not defined". Here is checkout.js:\n\n${code}`;
  const answer = await callModel(prompt);

  console.log("MODEL ->", answer);
  console.log("\nThe model knows the fix. It cannot open, edit or test the file.");
  console.log("You copy, paste, run and paste the error back. You are doing the agent's job by hand.");
  console.log("Part 2 gives the model tools.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { callModel };
