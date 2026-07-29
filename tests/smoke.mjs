import assert from "node:assert/strict";
import fs from "node:fs";
import {CLASSES, COMPANIONS, FIRST_CHECKS, REGISTRATION_CHECKS, VERSION} from "../src/data.js";
import {
  JZD_APPROACH_CHECKS,
  JZD_FINAL_CHECKS,
  JZD_ITEMS,
  JZD_SEARCH_CHECKS,
  applyJzdCheck,
  applyJzdRivalChoice,
  choicesForJzd,
  startJzdQuest
} from "../src/quest-jzd.js";
import {
  activePartyIds,
  checkModifiers,
  deriveAttributes,
  formatRollExpression,
  outcomeLevel,
  resolveCheck,
  resolveRollMode
} from "../src/rules.js";
import {createInitialState, SAVE_SCHEMA, STORAGE_KEY} from "../src/state.js";

function sequence(values) {
  let index = 0;
  return () => (values[Math.min(index++, values.length - 1)] - 0.01) / 20;
}

assert.equal(VERSION, "0.20.0-clean-test.6");
assert.equal(SAVE_SCHEMA, 2);
assert.equal(STORAGE_KEY, "koryto.clean.v0200");
assert.deepEqual(Object.keys(CLASSES), ["bard", "paladin", "rogue"]);
assert.deepEqual(Object.keys(COMPANIONS), ["marie", "bohumil", "radek"]);
assert.doesNotMatch(CLASSES.bard.perk, /jednou za scénu|změnit komplikaci/i, "class card must not advertise an unimplemented conversion");
assert.doesNotMatch(CLASSES.rogue.perk, /odhalit skrytý modifikátor/i, "rogue card must not advertise an unavailable reveal action");
assert.doesNotMatch(CLASSES.rogue.weakness, /kritické jedničce|vydíratelnost/i, "rogue card must not advertise an unavailable critical consequence");
assert.equal(FIRST_CHECKS.length, 3);
assert.equal(FIRST_CHECKS[2].id, "follow-folders");
assert.equal(REGISTRATION_CHECKS.length, 3);
assert.equal(JZD_APPROACH_CHECKS.length, 3);
assert.equal(JZD_SEARCH_CHECKS.length, 3);
assert.equal(JZD_FINAL_CHECKS.length, 3);
assert.deepEqual(Object.keys(JZD_ITEMS), ["recorder", "archiveKey", "thermos"]);

const attrs = deriveAttributes("bard", "idealist");
assert.equal(attrs.media, 5);
assert.equal(attrs.morality, 4);
assert.equal(outcomeLevel(20, 20, 30), "critical");
assert.equal(outcomeLevel(1, 99, 10), "complication");

const state = createInitialState();
state.screen = "game";
state.hero.attributes = attrs;
const advantage = resolveCheck(state, FIRST_CHECKS[0], sequence([4, 17]));
assert.equal(advantage.roll, 17);
assert.equal(advantage.rollNotation, "2d20kh1");
assert.match(formatRollExpression(advantage), /ponecháno 17/);

state.party.active = "marie";
state.party.members = ["marie"];
let questState = startJzdQuest(state);
questState.quest.party = ["marie", "radek"];
questState.quest.itemId = "archiveKey";
assert.deepEqual(activePartyIds(questState), ["marie", "radek"]);

const workerChoice = choicesForJzd(questState, "search").find(choice => choice.id === "worker-testimony");
const workerModifiers = checkModifiers(questState, workerChoice);
assert.equal(workerModifiers.companionContribution.id, "radek");
assert.equal(workerModifiers.companionContribution.value, 2);
assert.equal(
  workerModifiers.modifierBreakdown.filter(item => item.id.startsWith("companion-")).length,
  1,
  "only one strongest companion contribution may be applied"
);

const paladinState = createInitialState();
paladinState.hero.classId = "paladin";
paladinState.resources.debt = 2;
let paladinQuest = startJzdQuest(paladinState);
const honestOathCheck = {id: "oath-test", label: "Čestná zkouška", attribute: "morality", dc: 10, honest: true};
assert.equal(resolveRollMode(paladinQuest, honestOathCheck).mode, "advantage", "debt from earlier scenes must not suppress the current chapter oath");
paladinQuest = applyJzdRivalChoice(paladinQuest, "play-along");
assert.equal(resolveRollMode(paladinQuest, honestOathCheck).mode, "normal", "accepting debt in JZD must suppress the oath for later checks");

