import {FIRST_CHECKS, REGISTRATION_CHECKS} from "./data.js";
import {playD20Roll} from "./dice.js";
import {
  JZD_RIVAL_CHOICES,
  applyJzdCheck,
  applyJzdRivalChoice,
  choicesForJzd,
  startJzdQuest
} from "./quest-jzd.js";
import {applyCheckConsequences, deriveAttributes, resolveCheck} from "./rules.js";
import {clearSave, createInitialState, loadGame, saveGame, startCampaign} from "./state.js";
import {render} from "./ui.js";

const app = document.getElementById("app");
let state = loadGame() || createInitialState();
let lastFirstChoice = state.scene === "firstResult"
  ? FIRST_CHECKS.find(choice => choice.id === state.flags.lastResult?.choiceId) || null
  : null;
let rolling = false;

const forcedRolls = (() => {
  const params = new URLSearchParams(location.search);
  const raw = params.get("rolls") || params.get("roll") || "";
  return raw.split(",").map(value => Number(value.trim())).filter(value => Number.isInteger(value) && value >= 1 && value <= 20);
})();
let forcedRollIndex = 0;

function syncSelectionState() {
  app.querySelectorAll("[data-origin]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.origin === state.hero.originId));
  });
  app.querySelectorAll("[data-class]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.class === state.hero.classId));
  });
  const questParty = new Set(state.quest?.party || []);
  app.querySelectorAll("[data-quest-companion]").forEach(button => {
    button.setAttribute("aria-pressed", String(questParty.has(button.dataset.questCompanion)));
  });
  app.querySelectorAll("[data-quest-item]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.questItem === state.quest?.itemId));
  });
}

function renderCurrentState() {
  render(app, state);
  syncSelectionState();
}

function commit(nextState, persist = false) {
  state = nextState;
  if (persist) saveGame(state);
  renderCurrentState();
}

function patch(mutator, persist = false) {
  const next = structuredClone(state);
  mutator(next);
  commit(next, persist);
}

function selectedChoice(collection, id) {
  return collection.find(item => item.id === id);
}

function randomSource() {
  if (!forcedRolls.length) return Math.random;
  return () => {
    const value = forcedRolls[Math.min(forcedRollIndex, forcedRolls.length - 1)];
    forcedRollIndex += 1;
    return (value - 0.01) / 20;
  };
}

function checkContextForScene(scene) {
  if (scene === "firstCheck") return {context: "first", choices: FIRST_CHECKS};
  if (scene === "registration") return {context: "registration", choices: REGISTRATION_CHECKS};
  if (scene === "jzdApproach") return {context: "jzd-approach", choices: choicesForJzd(state, "approach")};
  if (scene === "jzdSearch") return {context: "jzd-search", choices: choicesForJzd(state, "search")};
  if (scene === "jzdFinal") return {context: "jzd-final", choices: choicesForJzd(state, "final")};
  return null;
}

async function performCheck(choice, context, sourceState = state, consequenceContext = context) {
  if (rolling) return;
  rolling = true;
  try {
    const result = resolveCheck(sourceState, choice, randomSource());
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

    if (context.startsWith("jzd-")) {
      commit(applyJzdCheck(sourceState, enrichedResult, context, choice));
      return;
    }

    const next = applyCheckConsequences(sourceState, enrichedResult, consequenceContext);
    next.scene = context === "first" ? "firstResult" : "registrationResult";
    if (context === "registration") next.actions = Math.max(0, next.actions - 1);
    commit(next);
  } finally {
    rolling = false;
  }
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
    const checkContext = checkContextForScene(state.scene);
    if (!checkContext) return;
    const choice = selectedChoice(checkContext.choices, checkButton.dataset.check);
    if (!choice) return;
    if (state.scene === "firstCheck") lastFirstChoice = choice;
    await performCheck(choice, checkContext.context);
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

  const questCompanionButton = event.target.closest("[data-quest-companion]");
  if (questCompanionButton) {
    patch(next => {
      const id = questCompanionButton.dataset.questCompanion;
      const selected = next.quest.party;
      const index = selected.indexOf(id);
      if (index >= 0) selected.splice(index, 1);
      else if (selected.length < 2) selected.push(id);
    });
    return;
  }

  const questItemButton = event.target.closest("[data-quest-item]");
  if (questItemButton) {
    patch(next => { next.quest.itemId = questItemButton.dataset.questItem; });
    return;
  }

  const rivalButton = event.target.closest("[data-rival-choice]");
  if (rivalButton) {
    const id = rivalButton.dataset.rivalChoice;
    if (!JZD_RIVAL_CHOICES.some(choice => choice.id === id)) return;
    commit(applyJzdRivalChoice(state, id));
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
  } else if (action === "start-jzd") {
    commit(startJzdQuest(state));
  } else if (action === "jzd-briefing-next") {
    patch(next => {
      next.quest.phase = "preparation";
      next.scene = "jzdPrep";
    });
  } else if (action === "confirm-jzd-prep") {
    if (state.quest.party.length !== 2 || !state.quest.itemId) return;
    patch(next => {
      next.party.active = next.quest.party[0];
      next.party.members = [...next.quest.party];
      next.quest.phase = "approach";
      next.scene = "jzdApproach";
    }, true);
  } else if (action === "accept-jzd-approach") {
    patch(next => {
      next.quest.phase = "search";
      next.scene = "jzdSearch";
    }, true);
  } else if (action === "accept-jzd-search") {
    patch(next => {
      next.quest.phase = "rival";
      next.scene = "jzdRival";
    }, true);
  } else if (action === "accept-jzd-final") {
    patch(next => {
      next.quest.phase = "completed";
      next.quest.status = "completed";
      next.scene = "jzdComplete";
    }, true);
  } else if (action === "save") {
    saveGame(state);
    actionButton.textContent = "Uloženo";
  } else if (action === "restart") {
    clearSave();
    state = createInitialState();
    lastFirstChoice = null;
    forcedRollIndex = 0;
    renderCurrentState();
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

renderCurrentState();
globalThis.KorytoClean = Object.freeze({
  getState: () => structuredClone(state),
  get isRolling() { return rolling; },
  version: state.version
});
