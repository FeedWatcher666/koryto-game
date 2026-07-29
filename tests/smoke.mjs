import assert from "node:assert/strict";
import fs from "node:fs";
import {CLASSES, COMPANIONS, FIRST_CHECKS, REGISTRATION_CHECKS, VERSION} from "../src/data.js";
import {deriveAttributes, outcomeLevel, resolveCheck} from "../src/rules.js";
import {createInitialState, SAVE_SCHEMA, STORAGE_KEY} from "../src/state.js";

assert.equal(VERSION, "0.20.0-clean-test.1");
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

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../src/runtime.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/game.css", import.meta.url), "utf8");
assert.match(index, /src\/runtime\.js/);
assert.doesNotMatch(index, /type="module"|v017|legacy|village-rpg/i);
assert.doesNotMatch(main, /KorytoApp|v017|legacy/i);
assert.doesNotMatch(runtime, /KorytoApp|v017|village-rpg|legacy=1/i);
assert.match(runtime, /globalThis\.KorytoClean/);
assert.match(runtime, /chapterOneUnlocked/);
assert.match(css, /\.objective-card/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log("Koryto clean rewrite smoke tests passed.");
