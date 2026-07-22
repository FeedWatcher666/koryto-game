import { loadGameContext, readText } from './helpers.mjs';
const ctx = loadGameContext();
const html = readText('index.html');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) throw new Error(`Duplicate DOM IDs: ${[...new Set(dupes)].join(', ')}`);
for (const event of Object.values(ctx.events)) {
  if (event.location && !ctx.locations[event.location]) throw new Error(`Event ${event.id} references missing location ${event.location}`);
  if (!event.id || !event.title || !Array.isArray(event.choices)) throw new Error(`Malformed event ${event.id}`);
}
for (const id of Object.keys(ctx.companions)) if (!ctx.companions[id].name) throw new Error(`Malformed companion ${id}`);
for (const id of Object.keys(ctx.factionPlanDefs)) if (!ctx.locations[ctx.factionPlanDefs[id].location]) throw new Error(`Faction plan ${id} references missing location`);
console.log('content integrity ok');
