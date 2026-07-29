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
import {activePartyIds, deriveAttributes, formatRollExpression, outcomeLevel, resolveCheck, resolveRollMode} from "../src/rules.js";
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
assert.equal(FIRST_CHECKS.length, 3);
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
const ui = fs.readFileSync(new URL("../src/ui.js", import.meta.url), "utf8");
const quest = fs.readFileSync(new URL("../src/quest-jzd.js", import.meta.url), "utf8");
const questCss = fs.readFileSync(new URL("../styles/quest-jzd.css", import.meta.url), "utf8");
assert.match(dice, /dice-rack/);
assert.match(physics, /FACE_NUMBERS/);
assert.match(physics, /worn-bakelite/);
assert.match(ui, /Zahájit výpravu do JZD/);
assert.match(ui, /Vyberte přesně dva společníky/);
assert.match(ui, /PROTIAKCE VLADIMÍRA VĚČNÉHO/);
assert.match(ui, /CO SE VRÁTÍ POZDĚJI/);
assert.match(quest, /applyJzdRivalChoice/);
assert.match(quest, /Krajský audit/);
assert.match(questCss, /quest-companion-grid/);
assert.match(questCss, /rival-choice-grid/);

console.log("Koryto CLEAN TEST.6 multi-scene JZD quest tests passed.");
