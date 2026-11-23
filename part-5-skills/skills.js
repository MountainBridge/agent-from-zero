// Part 5: Skills
// Know-how lives in SKILL.md files. The agent sees only each skill's name + description (cheap),
// and loads the full instructions only when it decides it needs them (progressive disclosure).

const fs = require("node:fs");
const path = require("node:path");

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing frontmatter in ${file}`);
  const meta = Object.fromEntries(
    m[1].split("\n").map((l) => {
      const i = l.indexOf(":");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
  );
  return { name: meta.name, description: meta.description, body: m[2].trim() };
}

function loadSkills(dir = path.join(__dirname, "skills")) {
  const skills = fs
    .readdirSync(dir)
    .map((d) => path.join(dir, d, "SKILL.md"))
    .filter((f) => fs.existsSync(f))
    .map(parse);
  return {
    index: skills.map(({ name, description }) => `- ${name}: ${description}`).join("\n"),
    fullText: skills.map((s) => s.body).join("\n\n"),
    get: (name) => skills.find((s) => s.name === name)?.body,
  };
}

module.exports = { loadSkills };
