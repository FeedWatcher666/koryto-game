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
  const makeEl = (id = '') => {
    const classes = new Set();
    let className = '';
    const el = {
      id,
      innerHTML: '',
      textContent: '',
      value: '',
      content: '',
      disabled: false,
      dataset: {},
      children: [],
      style: { setProperty() {} },
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); className = [...classes].join(' '); },
        remove(...names) { names.forEach(name => classes.delete(name)); className = [...classes].join(' '); },
        toggle(name, force) {
          const next = force === undefined ? !classes.has(name) : Boolean(force);
          if (next) classes.add(name); else classes.delete(name);
          className = [...classes].join(' ');
          return next;
        },
        contains(name) { return classes.has(name); }
      },
      addEventListener() {},
      appendChild(child) { this.children.push(child); return child; },
      insertBefore(child) { this.children.unshift(child); return child; },
      querySelector() { return makeEl(); },
      querySelectorAll() { return []; },
      closest() { return null; },
      click() {}
    };
    Object.defineProperty(el, 'className', {
      get() { return className; },
      set(value) {
        className = String(value || '');
        classes.clear();
        className.split(/\s+/).filter(Boolean).forEach(name => classes.add(name));
      }
    });
    return el;
  };
  const document = {
    title: '',
    head: makeEl('head'),
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
    location: { search: '', reload() {} },
    localStorage: {
      getItem(k) { return storage.has(k) ? storage.get(k) : null; },
      setItem(k, v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); },
      clear() { storage.clear(); }
    },
    alert() {},
    confirm() { return true; },
    prompt(_m, fallback = '') { return fallback; },
    setTimeout(fn) { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout() {},
    setInterval() { return 0; },
    clearInterval() {},
    Math,
    JSON,
    Date,
    Blob: class Blob {},
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(app + '\nfunction migrateSaveForTest(save){ state=deep(baseState); Object.assign(state, save); normalizeState(); return deep(state); }\nfunction getStateForTest(){ return state; }\nfunction setStateForTest(next){ state=next; return state; }\nfunction setStoredSaveForTest(key,save){ localStorage.setItem(key,typeof save==="string"?save:JSON.stringify(save)); }\nfunction clearStoredSavesForTest(){ localStorage.clear(); }\nfunction getStoredSaveForTest(key){ return localStorage.getItem(key); }\nfunction loadGameForTest(){ globalThis.load(); return deep(state); }\nfunction getElementForTest(id){ return document.getElementById(id); }\nfunction startCampaignForTest(){ newGame(); return state; }\nfunction startQuestForTest(id){ showEvent(id); return state; }\nfunction calculateElectionForTest(){ finalizeElection(); return { vote: state.flags.vote, playerSeats: state.flags.seats, majority: state.flags.majority }; }\nfunction startCoalitionForTest(result){ initCoalition({ seats: Math.max(1, Math.min(6, result?.playerSeats || 5)), majority: result?.majority || 8 }, { emoji: "🧪", title: "Test", lead: "Test", story: "Test" }, 10, true); return state.coalition; }\nfunction runSimulationForTest(count=3, seed=0){ return Array.from({ length: count }, (_, i) => simulateStrategy("mixed", seed + i)); }\nObject.assign(globalThis, {\n  baseState, locations, events, questDefs, factions: factionPlanDefs, companions, voterDefs,\n  deep, migrateSaveForTest, getStateForTest, setStateForTest, setStoredSaveForTest, clearStoredSavesForTest, getStoredSaveForTest, loadGameForTest, getElementForTest, startCampaignForTest,\n  startQuestForTest, showMap, startDebate, calculateElectionForTest, startCoalitionForTest, runSimulationForTest\n});\n', sandbox, { filename: 'src/app.js' });
  return sandbox;
}

export function assertKnownVersion(state) {
  assert.match(String(state.version), /^0\.1[34]/);
}
