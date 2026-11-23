# Part 6: SDK

> You built an agent loop by hand. It's 3 a.m. It's looping. 😅

🎬 Reel: [Your DIY loop now needs context management, retries, permissions, sessions…](https://www.instagram.com/stok.eed/reel/DereHM3TwS3/)

## The idea

Part 3's loop is ~20 lines. Production needs much more around it. Agent SDKs (for example the Claude Agent SDK, OpenAI Agents SDK, Google ADK, LangGraph) package that work. Before adopting one, it helps to know **what** it is doing for you, so `mini-sdk.js` builds each piece by hand:

| 3 a.m. problem | What the SDK layer does | Tested |
|---|---|---|
| It never stops | `maxTurns` hard stop | ✅ |
| The API sneezed | retries transient errors with backoff, fails fast on persistent ones | ✅ |
| It tried `rm -rf` | permissions: `deny`, `ask` + approval callback; the model is told why | ✅ |
| It forgot the task | context management: old tool output trimmed | ✅ |
| The laptop slept | sessions: saved every turn, resumable | ✅ |
| A tool threw | tool errors go back to the model instead of crashing the loop | ✅ |
| "What did it do?" | hooks: `onToolCall`, `onRetry` for logging and audit | demo |

## Run it

```bash
node demo.js
node --test
```

```
  RETRY  attempt 1 after "529 overloaded"
  TOOL   run_shell({"cmd":"rm -rf build/"}) -> BLOCKED: run_shell needs human approval
  TOOL   run_tests({}) -> PASS: 12 tests
  MODEL  Tests pass. No files deleted.
```

## When to use a real SDK

Use one in production: it adds streaming, tracing, sub-agents and years of edge cases this teaching version skips. Build the mini version once so you can **debug** the real one.

**Series complete.** Start again from [Part 1](../part-1-model) and watch each piece get added.
