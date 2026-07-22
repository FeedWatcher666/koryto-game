import assert from 'node:assert/strict';
import {loadGameContext} from './helpers.mjs';
const context=loadGameContext();
const strategies=['ideal','corrupt','legal','populist','mixed'],results=[];
for(let i=0;i<1000;i++)results.push(context.KorytoApp.simulateStrategy(strategies[i%strategies.length],55000+i));
assert.equal(results.length,1000);assert.equal(results.every(r=>r.ended),true,'every campaign must finish');
for(const result of results)for(const value of Object.values(result))if(typeof value==='number')assert.equal(Number.isFinite(value),true,'simulation must not contain NaN');
assert.ok(new Set(results.map(r=>r.route)).size>20,'routes should remain diverse');
console.log(`v0.14.4 simulations ok: ${new Set(results.map(r=>r.route)).size} routes`);
