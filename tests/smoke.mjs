import assert from "node:assert/strict";
import fs from "node:fs";
import {CLASSES, COMPANIONS, FIRST_CHECKS, REGISTRATION_CHECKS, VERSION} from "../src/data.js";
import {createDicePresentation} from "../src/dice.js";
import {deriveAttributes, outcomeLevel, resolveCheck} from "../src/rules.js";
import {createInitialState, SAVE_SCHEMA, STORAGE_KEY} from "../src/state.js";

assert.equal(VERSION, "0.20.0-clean-test.2");
assert.equal(SAVE_SCHEMA, 1);
assert.equal(STORAGE_KEY, "koryto.clean.v0200");
assert.deepEqual(Object.keys(CLASSES), ["bard", "paladin", "rogue"]);
assert.deepEqual(Object.keys(COMPANIONS), ["marie", "bohumil"]);
assert.equal(FIRST_CHECKS.length, 3);
assert.equal(REGISTRATION_CHECKS.length, 3);

const attrs = deriveAttributes("bard", "idealist");
assert.deepEqual(Object.keys(attrs).sort(), ["authority", "charisma", "intellect", "luck", "media", "morality"].sort());
assert.equal(attrs.media, 5);
assert.equal(attrs.morality, 4);
assert.equal(outcomeLevel(20, 20, 30), "critical");
assert.equal(outcomeLevel(1, 99, 10), "complication");
assert.equal(outcomeLevel(10, 13, 10), "success");
assert.equal(outcomeLevel(8, 9, 10), "costly");
assert.equal(outcomeLevel(2, 3, 10), "complication");

const state = createInitialState();
state.screen = "game";
state.hero.classId = "bard";
state.hero.attributes = attrs;
state.party.active = "bohumil";
const result = resolveCheck(state, FIRST_CHECKS[0], () => 0.95);
assert.equal(result.roll, 20);
assert.equal(result.level, "critical");
assert.ok(result.modifierBreakdown.some(item => item.label === "Bohumil Tichý" && item.value === 2));
const presentation = createDicePresentation(state, FIRST_CHECKS[0], result);
assert.equal(presentation.impactLine, "Obec nečekaně spolupracuje.");
assert.match(presentation.reaction, /první runda zdarma/);
assert.equal(presentation.formula, `d20 + ${result.visibleModifier} proti 10`);

const fumble = resolveCheck(state, FIRST_CHECKS[0], () => 0);
const fumblePresentation = createDicePresentation(state, FIRST_CHECKS[0], fumble);
assert.equal(fumble.roll, 1);
assert.equal(fumblePresentation.impactLine, "Tohle už někdo nahlásil.");

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const dice = fs.readFileSync(new URL("../src/dice.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/game.css", import.meta.url), "utf8");
const builder = fs.readFileSync(new URL("../scripts/build-offline.mjs", import.meta.url), "utf8");
assert.match(index, /type="module" src="src\/main\.js"/);
assert.doesNotMatch(index, /v017|legacy|village-rpg/i);
assert.doesNotMatch(main, /KorytoApp|v017|legacy/i);
assert.match(main, /playD20Roll/);
assert.match(dice, /dice-overlay/);
assert.match(dice, /AudioContext/);
assert.match(dice, /prefers-reduced-motion/);
assert.match(css, /@keyframes d20-spin/);
assert.match(css, /\.is-landed\.is-critical/);
assert.match(css, /\.is-landed\.is-fumble/);
assert.match(builder, /stripModuleSyntax/);
assert.match(builder, /dice\.js/);
assert.equal(fs.existsSync(new URL("../src/runtime.js", import.meta.url)), false, "hand-maintained runtime must not return");

console.log("Koryto clean rewrite D20 smoke tests passed.");
