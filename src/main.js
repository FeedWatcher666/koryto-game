import {FIRST_CHECKS, REGISTRATION_CHECKS} from "./data.js";
import {playD20Roll} from "./dice.js";
import {applyCheckConsequences, deriveAttributes, resolveCheck} from "./rules.js";
import {clearSave, createInitialState, loadGame, saveGame, startCampaign} from "./state.js";
import {render} from "./ui.js";

const app = document.getElementById("app");
let state = loadGame() || createInitialState();
let lastFirstChoice = null;
let rolling = false;

function commit(nextState, persist = false) {
  state = nextState;
  if (persist) saveGame(state);
  render(app, state);
}

function patch(mutator, persist = false) {
  const next = structuredClone(state);
  mutator(next);
  commit(next, persist);
}

function selectedChoice(collection, id) {
  return collection.find(item => item.id === id);
}

function testRandom() {
  const params = new URLSearchParams(location.search);
  const raw = params.get("rolls") || params.get("roll") || "";
  const forced = raw.split(",").map(value => Number(value.trim())).filter(value => Number.isInteger(value) && value >= 1 && value <= 20);
  if (!forced.length) return Math.random;
  let index = 0;
  return () => {
    const value = forced[Math.min(index, forced.length - 1)];
    index += 1;
    return (value - 0.01) / 20;
  };
}

async function performCheck(choice, context, sourceState = state, consequenceContext = context) {
  if (rolling) return;
  rolling = true;
  const result = resolveCheck(sourceState, choice, testRandom());
  let presentation = null;

  try {
    presentation = await playD20Roll({root: document.body, state: sourceState, choice, result});
  } catch (error) {
    console.error("D20 animation failed; resolving check without animation.", error);
  }

  const enrichedResult = {
    ...result,
    impactLine: presentation?.impactLine || result.outcome.description,
    reaction: presentation?.reaction || null,
    reactionSpeaker: presentation?.companionName || null,
    reactionIcon: presentation?.companionIcon || null
  };
  const next = applyCheckConsequences(sourceState, enrichedResult, consequenceContext);
  next.scene = context === "first" ? "firstResult" : "registrationResult";
  if (context === "registration") next.actions = Math.max(0, next.actions - 1);
  rolling = false;
  commit(next);
}

app.addEventListener("click", async event => {
  if (rolling && !event.target.closest("[data-dice-skip]")) return;

  const originButton = event.target.closest("[data-origin]");
  if (originButton) {
    patch(next => {
      next.hero.originId = originButton.dataset.origin;
      next.hero.attributes = deriveAttributes(next.hero.classId, next.hero.originId);
    });
    return;
  }

  const classButton = event.target.closest("[data-class]");
  if (classButton) {
    patch(next => {
      next.hero.classId = classButton.dataset.class;
      next.hero.attributes = deriveAttributes(next.hero.classId, next.hero.originId);
    });
    return;
  }

  const checkButton = event.target.closest("[data-check]");
  if (checkButton) {
    const collection = state.scene === "firstCheck" ? FIRST_CHECKS : REGISTRATION_CHECKS;
    const choice = selectedChoice(collection, checkButton.dataset.check);
    if (!choice) return;
    if (state.scene === "firstCheck") lastFirstChoice = choice;
    const context = state.scene === "firstCheck" ? "first" : "registration";
    await performCheck(choice, context);
    return;
  }

  const companionButton = event.target.closest("[data-companion]");
  if (companionButton) {
    patch(next => {
      const id = companionButton.dataset.companion;
      next.party.active = id;
      next.party.members = [id];
      next.scene = "registration";
    });
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "take-pen") {
    patch(next => {
      next.flags.chainedPenAvailable = true;
      if (!next.inventory.includes("chainedPen")) next.inventory.push("chainedPen");
      next.scene = "firstCheck";
    });
  } else if (action === "reroll-first" && lastFirstChoice && !state.flags.chainedPenSpent) {
    const base = structuredClone(state);
    base.flags.chainedPenSpent = true;
    base.resources.heat += 2;
    await performCheck(lastFirstChoice, "first", base, "first-reroll");
  } else if (action === "accept-first") {
    patch(next => { next.scene = "companion"; });
  } else if (action === "accept-registration") {
    patch(next => {
      next.flags.chapterOneUnlocked = true;
      next.scene = "chapterOpen";
    }, true);
  } else if (action === "save") {
    saveGame(state);
    actionButton.textContent = "Uloženo";
  } else if (action === "restart") {
    clearSave();
    state = createInitialState();
    lastFirstChoice = null;
    render(app, state);
  }
});

app.addEventListener("submit", event => {
  if (event.target.id !== "creationForm") return;
  event.preventDefault();
  const name = document.getElementById("heroName")?.value || "";
  commit(startCampaign(state, {
    name,
    classId: state.hero.classId,
    originId: state.hero.originId
  }));
});

render(app, state);
globalThis.KorytoClean = Object.freeze({
  getState: () => structuredClone(state),
  get isRolling() { return rolling; },
  version: state.version
});
