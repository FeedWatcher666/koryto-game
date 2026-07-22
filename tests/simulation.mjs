import { loadGameContext } from './helpers.mjs';
const ctx = loadGameContext();
const rows = ['ideal','corrupt','legal','populist','mixed'].map((s, i) => ctx.simulateStrategy(s, i));
for (const row of rows) {
  if (!row.ended) throw new Error(`Simulation did not end for ${row.strategy}`);
  if (row.vote < 0 || row.vote > 100) throw new Error(`Simulation vote out of range for ${row.strategy}`);
}
console.log(JSON.stringify(rows.map(r => ({ strategy: r.strategy, vote: r.vote, seats: r.seats, coalition: r.coalition }))));
console.log('simulation ok');
