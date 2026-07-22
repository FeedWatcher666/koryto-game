import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function readText(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

export function loadGameContext() {
  const app = readText('src/app.js');
  const elements = new Map();
  const storage = new Map();
  const makeEl = (id = '') => ({
    id,
    className: '',
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    appendChild() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; }
  });
  const document = {
    body: makeEl('body'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeEl(id));
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    querySelector() { return makeEl(); },
    createElement: makeEl,
    addEventListener() {}
  };
  const sandbox = {
    console,
    document,
    window: {},
    location: { search: "" },
    localStorage: {
      getItem(k) { return storage.has(k) ? storage.get(k) : null; },
      setItem(k, v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); }
    },
    alert() {},
    confirm() { return true; },
    prompt(_m, fallback = '') { return fallback; },
    setTimeout(fn) { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout() {},
    Math,
    JSON,
    Date
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(app + '\nfunction migrateSaveForTest(save){ state=deep(baseState); Object.assign(state, save); normalizeState(); return deep(state); }\nfunction getStateForTest(){ return state; }\nfunction setStateForTest(next){ state=next; return state; }\nfunction startCampaignForTest(){ newGame(); return state; }\nfunction startQuestForTest(id){ showEvent(id); return state; }\nfunction calculateElectionForTest(){ finalizeElection(); return { vote: state.flags.vote, playerSeats: state.flags.seats, majority: state.flags.majority }; }\nfunction startCoalitionForTest(result){ initCoalition({ seats: Math.max(1, Math.min(6, result?.playerSeats || 5)), majority: result?.majority || 8 }, { emoji: "🧪", title: "Test", lead: "Test", story: "Test" }, 10, true); return state.coalition; }\nfunction runSimulationForTest(count=3, seed=0){ return Array.from({ length: count }, (_, i) => simulateStrategy("mixed", seed + i)); }\nObject.assign(globalThis, {\n  baseState, locations, events, questDefs, factions: factionPlanDefs, companions,\n  deep, migrateSaveForTest, getStateForTest, setStateForTest, startCampaignForTest,\n  startQuestForTest, showMap, startDebate, calculateElectionForTest, startCoalitionForTest, runSimulationForTest\n});\n', sandbox, { filename: 'src/app.js' });
  return sandbox;
}

export function assertKnownVersion(state) {
  assert.match(String(state.version), /^0\.1[34]/);
}
