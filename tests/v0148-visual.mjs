import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const js=fs.readFileSync("src/v0148-visual-system.js","utf8");
const css=fs.readFileSync("styles/v0148.css","utf8");
const html=fs.readFileSync("index.html","utf8");

assert.match(js,/0\.14\.8 TEST\.10/);
assert.match(js,/SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(js,/KorytoVisual148/);
assert.match(js,/activeQuests/);
assert.match(js,/campaignMemory/);
assert.match(js,/campaignMemory\?\.powerMap/);
assert.match(js,/KorytoConsequences\?\.updatePowerMap/);
assert.match(js,/document\.addEventListener\("click",queueRepaint\)/);
assert.doesNotMatch(js,/MutationObserver/);
assert.doesNotMatch(js,/setInterval\s*\(/);

for(const screen of ["map","quests","staff","influence","debate","elections","archive","settings"]) assert.ok(js.includes(screen),`missing ${screen}`);
for(const token of ["v0148-hud","v0148-map","v0148-nav","v0148-shell","v0148-staff-grid","v0148-power-grid","v0148-timeline"]) assert.ok(css.includes(token),`missing ${token}`);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/safe-area-inset-bottom/);
assert.match(css,/v0148-reducedMotion/);
assert.match(html,/styles\/v0148\.css/);
assert.match(html,/src\/v0148-visual-system\.js/);

const context=vm.createContext({console});
vm.runInContext(js,context,{filename:"src/v0148-visual-system.js"});
const stored=context.KorytoVisual148.powerSnapshot({campaignMemory:{powerMap:{media:{label:"Média",icon:"📰",player:72,rival:31,owner:"hráč",faction:"Věčný / redakce"}}}});
assert.equal(stored.length,1);
assert.equal(stored[0].label,"Média");
assert.equal(stored[0].player,72);
assert.equal(stored[0].rival,31);
assert.equal(stored[0].owner,"hráč");
context.KorytoConsequences={updatePowerMap:()=>({office:{label:"Úřad",icon:"📎",player:42,rival:68,owner:"staré struktury",faction:"staré struktury"}})};
const refreshed=context.KorytoVisual148.powerSnapshot({campaignMemory:{powerMap:{}}});
assert.equal(refreshed.length,1);
assert.equal(refreshed[0].label,"Úřad");
assert.equal(refreshed[0].rival,68);

console.log("v0.14.8 visual contract passed with map refresh and real power data");
