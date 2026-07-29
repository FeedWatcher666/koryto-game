import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";
import {dirname, resolve} from "node:path";

const requiredFiles = [
  "AGENTS.md",
  "docs/project-status.md",
  "docs/decisions.md",
  "docs/next-session.md",
  "docs/content-index.md",
  "docs/playtest-findings.md",
  "docs/tooling.md",
  "docs/visual-direction.md",
  ".agents/koryto-skill-stack.json",
  ".github/dependabot.yml",
  ".github/pull_request_template.md",
  ".agents/skills/koryto-quest-designer/SKILL.md",
  ".agents/skills/koryto-quest-designer/references/quest-contract.md",
  ".agents/skills/koryto-ui-director/SKILL.md",
  ".agents/skills/koryto-ui-director/agents/openai.yaml",
  ".agents/skills/koryto-ui-director/references/visual-contract.md",
  ".agents/skills/koryto-playtest-auditor/SKILL.md",
  ".agents/skills/koryto-playtest-auditor/references/severity-and-personas.md",
  ".agents/skills/koryto-release-gate/SKILL.md",
  ".agents/skills/koryto-release-gate/references/release-contract.md",
  "docs/visual-references/map-desktop.jpeg",
  "docs/visual-references/debate.jpeg",
  "docs/visual-references/event-choice.jpeg",
  "docs/visual-references/inventory.jpeg",
  "docs/visual-references/party.jpeg",
  "docs/visual-references/election-night.jpeg"
];

for (const file of requiredFiles) {
  const info = await stat(file);
  assert(info.isFile(), `${file} must be a file`);
  if (!file.endsWith(".jpeg")) {
    const content = await readFile(file, "utf8");
    assert(content.trim().length > 40, `${file} is unexpectedly empty`);
    assert(!content.includes("TODO:"), `${file} contains an unresolved TODO`);
  } else {
    assert(info.size > 100_000, `${file} is unexpectedly small`);
  }
}

const stack = JSON.parse(await readFile(".agents/koryto-skill-stack.json", "utf8"));
assert.equal(stack.version, 2, "unexpected skill stack version");
assert.equal(stack.local.length, 4, "exactly four local Koryto skills are required");
assert(new Set(stack.local).size === stack.local.length, "local skill paths must be unique");

for (const path of stack.local) {
  const skill = await readFile(`${path}/SKILL.md`, "utf8");
  assert(/^---\nname: koryto-[a-z-]+\ndescription: [^\n]+\n---\n/s.test(skill), `${path} has invalid skill frontmatter`);
  assert(skill.length < 10_000, `${path} is too large for focused context`);
}

const markdownFiles = requiredFiles.filter((file) => file.endsWith(".md"));
for (const file of markdownFiles) {
  const markdown = await readFile(file, "utf8");
  const links = [...markdown.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^(?:https?:|mailto:|#)/.test(link)) continue;
    const target = resolve(dirname(file), link.split("#")[0]);
    const info = await stat(target);
    assert(info.isFile(), `${file} references missing file ${link}`);
  }
}

console.log(`Project memory and ${stack.local.length} local skills validated.`);
