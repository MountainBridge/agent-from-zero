# Agent from Zero

[![ci](https://github.com/MountainBridge/agent-from-zero/actions/workflows/ci.yml/badge.svg)](https://github.com/MountainBridge/agent-from-zero/actions/workflows/ci.yml)

**Build an AI agent in six runnable parts, adding one idea at a time.** Each part is the code behind an episode of my [@stok.eed](https://www.instagram.com/stok.eed) series, so you can watch the 60-second version and then read every line.

No framework, no dependencies, no API key needed. Node 18+.

## ▶ Try it live, no install

- **In your browser:** [Open in StackBlitz](https://stackblitz.com/github/MountainBridge/agent-from-zero?startScript=demo) runs `npm run demo` in a few seconds.
- **On GitHub:** [Codespaces](https://codespaces.new/MountainBridge/agent-from-zero) gives you a full terminal: run `npm run demo` or `npm test`.
- **Proof it runs:** every push runs all tests and the demo. See the [latest run log](https://github.com/MountainBridge/agent-from-zero/actions/workflows/ci.yml).

📱 Watch the series on Instagram: [@stok.eed](https://www.instagram.com/stok.eed)

```bash
npm test        # 18 tests across all six parts
npm run demo    # runs every part in order
```

## The series

| Part | Idea | One line | Reel |
|---|---|---|---|
| [1 · Model](part-1-model) | text in, text out | It knows the fix. It can't apply it. | [▶](https://www.instagram.com/stok.eed/reel/DeM-7ogzYAP/) |
| [2 · Tool](part-2-tool) | structured requests | The model asks. Your code executes. | [▶](https://www.instagram.com/stok.eed/reel/DehUVBqz27t/) |
| [3 · Agent](part-3-agent) | the loop | Ask → act → observe → repeat, with a hard stop. | [▶](https://www.instagram.com/stok.eed/reel/DeoNS_GzWXA/) |
| [4 · MCP](part-4-mcp) | a standard interface | Tools move to a server any client can discover. | [▶](https://www.instagram.com/stok.eed/reel/DeosdMnzmEj/) |
| [5 · Skills](part-5-skills) | know-how on demand | Every tool, still wrong, until it loads the policy. | [▶](https://www.instagram.com/stok.eed/reel/Deq6Idmzwa0/) |
| [6 · SDK](part-6-sdk) | production concerns | Retries, permissions, context, sessions, hooks. | [▶](https://www.instagram.com/stok.eed/reel/DereHM3TwS3/) |

Not sure you need an agent at all? Start with the [decision map](https://www.instagram.com/stok.eed/reel/DevxjNCzzRP/): if it doesn't need to take an action, a model is enough.

## The mental model

**Model ≠ Tool ≠ Agent**

- **Model:** reasons and chooses the next step.
- **Tool:** a capability your application owns and executes.
- **Agent:** the orchestrator that keeps the cycle going until the job is done, or a limit says stop.

## How this repo was designed

- **Who it's for:** engineers who use AI coding tools daily but have never seen inside one.
- **Their journey:** they watch a reel, get curious, and want to see the real thing in under five minutes.
- **Constraints:** it must run with no API key, no installs and no cost, on any laptop.
- **So:** each part uses a small **scripted model** that makes the decisions a real model would. Parts 1-3 also accept a real Anthropic API key (`ANTHROPIC_API_KEY` + `MODEL`) to swap it in.
- **Evidence:** every claim in a README has a test behind it, and CI runs them on Node 18, 20 and 22.

## Security notes

Tools are the boundary where agents touch real systems. The examples restrict file access to the project folder (tested), block denied tools before execution (tested) and keep a hard turn limit (tested). Production systems should add authentication, audit logging and human approval for anything irreversible.

---

Made by [Nidhi Verma](https://mountainbridge.github.io) · MIT licensed
