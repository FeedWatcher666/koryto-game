import assert from "node:assert/strict";
import fs from "node:fs";
import {CLASSES, COMPANIONS, FIRST_CHECKS, REGISTRATION_CHECKS, VERSION} from "../src/data.js";
import {createDicePresentation} from "../src/dice.js";
import {deriveAttributes, outcomeLevel, resolveCheck} from "../src/rules.js";
import {createInitialState, SAVE_SCHEMA, STORAGE_KEY} from "../src/state.js";

assert.equal(VERSION, "0.20.0-clean-test.3");
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
assert.ok(result.modifierBreakdown.length >= 1);
const presentation = createDicePresentation(state, FIRST_CHECKS[0], result);
assert.match(presentation.reaction, /runda|pivo|koaliční/i);
assert.match(presentation.impactLine, /Obec nečekaně spolupracuje/);

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const dice = fs.readFileSync(new URL("../src/dice.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/game.css", import.meta.url), "utf8");
const dice3d = fs.readFileSync(new URL("../styles/dice3d.css", import.meta.url), "utf8");
assert.match(index, /src\/main\.js/);
assert.match(index, /styles\/dice3d\.css/);
assert.doesNotMatch(index, /v017|legacy|village-rpg/i);
assert.doesNotMatch(main, /KorytoApp|v017|legacy/i);
assert.match(main, /playD20Roll/);
assert.match(dice, /ICOSAHEDRON_FACES/);
assert.match(dice, /data-d20-renderer="icosahedron"/);
assert.match(dice, /getContext\("2d"\)/);
assert.match(dice, /requestAnimationFrame\(draw\)/);
assert.match(css, /\.objective-card/);
assert.match(dice3d, /\.dice-canvas/);
assert.match(dice3d, /@media \(max-width: 760px\)/);

console.log("Koryto clean rewrite volumetric D20 smoke tests passed.");
