import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "docs/project-status.md",
  "docs/decisions.md",
  "docs/next-session.md",
  "docs/content-index.md",
  "docs/playtest-findings.md",
  "docs/tooling.md",
  ".agents/koryto-skill-stack.json",
  ".agents/skills/koryto-quest-designer/SKILL.md",
  ".agents/skills/koryto-playtest-auditor/SKILL.md",
  ".agents/skills/koryto-release-gate/SKILL.md"
];

for (const file of requiredFiles) {
  const info = await stat(file);
  assert(info.isFile(), `${file} must be a file`);
  const content = await readFile(file, "utf8");
  assert(content.trim().length > 40, `${file} is unexpectedly empty`);
  assert(!content.includes("TODO:"), `${file} contains an unresolved TODO`);
}

const stack = JSON.parse(await readFile(".agents/koryto-skill-stack.json", "utf8"));
assert.equal(stack.version, 1, "unexpected skill stack version");
assert.equal(stack.local.length, 3, "exactly three local Koryto skills are required");
assert(new Set(stack.local).size === stack.local.length, "local skill paths must be unique");

for (const path of stack.local) {
  const skill = await readFile(`${path}/SKILL.md`, "utf8");
  assert(/^---\nname: koryto-[a-z-]+\ndescription: .+\n---/s.test(skill), `${path} has invalid skill frontmatter`);
}

console.log(`Project memory and ${stack.local.length} local skills validated.`);
