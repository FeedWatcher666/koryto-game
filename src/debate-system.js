"use strict";
(() => {
  const VERSION = "0.14.4 TEST.6";
  const data = () => globalThis.KorytoDebateData || {};
  const abilityText = {
    bard:["Přerámovat téma","Zvedne náladu sálu, Momentum a změní soupeřův tah."],
    rogue:["Zadní vchod","Poškodí soupeře, ukradne Momentum a zvýší mediální tlak."],
    paladin:["Veřejná přísaha","Obnoví reputaci a Důvěru; může vytvořit veřejný slib."],
    mage:["Formulář 37B","Zruší příští tah soupeře a oslabí jeho obranu."],
    technocrat:["Model dopadů","Přidá +3 k příštímu hodu a přesně odhalí záměr soupeře."],
    necro:["Návrat kádru","Přivolá aparát, poškodí soupeře a zvýší vliv i tlak."]
  };
  function baseState(target,clamp){const dashboard=target.classMastery==="dashboard";return {active:true,round:1,maxRounds:5,playerRep:clamp(48+target.stats.support*.28+target.stats.trust*.18-target.stats.heat*.08,35,85),opponentRep:clamp(52+target.opponent.momentum*.28+Math.max(0,target.factions.oldguard)*.08,38,88),momentum:dashboard?4:2,mood:0,composure:clamp(target.stats.trust,20,100),intent:null,log:[],classUsed:false,companionUsed:{},nextBonus:0,cancelOpponent:false,opponentWeakened:0,lastCard:null,usedCards:{},chain:0,firstHitShield:target.classMastery==="unbroken",revealedIntent:false,result:null};}
  function chooseIntent(target,pick){const d=target.debate,last=d.lastCard,adapt=target.rivalAI?.adaptation;let pool=["emptyPromise","emotional","patronage","attackParty","silence"];if(last==="facts"||last==="expose")pool.push("reverseFacts","reverseFacts");if(adapt==="legal")pool.push("reverseFacts","silence");if(adapt==="public")pool.push("emotional","patronage");if(adapt==="power"||adapt==="corrupt")pool.push("attackParty","emotional");d.intent=pick(pool);return d.intent;}
  function intentText(target){const m=data().rivalMoveDefs?.[target.debate.intent];if(!m)return"Věčný listuje poznámkami a hledá větu, kterou už řekl v roce 2006.";const exact=target.debate.revealedIntent||target.hero.classId==="technocrat"||target.classMastery==="apparatusMemory"||target.party.daniela?.loyalty>=65;return exact?`${m.icon} ${m.name}: ${m.hint}`:`🎭 Věčný připravuje protiútok. ${m.hint.replace(/Soupeř|Věčný/g,"Někdo")}`;}
  function cardModifier(id,target,attributeMod,clamp){const c=data().debateCardDefs?.[id];if(!c)return 0;let mod=attributeMod(c.attr);if(target.classMastery==="appendix"&&(id==="facts"||id==="expose"))mod+=2;if(target.classMastery==="doubleFile"&&id==="expose")mod+=2;if(target.debate.nextBonus)mod+=target.debate.nextBonus;if(target.debate.mood>20&&c.tags.includes("public"))mod+=1;if(target.debate.mood<-20&&c.tags.includes("public"))mod-=1;if(target.rivalAI?.adaptation&&c.tags.includes(target.rivalAI.adaptation))mod-=2;const used=target.debate.usedCards?.[id]||0;if(used)mod-=Math.min(3,used);if(target.debate.lastCard===id)mod-=1;return clamp(mod,-3,8);}
  function cardOdds(id,target,attributeMod,clamp,rollLevel){const c=data().debateCardDefs?.[id],m=cardModifier(id,target,attributeMod,clamp),counts={clean:0,costly:0,complication:0};if(!c)return counts;for(let r=1;r<=20;r++){const l=rollLevel(r,r+m,c.dc);if(l==="critical"||l==="success")counts.clean++;else if(l==="costly")counts.costly++;else counts.complication++;}return counts;}
  function abilityInfo(target){const id=target.hero.classId,x=abilityText[id]||["Schopnost","Bez popisu"];return {name:x[0],desc:x[1],perk:target.classMastery};}
  function validate(){const issues=[];const d=data();for(const [id,card] of Object.entries(d.debateCardDefs||{})){if(!card.name||!card.attr||!Number.isFinite(card.dc))issues.push(`${id}: neúplná debatní karta`);}for(const [id,move] of Object.entries(d.rivalMoveDefs||{})){if(!move.name||!move.hint)issues.push(`${id}: neúplný tah soupeře`);}return issues;}
  globalThis.KorytoDebateSystem={VERSION,baseState,chooseIntent,intentText,cardModifier,cardOdds,abilityInfo,validate};
})();
