import assert from "node:assert/strict";
import {
  TEST8_SAVE_SCHEMA,
  TEST8_STORAGE_KEY,
  applyCampaignAction,
  applyFinalCampaignResult,
  availableCampaignActions,
  availableFinalTactics,
  chooseCampaignStaff,
  chooseFinalStrategy,
  chooseFinalTactic,
  createTest8State,
  exportPlaytest,
  finalCampaignChoice,
  loadTest8State,
  saveTest8State,
  startTest8Campaign
} from "../src/test8-campaign.js";

function result(level, roll = 14, total = 20, dc = 12) {
  return {level, roll, total, dc, rolls: [roll], keptIndex: 0, outcome: {title: level}};
}

let state = startTest8Campaign(createTest8State(), {name: "Tester", classId: "bard", originId: "idealist"});
assert.equal(state.campaign.day, 1);
assert.equal(availableCampaignActions(state).length, 3);
state = applyCampaignAction(state, "jzd-logbook", result("success"));
state = applyCampaignAction(state, "pub-workers", result("success"));
assert.equal(state.campaign.phase, "staff");
assert.equal(state.campaign.sacrificeLog.length, 1);
assert.equal(state.campaign.sacrificeLog[0].actionId, "office-contract");
assert.equal(state.campaign.activeMutationId, "archive-sealed");
assert.equal(state.campaign.rivalLog.length, 1);

state = chooseCampaignStaff(state, "marie");
assert.equal(state.campaign.phase, "strategy");
state = chooseFinalStrategy(state, "legal");
assert.equal(state.campaign.day, 2);
assert.equal(state.campaign.finalStrategy, "legal");
let ids = availableCampaignActions(state).map(action => action.id);
assert(ids.includes("respond-archive-sealed"));
assert(!ids.includes("legal-audit"), "office is blocked by Věčný");
assert(ids.includes("legal-injunction"));
assert(!ids.includes("public-coalition"));

state = applyCampaignAction(state, "respond-archive-sealed");
assert.equal(state.campaign.activeMutationId, null);
assert.equal(state.campaign.actionsLeft, 1);
assert(availableCampaignActions(state).some(action => action.id === "legal-audit"));
state = applyCampaignAction(state, "legal-audit", result("success"));
assert.equal(state.campaign.day, 3);
assert.equal(state.campaign.activeMutationId, "sale-accelerated");
assert.equal(state.campaign.sacrificeLog.length, 2);

ids = availableCampaignActions(state).map(action => action.id);
assert(ids.includes("respond-sale-accelerated"));
assert(!ids.includes("legal-agenda"), "office is physically blocked until response");
state = applyCampaignAction(state, "respond-sale-accelerated");
ids = availableCampaignActions(state).map(action => action.id);
assert(ids.includes("legal-agenda"));
assert(ids.includes("legal-affidavit"));
state = applyCampaignAction(state, "legal-affidavit", result("success"));
assert.equal(state.campaign.phase, "final-tactic");
assert.equal(state.campaign.sacrificeLog.length, 3);
assert.equal(state.campaign.sacrificeLog[2].actionId, "legal-agenda");
assert.equal(availableFinalTactics(state).length, 2);

state = chooseFinalTactic(state, "injunction");
assert.equal(state.campaign.phase, "final");
const finalChoice = finalCampaignChoice(state);
assert.equal(finalChoice.attribute, "intellect");
assert.equal(finalChoice.gate.ok, true);
state = applyFinalCampaignResult(state, result("success", 17, 23, finalChoice.dc));
assert.equal(state.screen, "ending");
assert.equal(state.campaign.outcome.won, true);
assert.equal(state.campaign.cases.jzd.status, "resolved");
assert.notEqual(state.campaign.cases.road.status, "active");
assert.equal(state.playtests.length, 1);
const exported = JSON.parse(exportPlaytest(state, "abc123"));
assert.equal(exported.buildSha, "abc123");
assert.equal(exported.sacrifices.length, 3);
assert.equal(exported.finalTactic, "injunction");

let workers = startTest8Campaign(createTest8State(), {name: "R", classId: "paladin", originId: "revenge"});
workers = applyCampaignAction(workers, "office-contract", result("success"));
workers = applyCampaignAction(workers, "jzd-logbook", result("success"));
workers = chooseCampaignStaff(workers, "radek");
workers = chooseFinalStrategy(workers, "workers");
ids = availableCampaignActions(workers).map(action => action.id);
assert(ids.includes("respond-witnesses-intimidated"));
assert(!ids.includes("workers-organize"), "pub is blocked until witnesses are protected");
assert(ids.includes("workers-secure"));
assert(!ids.includes("legal-audit"));
assert(!ids.includes("public-coalition"));

let defeat = startTest8Campaign(createTest8State(), {name: "Klikal", classId: "bard", originId: "idealist"});
defeat.resources.pressure = 9;
defeat = applyCampaignAction(defeat, "jzd-logbook", result("complication", 1, 3, 12));
assert.equal(defeat.screen, "ending");
assert.equal(defeat.campaign.outcome.id, "pressure-defeat");

assert.equal(TEST8_SAVE_SCHEMA, 4);
assert.equal(TEST8_STORAGE_KEY, "koryto.clean.v0200.test8");
let stored = null;
globalThis.localStorage = {setItem(key, value) { stored = [key, value]; }, getItem(key) { return stored?.[0] === key ? stored[1] : null; }};
assert.equal(saveTest8State(state), true);
assert.equal(loadTest8State().campaign.outcome.won, true);

console.log("TEST.8 sacrifice, rival mutation, doctrine, tactic, terminal state, and export passed.");
