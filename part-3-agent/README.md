# Part 3: Agent

> ChatGPT answers. Claude Code fixes bugs. The difference? **A loop.**

🎬 Reel: [An agent is a model, tools and a loop](https://www.instagram.com/stok.eed/reel/DeoNS_GzWXA/)

## The idea

Part 2 stopped after one tool call. Part 3 adds the orchestrator that keeps going:

```
while (not done and turns < max) {
  reply  = model(messages)          // ASK: model picks the next step
  if (no tool requested) break      // DONE
  output = run(tool, input)         // ACT: your code executes
  messages.push(output)             // OBSERVE: result goes back
}
```

## Run it

```bash
node agent.js --mock
node --test
```

```
turn 1  MODEL   First, reproduce the failure.
        TOOL    run_tests -> FAIL: tax is not defined
turn 2  MODEL   It fails. Let me read the code.
        TOOL    read_file -> // Deliberately broken example...
turn 3  MODEL   `tax` is never defined. Adding it.
        TOOL    edit_file -> edited
turn 4  MODEL   Now verify the fix.
        TOOL    run_tests -> PASS: checkout returned 118
turn 5  MODEL   Tests pass. checkout.js is fixed.
```

## What to notice

- The model never touches the file. The loop calls the tools.
- **Evidence before "done":** the agent reruns the tests after editing.
- **`maxTurns` is a hard stop.** A loop without an exit is an incident waiting for 3 a.m. (tested).

**Next: [Part 4, MCP](../part-4-mcp)**: what if the tools live in another process, or another team's server?