const approachChoice = choicesForJzd(questState, "approach").find(choice => choice.id === "archive-door");
const approachMode = resolveRollMode(questState, approachChoice);
assert.equal(approachMode.mode, "advantage");
assert.ok(approachMode.advantageSources.some(source => /Marie|Radek|Klíč/.test(source)));
const approachResult = resolveCheck(questState, approachChoice, sequence([5, 16]));
questState = applyJzdCheck(questState, approachResult, "jzd-approach", approachChoice);
assert.equal(questState.scene, "jzdApproachResult");
assert.ok(questState.quest.evidence >= 1);
assert.equal(questState.actions, 2);

const searchChoice = choicesForJzd(questState, "search").find(choice => choice.id === "ledger-trail");
const searchResult = resolveCheck(questState, searchChoice, sequence([6, 18]));
questState = applyJzdCheck(questState, searchResult, "jzd-search", searchChoice);
assert.equal(questState.scene, "jzdSearchResult");
assert.ok(questState.quest.evidence >= 4);
assert.ok(questState.quest.consequences.some(item => /účetní knihy/.test(item)));

questState = applyJzdRivalChoice(questState, "protect-workers");
assert.equal(questState.scene, "jzdFinal");
assert.ok(questState.quest.workerTrust >= 2);
const finalChoice = choicesForJzd(questState, "final").find(choice => choice.id === "council-ambush");
assert.ok(finalChoice.dc <= 10, "evidence and worker protection reduce final difficulty");
const finalResult = resolveCheck(questState, finalChoice, sequence([7, 17]));
questState = applyJzdCheck(questState, finalResult, "jzd-final", finalChoice);
assert.equal(questState.scene, "jzdFinalResult");
assert.equal(questState.quest.ending, "council-ambush");
assert.ok(questState.quest.endingTitle);
assert.ok(questState.quest.consequences.length >= 3);

const dice = fs.readFileSync(new URL("../src/dice.js", import.meta.url), "utf8");
const physics = fs.readFileSync(new URL("../src/dice-physics.js", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../src/ui.js", import.meta.url), "utf8");
const quest = fs.readFileSync(new URL("../src/quest-jzd.js", import.meta.url), "utf8");
const questCss = fs.readFileSync(new URL("../styles/quest-jzd.css", import.meta.url), "utf8");
const pagesWorkflow = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const cleanWorkflow = fs.readFileSync(new URL("../.github/workflows/clean-rewrite.yml", import.meta.url), "utf8");
const gitignore = fs.readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
assert.match(dice, /dice-rack/);
assert.match(dice, /finally\s*{/);
assert.match(dice, /node\.inert = true/);
assert.match(dice, /tabindex="-1"/);
assert.match(physics, /FACE_NUMBERS/);
assert.match(physics, /worn-bakelite/);
assert.match(main, /state\.flags\.lastResult\?\.choiceId/);
assert.match(main, /next\.party\.members = \[\.\.\.next\.quest\.party\]/);
assert.match(main, /data-quest-companion/);
assert.match(main, /data-quest-item/);
assert.match(main, /aria-pressed/);
assert.match(ui, /Zahájit výpravu do JZD/);
assert.match(ui, /Vyberte přesně dva společníky/);
assert.match(ui, /PROTIAKCE VLADIMÍRA VĚČNÉHO/);
assert.match(ui, /CO SE VRÁTÍ POZDĚJI/);
assert.match(quest, /applyJzdRivalChoice/);
assert.match(quest, /Krajský audit/);
assert.match(questCss, /quest-companion-grid/);
assert.match(questCss, /rival-choice-grid/);
assert.doesNotMatch(pagesWorkflow, /workflow_dispatch/, "manual Pages deployment must not bypass the green-run gate");
assert.match(pagesWorkflow, /github\.event\.workflow_run\.head_sha/);
assert.match(pagesWorkflow, /github\.event\.workflow_run\.id/);
assert.match(cleanWorkflow, /steps\.playable\.outputs\.artifact-digest/);
assert.match(cleanWorkflow, /Playable artifact digest/);
for (const generated of ["node_modules/", "dist/", "browser-artifacts/", "lighthouse-artifacts/"]) {
  assert.match(gitignore, new RegExp(`^${generated.replace("/", "\\/")}$`, "m"), `${generated} must stay ignored`);
}

console.log("Koryto CLEAN TEST.6 multi-scene JZD quest tests passed.");
