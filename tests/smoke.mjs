import assert from "node:assert/strict";
import fs from "node:fs";
import {CLASSES, COMPANIONS, FIRST_CHECKS, REGISTRATION_CHECKS, VERSION} from "../src/data.js";
import {deriveAttributes, formatRollExpression, outcomeLevel, resolveCheck, resolveRollMode} from "../src/rules.js";
import {createInitialState, SAVE_SCHEMA, STORAGE_KEY} from "../src/state.js";

function sequence(values) {
  let index = 0;
  return () => (values[Math.min(index++, values.length - 1)] - 0.01) / 20;
}

assert.equal(VERSION, "0.20.0-clean-test.4");
assert.equal(SAVE_SCHEMA, 1);
assert.equal(STORAGE_KEY, "koryto.clean.v0200");
assert.deepEqual(Object.keys(CLASSES), ["bard", "paladin", "rogue"]);
assert.deepEqual(Object.keys(COMPANIONS), ["marie", "bohumil"]);
assert.equal(FIRST_CHECKS.length, 3);
assert.equal(REGISTRATION_CHECKS.length, 3);

const attrs = deriveAttributes("bard", "idealist");
assert.equal(attrs.media, 5);
assert.equal(attrs.morality, 4);
assert.equal(outcomeLevel(20, 20, 30), "critical");
assert.equal(outcomeLevel(1, 99, 10), "complication");

const state = createInitialState();
state.screen = "game";
state.hero.attributes = attrs;

const advantageMode = resolveRollMode(state, FIRST_CHECKS[0]);
assert.equal(advantageMode.mode, "advantage");
assert.equal(advantageMode.notation, "2d20kh1");
const advantage = resolveCheck(state, FIRST_CHECKS[0], sequence([4, 17]));
assert.deepEqual(advantage.rolls, [4, 17]);
assert.equal(advantage.roll, 17);
assert.equal(advantage.keptIndex, 1);
assert.equal(advantage.rollNotation, "2d20kh1");
assert.match(formatRollExpression(advantage), /2d20kh1/);
assert.match(formatRollExpression(advantage), /ponecháno 17/);

const disadvantageMode = resolveRollMode(state, FIRST_CHECKS[2]);
assert.equal(disadvantageMode.mode, "disadvantage");
assert.equal(disadvantageMode.notation, "2d20kl1");
const disadvantage = resolveCheck(state, FIRST_CHECKS[2], sequence([18, 3]));
assert.deepEqual(disadvantage.rolls, [18, 3]);
assert.equal(disadvantage.roll, 3);
assert.equal(disadvantage.keptIndex, 1);
assert.equal(disadvantage.rollNotation, "2d20kl1");

state.hero.classId = "paladin";
state.hero.originId = "ambitious";
state.hero.attributes = deriveAttributes("paladin", "ambitious");
state.party.active = "marie";
const paragraphMode = resolveRollMode(state, REGISTRATION_CHECKS[1]);
assert.equal(paragraphMode.mode, "advantage");
assert.ok(paragraphMode.advantageSources.length >= 2);

const dice = fs.readFileSync(new URL("../src/dice.js", import.meta.url), "utf8");
const physics = fs.readFileSync(new URL("../src/dice-physics.js", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../src/ui.js", import.meta.url), "utf8");
assert.match(dice, /dice-rack/);
assert.match(dice, /is-discarded/);
assert.match(dice, /playThrowSequence/);
assert.match(physics, /FACE_NUMBERS/);
assert.match(physics, /drawFaceNumber/);
assert.match(physics, /worn-bakelite/);
assert.match(ui, /VÝHODA · 2d20, vyšší/);
assert.match(ui, /NEVÝHODA · 2d20, nižší/);

console.log("Koryto CLEAN TEST.4 advantage/disadvantage and D20 polish tests passed.");
