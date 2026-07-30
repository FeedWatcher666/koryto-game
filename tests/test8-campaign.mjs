import assert from "node:assert/strict";
import {resolveCheck} from "../src/rules.js";
import {
  TEST8_SAVE_SCHEMA,
  TEST8_STORAGE_KEY,
  applyCampaignAction,
  applyFinalCampaignResult,
  availableCampaignActions,
  campaignActionById,
  choiceForCampaignAction,
  chooseCampaignStaff,
  chooseFinalStrategy,
  createTest8State,
  exportPlaytest,
  finalCampaignChoice,
  loadTest8State,
  saveTest8State,
  startTest8Campaign
} from "../src/test8-campaign.js";

function result(level, roll = 12, total = 18, dc = 12) {
  return {level, roll, total, dc, rolls: [roll], keptIndex: 0, outcome: {title: level}};
}

let state = startTest8Campaign(createTest8State(), {name: "Tester", classId: "bard", originId: "idealist"});
assert.equal(state.campaign.day, 1);
assert.equal(state.campaign.actionsLeft, 2);
assert.equal(availableCampaignActions(state).length, 3);

state = applyCampaignAction(state, "pub-workers", result("success"));
assert.equal(state.campaign.actionsLeft, 1);
assert.equal(state.resources.support, 4);
assert.equal(state.campaign.phase, "map");

state = applyCampaignAction(state, "jzd-logbook", result("success"));
assert.equal(state.campaign.phase, "staff");
assert.equal(state.campaign.rivalLog.length, 1);
assert.equal(state.campaign.cases.road.status, "active");

state = chooseCampaignStaff(state, "marie");
assert.equal(state.campaign.day, 2);
assert.equal(state.party.active, "marie");
assert(availableCampaignActions(state).some(action => action.id === "staff-marie-annex"));
assert(!availableCampaignActions(state).some(action => action.id === "staff-radek-hall"));

state = applyCampaignAction(state, "staff-marie-annex");
assert.equal(state.resources.evidence >= 4, true);
state = applyCampaignAction(state, "pub-road", result("success"));
assert.equal(state.campaign.phase, "strategy");
assert.equal(state.campaign.rivalLog.length, 2);

state = chooseFinalStrategy(state, "legal");
assert.equal(state.campaign.day, 3);
state = applyCampaignAction(state, "office-final-prep", result("success"));
state = applyCampaignAction(state, "pub-final-prep", result("success"));
assert.equal(state.campaign.phase, "final");
assert.equal(state.campaign.rivalLog.length, 3);

const finalChoice = finalCampaignChoice(state);
assert.equal(finalChoice.attribute, "intellect");
assert(finalChoice.dc <= 15);
state = applyFinalCampaignResult(state, result("success", 16, 22, finalChoice.dc));
assert.equal(state.screen, "ending");
assert.equal(state.campaign.outcome.won, true);
assert.equal(state.playtests.length, 1);
assert.match(exportPlaytest(state, "abc123"), /"buildSha": "abc123"/);

let defeat = startTest8Campaign(createTest8State(), {name: "Klikal", classId: "bard", originId: "idealist"});
defeat.resources.pressure = 9;
defeat = applyCampaignAction(defeat, "jzd-logbook", result("complication", 1, 3, 12));
defeat = applyCampaignAction(defeat, "office-contract", result("complication", 1, 4, 12));
assert.equal(defeat.screen, "ending");
assert.equal(defeat.campaign.outcome.id, "pressure-defeat");

const staffState = chooseCampaignStaff(
  applyCampaignAction(
    applyCampaignAction(startTest8Campaign(createTest8State(), {name: "R", classId: "rogue", originId: "revenge"}), "jzd-logbook", result("success")),
    "office-contract", result("success")
  ),
  "radek"
);
const action = campaignActionById(staffState, "jzd-witness");
const choice = choiceForCampaignAction(staffState, action);
const roll = resolveCheck(staffState, choice, () => 0.8);
assert.equal(roll.rollMode, "advantage", "active staff changes the location roll");

assert.equal(TEST8_SAVE_SCHEMA, 3);
assert.equal(TEST8_STORAGE_KEY, "koryto.clean.v0200.test8");
let stored = null;
globalThis.localStorage = {setItem(key, value) { stored = [key, value]; }, getItem(key) { return stored?.[0] === key ? stored[1] : null; }};
assert.equal(saveTest8State(state), true);
assert.equal(loadTest8State().campaign.outcome.won, true);

console.log("TEST.8 strategic campaign core passed.");
