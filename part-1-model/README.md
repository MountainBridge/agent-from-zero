# Part 1: Model

> Text in, text out. It knows the fix. It cannot apply it.

🎬 Reel: [Every time you copy code from an AI chat… you're doing an agent's job by hand](https://www.instagram.com/stok.eed/reel/DeM-7ogzYAP/)

## The idea

A model receives text and returns text. Ask it about a broken `checkout.js` and it can tell you exactly what is wrong. But it cannot open the file, change it or run the tests. **You** carry the code in and carry the answer out.

## Run it

```bash
node model.js --mock        # no API key needed
node --test                 # proves nothing on disk changed
```

Real call (optional): `export ANTHROPIC_API_KEY=... MODEL=<current model id>` then `node model.js`.

## What to notice

| Step | Who does it |
|---|---|
| Read the file | you |
| Decide the fix | **model** |
| Edit the file | you |
| Run the tests | you |

Three of the four steps are yours. **Next: [Part 2, Tool](../part-2-tool)** hands the model a way to ask for them.
