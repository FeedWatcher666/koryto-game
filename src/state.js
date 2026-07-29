import {deriveAttributes} from "./rules.js";
import {VERSION} from "./data.js";

const STORAGE_KEY = "koryto.clean.v0200";
const SAVE_SCHEMA = 2;

export function createInitialState() {
  return {
    version: VERSION,
    saveSchema: SAVE_SCHEMA,
    screen: "creation",
    scene: "arrival",
    day: 1,
    actions: 3,
    hero: {
      name: "",
      classId: "bard",
      originId: "idealist",
      attributes: deriveAttributes("bard", "idealist")
    },
    party: {active: null, members: []},
    relationships: {marie: 0, bohumil: 0, radek: 0},
    inventory: [],
    resources: {reputation: 0, money: 3, heat: 0, debt: 0, leverage: 0},
    flags: {
      chainedPenAvailable: false,
      chainedPenSpent: false,
      candidacyRegistered: false,
      registrationDebt: false,
      chapterOneUnlocked: false,
      lastResult: null
    },
    quest: {
      id: null,
      status: "locked",
      phase: null,
      party: [],
      itemId: null,
      route: null,
      evidence: 0,
      workerTrust: 0,
      rivalPressure: 0,
      rivalChoice: null,
      ending: null,
      endingTitle: null,
      endingText: null,
      consequences: [],
      results: []
    },
    history: []
  };
}

export function startCampaign(state, form) {
  const next = structuredClone(state);
  next.screen = "game";
  next.scene = "arrival";
  next.hero.name = form.name.trim() || "Bezejmenný kandidát";
  next.hero.classId = form.classId;
  next.hero.originId = form.originId;
  next.hero.attributes = deriveAttributes(form.classId, form.originId);
  return next;
}

export function saveGame(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.saveSchema !== SAVE_SCHEMA || parsed.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}

export {STORAGE_KEY, SAVE_SCHEMA};
