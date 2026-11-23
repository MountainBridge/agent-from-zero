// Part 5: Skills
// Same loop as Part 3. Two runs of the same request:
//   1. tools only          -> the agent has every tool and still does it wrong
//   2. tools + skills      -> it loads the refund policy first and follows it

const path = require("node:path");
const { loadSkills } = require("./skills.js");
const ORDERS = require("./orders.json");

function createTools(skills, actions) {
  return {
    load_skill: ({ name }) => skills?.get(name) ?? `No skill named ${name}`,
    get_order: ({ id }) => JSON.stringify(ORDERS[id] ? { id, ...ORDERS[id] } : { error: "not found" }),
    issue_refund: ({ id }) => (actions.push(`issue_refund:${id}`), `Refunded order ${id}`),
    offer_store_credit: ({ id }) => (actions.push(`offer_store_credit:${id}`), `Store credit offered for order ${id}`),
  };
}

// Scripted stand-in for a model. Crucially, its behaviour comes from what it has READ:
// with no policy loaded it takes the obvious action; with the policy loaded it applies the rules in it.
function mockModel({ request, skillIndex, observations }) {
  const policy = observations.find((o) => o.startsWith("# Refund policy"));
  const order = observations.map((o) => { try { return JSON.parse(o); } catch { return null; } }).find((o) => o && o.id);
  const acted = observations.some((o) => /Refunded|Store credit|Refused/.test(o));

  if (acted) return { done: "Replied to the customer." };
  if (!skillIndex) return { call: ["issue_refund", { id: request.orderId }], text: "Customer wants a refund. Refunding." };
  if (!policy && /refund-policy/.test(skillIndex))
    return { call: ["load_skill", { name: "refund-policy" }], text: "A refund is involved. Loading the refund policy first." };
  if (!order) return { call: ["get_order", { id: request.orderId }], text: "Policy rule 1: look up the order." };

  const windowDays = Number((policy.match(/(\d+) days/) || [])[1]);
  if (order.customer !== request.customerId) return { done: "Refused: order does not belong to this customer (rule 2)." };
  if (order.daysSinceDelivery > windowDays)
    return { call: ["offer_store_credit", { id: order.id }], text: `Delivered ${order.daysSinceDelivery} days ago, window is ${windowDays}. Rule 4: store credit.` };
  return { call: ["issue_refund", { id: order.id }], text: `Within ${windowDays} days. Refunding.` };
}

async function run({ withSkills, request, log = console.log, maxTurns = 8 }) {
  const skills = withSkills ? loadSkills() : null;
  const actions = [];
  const tools = createTools(skills, actions);
  const observations = [];
  const trace = [];
  for (let turn = 1; turn <= maxTurns; turn++) {
    const step = mockModel({ request, skillIndex: skills?.index, observations });
    if (step.done) {
      log(`  MODEL  ${step.done}`);
      return { actions, trace };
    }
    const [name, input] = step.call;
    log(`  MODEL  ${step.text}`);
    const out = tools[name](input);
    trace.push(name);
    log(`  TOOL   ${name}(${JSON.stringify(input)}) -> ${out.split("\n")[0]}`);
    observations.push(out);
  }
  return { actions, trace };
}

if (require.main === module) {
  (async () => {
    const request = { customerId: "C-7", orderId: "1042", text: "Please refund my shoes." };
    const s = loadSkills();
    console.log(`Request: ${request.text} (order ${request.orderId}, delivered 40 days ago)\n`);
    console.log("1) Tools only");
    await run({ withSkills: false, request });
    console.log("\n2) Tools + skills");
    console.log(`  (context sent every turn: skill index = ${s.index.length} chars; loading every skill up front would cost ${s.fullText.length})`);
    await run({ withSkills: true, request });
  })();
}

module.exports = { run };
