import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function readText(path) { return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'); }
export function loadGameContext() {
  const code = readText('src/app.js').replace('if(AUTOTEST)runAutotest();else setup();', '');
  const document = makeDocumentStub();
  const context = { console, document, location: { search: '' }, localStorage: new MapStorage(), alert: (msg) => { context.lastAlert = msg; }, confirm: () => true, setInterval, clearInterval, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set };
  vm.createContext(context);
  vm.runInContext(code + `
Object.assign(globalThis, { setState: (next) => { state = next; globalThis.state = state; }, getState: () => state, clamp, deep, hashSeed, rng, rand, classes, locations, companions, events, questDefs, factionPlanDefs, baseState, state, initQuests, initVoters, initSurprises, initLivingWorld, normalizeState, completeQuest, getActivities, startDebate, finalizeElection, simulateStrategy });`, context, { filename: 'src/app.js' });
  return context;
}
class MapStorage { constructor(){ this.map = new Map(); } getItem(k){ return this.map.get(k) ?? null; } setItem(k,v){ this.map.set(k, String(v)); } removeItem(k){ this.map.delete(k); } }

function makeDocumentStub() {
  const element = () => ({ classList: { add(){}, remove(){}, toggle(){} }, style: {}, dataset: {}, innerHTML: '', textContent: '', value: '', onclick: null, querySelectorAll: () => [], appendChild(){}, remove(){}, setAttribute(){} });
  const elements = new Map();
  return {
    body: element(),
    createElement: () => element(),
    getElementById: (id) => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    querySelectorAll: () => [],
  };
}
