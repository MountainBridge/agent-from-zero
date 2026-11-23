# Part 5: Skills

> Your AI agent has every tool… and still does it wrong. Tools aren't know-how.

🎬 Reels: [Tools aren't know-how](https://www.instagram.com/stok.eed/reel/Deq6Idmzwa0/) · [Your AI support bot just refunded the wrong customer](https://www.instagram.com/stok.eed/reel/DetIeEezxsJ/)

## The idea

A support agent with `issue_refund` will happily refund. Whether it **should** is team know-how: windows, ownership checks, what to offer instead. Two ways to give it that:

| | One giant system prompt | Skills |
|---|---|---|
| What's sent every turn | every rule for every situation | only each skill's name + one-line description |
| When full rules load | always | when the agent decides it needs them (`load_skill`) |
| Who can update the rules | whoever edits the prompt | anyone, by editing a `SKILL.md` |

```
skills/
  refund-policy/SKILL.md   ← "Refund window: 30 days… outside it, offer store credit"
  tone-of-voice/SKILL.md
```

## Run it

```bash
node agent.js
node --test
```

```
1) Tools only
  MODEL  Customer wants a refund. Refunding.
  TOOL   issue_refund({"id":"1042"}) -> Refunded order 1042          ✗ 40 days old

2) Tools + skills
  MODEL  A refund is involved. Loading the refund policy first.
  TOOL   load_skill({"name":"refund-policy"}) -> # Refund policy
  MODEL  Policy rule 1: look up the order.
  TOOL   get_order({"id":"1042"}) -> {...,"daysSinceDelivery":40}
  MODEL  Delivered 40 days ago, window is 30. Rule 4: store credit.
  TOOL   offer_store_credit({"id":"1042"})                              ✓
```

Try it: change `30 days` to `60 days` in `refund-policy/SKILL.md` and run again. The behaviour changes **without touching code**.

The tests prove four cases: refunds outside the window are blocked, other customers' orders are refused, recent orders are refunded, and the always-on context stays small.

**Next: [Part 6, SDK](../part-6-sdk)**: you built the loop by hand. It's 3 a.m. It's looping.
