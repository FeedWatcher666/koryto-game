"use strict";
(() => {
  const VERSION = "0.14.5 TEST.10";
  const BUILD_VERSION = "0.14.5-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const RELEASE_FLAG = "v0145PlayabilityComplete";

  const coachSteps = [
    {
      icon: "🎯",
      title: "Vyhrajte třináctidenní kampaň",
      text: "Každý den máte dvě akce. Řešte hořící kauzy, budujte podporu a nenechte Věčného ovládnout obec, zatímco čtete třetí odstavec tiskové zprávy.",
      action: "Nejdřív otevřete zvýrazněnou lokaci s hlavním questem."
    },
    {
      icon: "🗺️",
      title: "Mapa je váš denní plán",
      text: "Červené lokace mají termín nebo hrozbu. Zlatá značka ukazuje doporučenou prioritu. Číslo v rohu říká, kolik konkrétních událostí tam čeká.",
      action: "Jedna návštěva a rozhodnutí obvykle spotřebují jednu akci."
    },
    {
      icon: "🎲",
      title: "Rozhodnutí mají čitelnou cenu",
      text: "U každé volby vidíte šanci čistého úspěchu, úspěchu za cenu a komplikace. Drahá či špinavá cesta může být rychlá, ale vrátí se ve volbách, vztazích nebo koalici.",
      action: "Sledujte nejen bonus k hodu, ale také tagy, peníze, integritu a politický dluh."
    },
    {
      icon: "🌙",
      title: "Obec jedná i bez vás",
      text: "Na konci dne táhnou frakce, soupeř a členové štábu. Ranní briefing shrne, co se změnilo, co hoří a kam má smysl jít.",
      action: "Ukončit den dříve lze, ale Věčný získá prostor za každou nevyužitou akci."
    }
  ];

  const classFocus = {
    bard: { difficulty: "snadný start", focus: "veřejné tahy a nálada", risk: "nižší důvěra při přehánění" },
    rogue: { difficulty: "agresivní", focus: "kompromat, peníze a zákulisí", risk: "rychlá korytizace" },
    paladin: { difficulty: "stabilní", focus: "důvěra, pravidla a občané", risk: "méně peněz a vlivu" },
    mage: { difficulty: "taktický", focus: "právo, smlouvy a audit", risk: "slabší veřejné projevy" },
    technocrat: { difficulty: "analytický", focus: "odborné hody a plánování", risk: "málo charismatu" },
    necro: { difficulty: "mocenský", focus: "aparát a staré struktury", risk: "vysoký mediální účet" }
  };

  const intentCounters = {
    emptyPromise: { counter: "Tabulka bez emocí", why: "Rozpočet a konkrétní čísla lámou jednoduchý slib." },
    emotional: { counter: "Pustit ke slovu občany", why: "Osobní svědectví vezme Věčnému monopol na emoce." },
    reverseFacts: { counter: "Odhal kompromat", why: "Dokument ukončí spor o to, která realita platí." },
    procedural: { counter: "Koaliční klička", why: "Přesuňte debatu z procedury k jeho povolební izolaci." },
    attack: { counter: "Změnit téma vtipem", why: "Lehký tah sníží tlak a nekrmí osobní útok." }
  };

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const esc = value => String(value ?? "").replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]);
  const metricLabels = {support:"Podpora",trust:"Důvěra",funds:"Peníze",heat:"Mediální tlak",influence:"Vliv",integrity:"Integrita",leverage:"Kompromat",debt:"Politický dluh"};

  function companionTone(loyalty) {
    const value = finite(loyalty, 50);
    if (value < 25) return { label: "na hraně odchodu", className: "critical" };
    if (value < 42) return { label: "pochybuje", className: "warning" };
    if (value > 72) return { label: "pevný spojenec", className: "good" };
    return { label: "spolupracuje", className: "neutral" };
  }

  function questKind(id) {
    if (/Personal$/u.test(id) || /^agenda/u.test(id) || /^conflict/u.test(id)) return "personal";
    if (["register","diesel","roof","meadow","paper","oldfiles","debate","program"].includes(id)) return "main";
    return "opportunity";
  }

  function classifyQuest(id, questState, target, deps = {}) {
    const defs = deps.questDefs || globalThis.KorytoQuestData?.definitions || {};
    const definition = defs[id] || { title:id, desc:"", location:"hq", failure:"Neřešený problém posílí soupeře." };
    const deadlineFn = deps.questDeadline || (questId => finite(definition.deadline, 14) + finite(questState?.deadlineBonus, 0));
    const deadline = finite(deadlineFn(id), 14);
    const day = finite(target?.day, 1);
    const left = deadline - day;
    return {
      id,
      kind: questKind(id),
      title: definition.title,
      desc: definition.desc,
      location: definition.location,
      failure: definition.failure,
      deadline,
      left,
      pressure: left <= 1 ? "kritické" : left <= 3 ? "naléhavé" : "aktivní"
    };
  }

  function prioritySnapshot(target, deps = {}) {
    if (!target || typeof target !== "object") return { urgent:[], recommended:null, faction:null, companion:null };
    const questStates = target.quests && typeof target.quests === "object" ? target.quests : {};
    const active = Object.entries(questStates)
      .filter(([,q]) => q?.status === "active")
      .map(([id,q]) => classifyQuest(id,q,target,deps))
      .sort((a,b) => a.left - b.left || a.title.localeCompare(b.title,"cs"));
    const urgent = active.filter(item => item.left <= 3);

    const planDefs = deps.factionPlanDefs || globalThis.KorytoFactionData?.factionPlanDefs || {};
    const factionEntries = Object.entries(target.factionPlans || {}).map(([id,plan]) => ({
      id,
      name: planDefs[id]?.name || id,
      icon: planDefs[id]?.icon || "⚠️",
      location: planDefs[id]?.location || "townhall",
      progress: finite(plan?.progress, 0)
    })).sort((a,b) => b.progress - a.progress);
    const faction = factionEntries[0] || null;

    const partyDefs = deps.companions || globalThis.KorytoCompanionData?.companions || {};
    const companions = Object.entries(target.party || {}).map(([id,p]) => {
      const ambition = target.companionAmbitions?.[id] || {};
      return {
        id,
        name: p?.name || partyDefs[id]?.name || id,
        icon: p?.icon || partyDefs[id]?.icon || "👤",
        loyalty: finite(p?.loyalty, 50),
        tension: finite(ambition.tension, 0),
        score: (100 - finite(p?.loyalty, 50)) + finite(ambition.tension, 0) * .65
      };
    }).sort((a,b) => b.score - a.score);
    const companion = companions[0] || null;

    let recommended = urgent[0] ? {
      location: urgent[0].location,
      icon: "🔥",
      title: urgent[0].title,
      reason: `${urgent[0].pressure}; ${Math.max(0,urgent[0].left)} dnů do termínu`
    } : null;
    if (!recommended && faction && faction.progress >= 45) recommended = {
      location: faction.location,
      icon: faction.icon,
      title: faction.name,
      reason: `mocenský plán je na ${Math.round(faction.progress)} %`
    };
    if (!recommended && companion && companion.loyalty < 42) recommended = {
      location: globalThis.KorytoCompanionData?.companionAmbitionDefs?.[companion.id]?.location || "hq",
      icon: companion.icon,
      title: companion.name,
      reason: companionTone(companion.loyalty).label
    };
    if (!recommended && active[0]) recommended = {
      location: active[0].location,
      icon: "📌",
      title: active[0].title,
      reason: "nejbližší známý termín"
    };
    return { active, urgent, recommended, faction, companion };
  }

  function electionAnalysis(target) {
    const breakdown = Array.isArray(target?.electionBreakdown) ? [...target.electionBreakdown] : [];
    breakdown.sort((a,b) => finite(b.votes) - finite(a.votes));
    const strongest = breakdown[0] || null;
    const weakest = breakdown.filter(row => finite(row.ballots) > 20).sort((a,b) => finite(a.share) - finite(b.share))[0] || null;
    const promises = target?.promiseSummary || {};
    const costs = [];
    if (finite(promises.broken) > 0) costs.push(`${promises.broken} porušených závazků`);
    if (finite(target?.debt) > 0) costs.push(`dluh ${Math.round(target.debt)}`);
    if (finite(target?.stats?.heat) > 45) costs.push(`vysoký mediální tlak ${Math.round(target.stats.heat)}`);
    if (finite(target?.stats?.integrity) < 35) costs.push(`integrita pouze ${Math.round(target.stats.integrity)}`);
    return { strongest, weakest, costs };
  }

  function ensureState(target) {
    if (!target || typeof target !== "object") return target;
    target.flags = target.flags && typeof target.flags === "object" ? target.flags : {};
    target.ui = target.ui && typeof target.ui === "object" ? target.ui : {};
    target.ui.v0145 = target.ui.v0145 && typeof target.ui.v0145 === "object" ? target.ui.v0145 : {};
    const ui = target.ui.v0145;
    ui.briefedDay = Math.max(0, Math.floor(finite(ui.briefedDay, 0)));
    ui.coachStep = Math.max(0, Math.min(coachSteps.length - 1, Math.floor(finite(ui.coachStep, 0))));
    ui.coachDone = Boolean(ui.coachDone);
    ui.companionReasons = ui.companionReasons && typeof ui.companionReasons === "object" ? ui.companionReasons : {};
    ui.dailyDelta = ui.dailyDelta && typeof ui.dailyDelta === "object" ? ui.dailyDelta : null;
    target.flags[RELEASE_FLAG] = VERSION;
    return target;
  }

  function deltaRows(before, after) {
    const keys = ["support","trust","funds","heat","influence","integrity","leverage"];
    const rows = keys.map(key => ({ key, label:metricLabels[key], value:Math.round(finite(after?.stats?.[key]) - finite(before?.stats?.[key])) })).filter(row => row.value !== 0);
    const debt = Math.round(finite(after?.debt) - finite(before?.debt));
    if (debt) rows.push({key:"debt",label:metricLabels.debt,value:debt});
    return rows;
  }

  function contentDefinitions() {
    if (typeof makeOutcome !== "function") return {};
    const outcome = (text, effects, tags = [], extra = () => {}) => makeOutcome(text, effects, tags, extra);
    return {
      doorstepRumor: {
        id: "doorstepRumor", location: "pub", title: "Řetězová zpráva od tety z okresu", emoji: "📱", kicker: "NOVÁ UDÁLOST",
        available: () => state.day >= 2 && !state.flags.done_doorstepRumor,
        text: () => [
          "V místní skupině se šíří zpráva, že po volbách zakážete zabijačky a zavedete povinné sdílené kompostéry.",
          "Autorem je účet bez fotografie, který přesně zná Brázdův pravopis."
        ],
        choices: [
          {
            label: "Zveřejnit ověřené vysvětlení", detail: "Pomalejší, ale dohledatelné. Přiložíte program a zdroj fámy.", check: {attr:"intellect",dc:11}, tags:["transparent","press","ethical"],
            success: outcome("Fáma zeslábne a několik lidí poprvé otevře váš program.",{trust:6,press:4,integrity:3,support:2},["transparent"],() => addNews("Řetězová zpráva byla doloženě nepravdivá. Část obce ji sdílí dál pro jistotu.")),
            fail: outcome("Vysvětlení má sedm bodů a nikdo se nedostane za třetí.",{trust:2,heat:3,press:-2},["transparent"])
          },
          {
            label: "Odpovědět lepší fámou", detail: "Tvrdíte, že Věčný chce zpoplatnit domácí tlačenku.", check:{attr:"cunning",dc:12}, tags:["lie","public"],
            success: outcome("Vaše fáma je zábavnější a přebije původní zprávu.",{support:6,heat:5,integrity:-7,oldguard:-4},["lie","public"]),
            fail: outcome("Obě fámy se spojí. Nyní prý zakážete zabijačky společně s Věčným.",{support:-2,heat:9,integrity:-6},["lie"])
          }
        ]
      },
      playgroundPhoto: {
        id:"playgroundPhoto",location:"school",title:"Fotografie s dítětem a cizím souhlasem",emoji:"📸",kicker:"KAMPAŇ",
        available:()=>state.day>=3&&!state.flags.done_playgroundPhoto,
        text:()=>[
          "Štáb navrhuje fotografii na školním hřišti. Rodiče ale netuší, že jejich děti budou kulisou kampaně.",
          "Marie čeká, zda z dětí uděláte občany, nebo grafický prvek."
        ],
        choices:[
          {
            label:"Požádat rodiče a mluvit bez dětí v záběru",detail:"Méně efektní, zato bez budoucí omluvy.",check:{attr:"resilience",dc:10},tags:["children","ethical","public"],
            success:outcome("Rodiče přijdou sami a fotografie působí překvapivě lidsky.",{trust:7,support:4,integrity:5,citizens:5},["children","ethical"],()=>{if(state.party.marie)state.party.marie.loyalty=clamp(state.party.marie.loyalty+6)}),
            fail:outcome("Setkání je komorní, ale nikdo nemusí mazat fotografii.",{trust:3,integrity:3},["children"])
          },
          {
            label:"Uděláme z toho silný vizuál",detail:"Děti, transparent, helmy a kandidát uprostřed.",check:{attr:"charisma",dc:11},tags:["children","public","lie"],
            success:outcome("Fotografie oběhne obec. Marie ji označí za politické školní tablo.",{support:7,heat:4,integrity:-6,trust:-2},["public","lie"],()=>{if(state.party.marie)state.party.marie.loyalty=clamp(state.party.marie.loyalty-8)}),
            fail:outcome("Jedno dítě drží transparent obráceně a druhé nahlas vysvětluje, kdo mu ho podal.",{support:1,heat:8,trust:-5,integrity:-5},["public"])
          }
        ]
      },
      busStopPromise: {
        id:"busStopPromise",location:"townhall",title:"Zastávka, která je vždy v programu",emoji:"🚌",kicker:"SLIB",
        available:()=>state.day>=4&&!state.flags.done_busStopPromise,
        text:()=>[
          "Obyvatelé horního konce chtějí autobusovou zastávku. Projekt se objevuje v programech už šestnáct let.",
          "Bohumil má připravený starý výkres a nový důvod, proč to nejde."
        ],
        choices:[
          {
            label:"Přijmout kontrolovatelný veřejný závazek",detail:"Termín, rozpočet a jméno odpovědné osoby.",check:{attr:"authority",dc:12},tags:["ethical","public","legal"],
            success:outcome("Závazek působí konkrétně a občané si jej skutečně zapíší.",{trust:7,support:5,integrity:5,officials:2},["ethical","public"],()=>addCommitment({id:`v0145_bus_${state.day}`,title:"Připravit autobusovou zastávku",creditor:"Horní konec",due:13,kind:"public",notes:"konkrétní termín a rozpočet"})),
            fail:outcome("Rozpočet nesedí, ale slib už má vlastní leták.",{support:3,heat:4},["public"],()=>addCommitment({id:`v0145_bus_${state.day}`,title:"Připravit autobusovou zastávku",creditor:"Horní konec",due:12,kind:"public",notes:"rozpočet chybí"}))
          },
          {
            label:"Slíbit studii proveditelnosti",detail:"Nezavazuje stavět, pouze důstojně odložit.",check:{attr:"intellect",dc:10},tags:["legal","gray"],
            success:outcome("Studie získá číslo jednací a slib přežije další volby.",{officials:6,influence:4,support:2,integrity:-2},["legal"]),
            fail:outcome("Občané poznají starou formulaci z minulých programů.",{trust:-5,heat:4,oldguard:3},["gray"])
          }
        ]
      },
      localInfluencer: {
        id:"localInfluencer",location:"hq",title:"Reels z garáže",emoji:"🤳",kicker:"SOCIÁLNÍ SÍTĚ",
        available:()=>state.day>=5&&!state.flags.done_localInfluencer,
        text:()=>[
          "Místní influencer nabízí tři videa, jedno živé vysílání a autentickou podporu podle ceníku.",
          "Jeho hlavní publikum tvoří lidé z okresu, dvě fitness centra a vaše neteř."
        ],
        choices:[
          {
            label:"Ukázat zákulisí bez scénáře",detail:"Méně kontroly, více skutečných lidí a problémů.",check:{attr:"charisma",dc:12},tags:["public","transparent"],
            success:outcome("Video ukáže chaos, práci i jednu dobrou odpověď. Působí opravdově.",{support:7,trust:5,press:3,heat:2},["public","transparent"]),
            fail:outcome("Živé vysílání zachytí hádku o tiskárnu. Kupodivu získá nejvíc zhlédnutí.",{support:3,heat:6,trust:-1},["public"])
          },
          {
            label:"Koupit profesionální spontánnost",detail:"Světla, scénář, komparz a označení spolupráce malým písmem.",check:{attr:"cunning",dc:11},cost:4,tags:["contract","lie","public"],
            success:outcome("Klip vypadá jako národní kampaň a obec se na chvíli cítí významně.",{support:9,press:5,trust:-3,integrity:-5,heat:4},["contract","lie"]),
            fail:outcome("Influencer omylem zveřejní ceník i scénář autentické otázky.",{funds:-2,heat:12,trust:-7,integrity:-6},["contract","lie"])
          }
        ]
      },
      posterWar: {
        id:"posterWar",location:"paper",title:"Noc dlouhých izolep",emoji:"🪧",kicker:"PROTIKAMPAŇ",
        available:()=>state.day>=7&&!state.flags.done_posterWar,
        text:()=>[
          "Přes noc někdo přelepil vaše plakáty nápisem KORYTO PRO SEBE. Kamera zachytila dodávku bez loga a Brázdův traktor s velmi výrazným logem.",
          "Daniela nabízí ověřit pachatele. Štáb chce odpovědět ještě před snídaní."
        ],
        choices:[
          {
            label:"Doložit pachatele a zveřejnit celý záznam",detail:"Pomalejší protiútok, který musí přežít kontrolu.",check:{attr:"intellect",dc:13},tags:["transparent","press","legal"],
            success:outcome("Záznam spojí akci s Věčného týmem a útok se obrátí proti němu.",{trust:8,press:7,oldguard:-7,heat:-2,leverage:3},["transparent","press"],()=>addNews("Kamerový záznam spojil noční přelepování plakátů s Věčného štábem.","bad")),
            fail:outcome("Dodávka je dohledatelná, řidič nikoli. Příběh zůstane viset mezi důkazem a dojmem.",{press:2,heat:4,leverage:1},["press"])
          },
          {
            label:"Přelepit jejich plakáty ještě chytřeji",detail:"Rychlá odveta a noční výlet štábu.",check:{attr:"cunning",dc:11},tags:["lie","power","pressAttack"],
            success:outcome("Věčný se ráno probudí jako kandidát minulého století.",{support:6,oldguard:-5,heat:7,integrity:-7},["lie","pressAttack"]),
            fail:outcome("Bohumil přilepí rukáv k plakátu a hlídka pořídí velmi čitelnou fotografii.",{support:-2,heat:12,integrity:-8},["lie"])
          }
        ]
      },
      seniorTea: {
        id:"seniorTea",location:"pub",title:"Čaj o páté a seznam oprav",emoji:"🫖",kicker:"VOLIČSKÝ BLOK",
        available:()=>state.day>=8&&!state.flags.done_seniorTea,
        text:()=>[
          "Senioři vás zvou na čaj. Přinesli seznam neopravených chodníků, nefungujících lamp a politiků, kteří už slíbili obojí.",
          "Věčný má u této skupiny náskok několika laviček a třiceti let osobních přání k narozeninám."
        ],
        choices:[
          {
            label:"Projít seznam bod po bodu",detail:"Dlouhé setkání bez velkého gesta.",check:{attr:"resilience",dc:12},tags:["ethical","public"],
            success:outcome("Nevyřešíte vše, ale poprvé je někdo skutečně vyslechne.",{trust:8,support:5,integrity:3},["ethical","public"],()=>adjustVoter("seniors",7,.03)),
            fail:outcome("Setkání skončí u lampy číslo sedm. Oceňují alespoň výdrž.",{trust:3,support:2},["ethical"],()=>adjustVoter("seniors",3,.01))
          },
          {
            label:"Oznámit balíček Bezpečné stáří",detail:"Jednoduchý název, zatím bez jednoduchého rozpočtu.",check:{attr:"charisma",dc:11},tags:["public","lie"],
            success:outcome("Název funguje a Věčný musí vysvětlovat, proč ho nenapadl dřív.",{support:8,trust:1,heat:4,integrity:-4},["public","lie"],()=>adjustVoter("seniors",5,.02)),
            fail:outcome("První otázka na rozpočet ukončí prezentaci ve druhém slidu.",{trust:-4,heat:6,integrity:-3},["lie"])
          }
        ]
      },
      underpassFlood: {
        id:"underpassFlood",location:"townhall",title:"Podchod zase objevil vodu",emoji:"🌊",kicker:"KRIZOVÁ UDÁLOST",
        available:()=>state.day>=9&&!state.flags.done_underpassFlood,
        text:()=>[
          "Po dešti je podchod neprůchodný. Obecní čerpadlo je v opravě a náhradní čerpadlo je podle evidence také v podchodu.",
          "Krize nabízí pomoc lidem, fotografii kampani a zakázku někomu, kdo zvedá telefon."
        ],
        choices:[
          {
            label:"Svolat dobrovolníky a zveřejnit náklady",detail:"Rychlá pomoc s otevřeným účtem.",check:{attr:"authority",dc:13},tags:["ethical","transparent","public"],
            success:outcome("Podchod je večer otevřený a účet je kratší než tisková zpráva.",{support:9,trust:8,citizens:7,integrity:5,funds:-3},["ethical","transparent"]),
            fail:outcome("Dobrovolníci pomohou, ale koordinace vypadá jako vodní cvičení bez velitele.",{support:4,trust:2,heat:3,funds:-2},["public"])
          },
          {
            label:"Objednat Holubovu krizovou jednotku",detail:"Přijede okamžitě a faktura ještě rychleji.",check:{attr:"cunning",dc:10},cost:3,tags:["contract","business"],
            success:outcome("Podchod je suchý, Holub má další referenci a vy další neformální závazek.",{support:7,business:8,influence:5,integrity:-6,trust:-2},["contract","business"],()=>addCommitment({id:`v0145_flood_${state.day}`,title:"Vyrovnat krizovou zakázku",creditor:"Richard Holub",due:13,kind:"private",notes:"podchod a čerpadla"})),
            fail:outcome("Jednotka přijede bez čerpadla, ale s fotografem.",{funds:-3,heat:8,business:4,trust:-5},["contract"])
          }
        ]
      },
      silentMajority: {
        id:"silentMajority",location:"hq",title:"Tichá většina má vypnuté notifikace",emoji:"🔕",kicker:"FINÁLNÍ MOBILIZACE",
        available:()=>state.day>=11&&!state.flags.done_silentMajority,
        text:()=>[
          "Průzkum ukazuje desítky sympatizantů, kteří neplánují přijít k volbám. Nejsou proti vám. Jen mají zahradu, směnu nebo pocit, že všichni politici stejně skončí u jednoho stolu.",
          "Poslední dny kampaně rozhodnou, zda z podpory vzniknou hlasy."
        ],
        choices:[
          {
            label:"Osobní mobilizace podle ulic",detail:"Dobrovolníci, telefonáty a konkrétní volební informace.",check:{attr:"resilience",dc:13},tags:["ethical","public"],
            success:outcome("Tichá podpora získá datum, místo a důvod přijít.",{support:8,trust:5,influence:4},["ethical","public"],()=>{for(const id of ["undecided","disengaged"])adjustVoter(id,5,.06)}),
            fail:outcome("Seznamy jsou neúplné, ale několik dosud tichých lidí se zapojí.",{support:3,influence:2},["public"],()=>adjustVoter("disengaged",3,.03))
          },
          {
            label:"Spustit poslední vlnu placených zpráv",detail:"Dosah je jistý, důvěryhodnost už méně.",check:{attr:"cunning",dc:12},cost:5,tags:["contract","lie","public"],
            success:outcome("Telefon obce na dva dny ovládne vaše tvář a velmi krátký program.",{support:10,heat:6,integrity:-5,trust:-2},["contract","lie"],()=>adjustVoter("undecided",6,.04)),
            fail:outcome("Zprávy dorazí dvakrát i lidem, kteří už kandidují za vás.",{funds:-2,heat:10,trust:-6},["contract","lie"])
          }
        ]
      }
    };
  }
  function installContent() {
    if (typeof events === "undefined" || !events || typeof events !== "object") return 0;
    const additions = contentDefinitions();
    let count = 0;
    for (const [id,definition] of Object.entries(additions)) {
      if (!events[id]) { events[id] = definition; count++; }
    }
    return count;
  }

  function createElement(id, className, parent = document.body) {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement("div");
      element.id = id;
      if (className) element.className = className;
      parent.appendChild(element);
    }
    return element;
  }

  function closeOverlay(id) {
    document.getElementById(id)?.classList.add("hidden");
  }

  function showCoach(step = null) {
    if (typeof document === "undefined" || typeof state === "undefined") return null;
    ensureState(state);
    const ui = state.ui.v0145;
    const index = step === null ? ui.coachStep : Math.max(0, Math.min(coachSteps.length - 1, step));
    ui.coachStep = index;
    const data = coachSteps[index];
    const overlay = createElement("v0145CoachOverlay", "overlay v0145-overlay hidden");
    overlay.innerHTML = `<div class="v0145-dialog" role="dialog" aria-modal="true" aria-labelledby="v0145CoachTitle">
      <button class="v0145-close" id="v0145CoachClose" aria-label="Zavřít průvodce">×</button>
      <p class="eyebrow">RYCHLÝ PRŮVODCE · ${index + 1}/${coachSteps.length}</p>
      <div class="v0145-coach-icon">${data.icon}</div>
      <h2 id="v0145CoachTitle">${data.title}</h2>
      <p>${data.text}</p>
      <div class="v0145-action-note"><strong>Co teď:</strong> ${data.action}</div>
      <div class="v0145-dialog-actions">
        <button id="v0145CoachPrev" class="btn small" ${index === 0 ? "disabled" : ""}>Zpět</button>
        <button id="v0145CoachNext" class="btn primary">${index === coachSteps.length - 1 ? "Rozumím, jdu kandidovat" : "Další"}</button>
      </div>
    </div>`;
    overlay.classList.remove("hidden");
    document.getElementById("v0145CoachClose").onclick = () => { ui.coachDone = true; closeOverlay("v0145CoachOverlay"); };
    document.getElementById("v0145CoachPrev").onclick = () => showCoach(index - 1);
    document.getElementById("v0145CoachNext").onclick = () => {
      if (index >= coachSteps.length - 1) { ui.coachDone = true; closeOverlay("v0145CoachOverlay"); }
      else showCoach(index + 1);
    };
    return overlay;
  }

  function dailyDeltaHtml(delta) {
    if (!delta?.rows?.length) return "<p>Včerejší účet nemá výraznou číselnou změnu. To neznamená, že si ho nikdo nezapsal.</p>";
    return `<div class="v0145-delta-grid">${delta.rows.map(row => `<div class="v0145-delta ${row.value > 0 ? "up" : "down"}"><span>${esc(row.label)}</span><strong>${row.value > 0 ? "+" : ""}${row.value}</strong></div>`).join("")}</div>`;
  }

  function briefingHtml(target) {
    const snapshot = prioritySnapshot(target, {questDefs:typeof questDefs !== "undefined" ? questDefs : undefined, questDeadline:typeof questDeadline === "function" ? questDeadline : undefined, factionPlanDefs:typeof factionPlanDefs !== "undefined" ? factionPlanDefs : undefined, companions:typeof companions !== "undefined" ? companions : undefined});
    const urgent = snapshot.urgent.slice(0,3);
    const recommendation = snapshot.recommended;
    const faction = snapshot.faction;
    const companion = snapshot.companion;
    return `<div class="v0145-brief-grid">
      <section><h3>🔥 Co hoří</h3>${urgent.length ? urgent.map(item => `<div class="v0145-brief-row"><strong>${esc(item.title)}</strong><span>${Math.max(0,item.left)} dnů · ${esc((typeof locations !== "undefined" && locations[item.location]?.name) || item.location)}</span></div>`).join("") : "<p>Žádný známý termín není do tří dnů. To je chvíle pro iniciativu, ne pro dovolenou.</p>"}</section>
      <section><h3>🕸️ Kdo táhne</h3>${faction ? `<div class="v0145-brief-row"><strong>${esc(faction.icon)} ${esc(faction.name)}</strong><span>postup ${Math.round(faction.progress)} %</span></div>` : "<p>Frakce se zatím tváří, že jen pozorují.</p>"}</section>
      <section><h3>🤝 Kdo může prasknout</h3>${companion ? `<div class="v0145-brief-row"><strong>${esc(companion.icon)} ${esc(companion.name)}</strong><span>${companionTone(companion.loyalty).label} · loajalita ${Math.round(companion.loyalty)}</span></div>` : "<p>Nemáte družinu. Nemá tedy kdo odejít, jen voliči.</p>"}</section>
    </div>
    ${recommendation ? `<div class="v0145-recommend"><span>${recommendation.icon}</span><div><small>DOPORUČENÝ PRVNÍ TAH</small><strong>${esc(recommendation.title)}</strong><p>${esc(recommendation.reason)}</p></div><button class="btn primary" id="v0145GoPriority">Otevřít lokaci</button></div>` : ""}`;
  }

  function showBriefing(force = false) {
    if (typeof document === "undefined" || typeof state === "undefined" || state.ended || state.phase !== "map") return null;
    ensureState(state);
    const ui = state.ui.v0145;
    if (!force && ui.briefedDay === state.day) return null;
    ui.briefedDay = state.day;
    const overlay = createElement("v0145BriefingOverlay", "overlay v0145-overlay hidden");
    overlay.innerHTML = `<div class="v0145-dialog v0145-briefing-dialog" role="dialog" aria-modal="true" aria-labelledby="v0145BriefingTitle">
      <button class="v0145-close" id="v0145BriefingClose" aria-label="Zavřít briefing">×</button>
      <p class="eyebrow">RANNÍ BRIEFING</p><h2 id="v0145BriefingTitle">Den ${state.day}: co se v obci děje bez vás</h2>
      ${ui.dailyDelta ? `<section class="v0145-yesterday"><h3>Včerejší účet</h3>${dailyDeltaHtml(ui.dailyDelta)}</section>` : ""}
      ${briefingHtml(state)}
      <div class="v0145-dialog-actions"><button id="v0145BriefingContinue" class="btn primary">Začít den · ${state.actions} akce</button></div>
    </div>`;
    overlay.classList.remove("hidden");
    const close = () => closeOverlay("v0145BriefingOverlay");
    document.getElementById("v0145BriefingClose").onclick = close;
    document.getElementById("v0145BriefingContinue").onclick = close;
    const button = document.getElementById("v0145GoPriority");
    if (button) button.onclick = () => {
      const location = prioritySnapshot(state, {questDefs,questDeadline,factionPlanDefs,companions}).recommended?.location;
      close();
      if (location && typeof showLocation === "function") showLocation(location);
    };
    return overlay;
  }

  function installToolbar() {
    const actions = document.querySelector(".topbar .actions");
    if (!actions || document.getElementById("v0145GuideBtn")) return;
    const guide = document.createElement("button");
    guide.id = "v0145GuideBtn";
    guide.className = "btn small hidden";
    guide.textContent = "Průvodce";
    guide.onclick = () => showCoach(0);
    const briefing = document.createElement("button");
    briefing.id = "v0145BriefingBtn";
    briefing.className = "btn small hidden";
    briefing.textContent = "Denní plán";
    briefing.onclick = () => showBriefing(true);
    const feedback = document.createElement("a");
    feedback.id = "v0145FeedbackBtn";
    feedback.className = "btn small hidden";
    feedback.textContent = "Nahlásit chybu";
    feedback.href = "https://github.com/FeedWatcher666/koryto-game/issues/new?template=bug_report.yml";
    feedback.target = "_blank";
    feedback.rel = "noreferrer";
    actions.insertBefore(feedback, actions.firstChild);
    actions.insertBefore(briefing, actions.firstChild);
    actions.insertBefore(guide, actions.firstChild);
  }

  function revealToolbar() {
    document.getElementById("v0145GuideBtn")?.classList.remove("hidden");
    document.getElementById("v0145BriefingBtn")?.classList.remove("hidden");
    document.getElementById("v0145FeedbackBtn")?.classList.remove("hidden");
  }

  function decorateCreation() {
    const grid = document.getElementById("classGrid");
    if (grid) {
      grid.querySelectorAll(".class-card[data-class]").forEach(card => {
        if (card.querySelector(".v0145-class-read")) return;
        const id = card.dataset.class;
        const profile = classFocus[id] || {difficulty:"specifický",focus:"vlastní cesta",risk:"neznámé následky"};
        const attrs = globalThis.KorytoCoreData?.classes?.[id]?.attrs || {};
        const row = document.createElement("div");
        row.className = "v0145-class-read";
        row.innerHTML = `<div><span>${esc(profile.difficulty)}</span><b>${esc(profile.focus)}</b></div><small>Riziko: ${esc(profile.risk)}</small><div class="v0145-attr-row">${Object.entries(attrs).map(([key,value]) => `<i title="${esc(key)}">${key.slice(0,3).toUpperCase()} ${value}</i>`).join("")}</div>`;
        card.appendChild(row);
      });
    }
    const origin = document.getElementById("origin");
    if (origin && !document.getElementById("v0145OriginHint")) {
      const hint = document.createElement("div");
      hint.id = "v0145OriginHint";
      hint.className = "v0145-origin-hint";
      const update = () => {
        const texts = {
          idealist:"Začnete s vyšší důvěrou a integritou, ale s menší hotovostí.",
          ambitious:"Získáte vliv a podporu, ale část obce už tuší kariérní motivaci.",
          revenge:"Začnete s kompromatem a autoritou, ale také s nižší integritou."
        };
        hint.textContent = texts[origin.value] || "Motivace mění výchozí zdroje a způsob, jak vás čte soupeř.";
      };
      origin.insertAdjacentElement("afterend", hint);
      origin.addEventListener("change", update);
      update();
    }
  }

  function renderPriorityBar() {
    if (typeof state === "undefined" || state.ended || !document.getElementById("gameScreen")?.classList.contains("active")) return;
    const mapView = document.getElementById("mapView");
    if (!mapView) return;
    let bar = document.getElementById("v0145PriorityBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "v0145PriorityBar";
      bar.className = "v0145-priority-bar";
      mapView.insertBefore(bar, mapView.firstChild);
    }
    const snapshot = prioritySnapshot(state, {questDefs,questDeadline,factionPlanDefs,companions});
    const rec = snapshot.recommended;
    bar.innerHTML = rec ? `<div><small>DOPORUČENÁ PRIORITA</small><strong>${rec.icon} ${esc(rec.title)}</strong><span>${esc(rec.reason)}</span></div><button class="btn small" id="v0145PriorityOpen">Jít na místo</button>` : `<div><small>DENNÍ PLÁN</small><strong>Žádná povinná priorita</strong><span>Využijte den na průzkum, družinu nebo vlastní politickou chybu.</span></div>`;
    const open = document.getElementById("v0145PriorityOpen");
    if (open) open.onclick = () => rec.location && showLocation(rec.location);
  }

  function decorateMap() {
    if (typeof state === "undefined" || typeof getActivities !== "function") return;
    const snapshot = prioritySnapshot(state, {questDefs,questDeadline,factionPlanDefs,companions});
    document.querySelectorAll("#map .location[data-loc]").forEach(button => {
      const id = button.dataset.loc;
      const activities = getActivities(id);
      const urgent = activities.filter(activity => activity.urgent);
      const priority = snapshot.recommended?.location === id;
      const label = document.createElement("span");
      label.className = `v0145-map-label ${urgent.length ? "danger" : priority ? "priority" : ""}`;
      label.textContent = urgent.length ? `${urgent.length}× termín` : priority ? "doporučeno" : activities.length ? "příležitost" : "průzkum";
      button.appendChild(label);
      if (priority) button.classList.add("v0145-priority-location");
      const reason = document.createElement("small");
      reason.className = "v0145-map-reason";
      reason.textContent = urgent[0]?.title || (priority ? snapshot.recommended.reason : `${activities.length} dostupných tahů`);
      button.appendChild(reason);
    });
  }

  function renderQuestJournal() {
    if (typeof state === "undefined") return;
    const element = document.getElementById("journal");
    if (!element) return;
    const active = Object.entries(state.quests || {}).filter(([,q]) => q?.status === "active").map(([id,q]) => classifyQuest(id,q,state,{questDefs,questDeadline})).sort((a,b) => a.left-b.left);
    if (!active.length) {
      element.innerHTML = "<p style='color:var(--muted)'>Všechny známé problémy jsou vyřešeny, zameteny nebo přejmenovány.</p>";
      return;
    }
    const groups = [
      ["main","Hlavní kauzy"],
      ["personal","Lidé a štáb"],
      ["opportunity","Politické příležitosti"]
    ];
    element.innerHTML = groups.map(([kind,title]) => {
      const rows = active.filter(item => item.kind === kind);
      if (!rows.length) return "";
      return `<section class="v0145-quest-group"><h4>${title}</h4>${rows.map(item => {
        const total = Math.max(1,item.deadline - 1);
        const progress = Math.max(0,Math.min(100,((state.day-1)/total)*100));
        return `<button class="v0145-quest ${item.left<=2?"urgent":""}" data-quest-location="${esc(item.location)}"><div class="v0145-quest-head"><strong>${esc(item.title)}</strong><span>${item.left < 0 ? "po termínu" : item.left === 0 ? "dnes" : `${item.left} dnů`}</span></div><p>${esc(item.desc)}</p><div class="v0145-quest-track"><i style="width:${progress}%"></i></div><small>${esc((typeof locations!=="undefined"&&locations[item.location]?.name)||item.location)} · při selhání: ${esc(item.failure)}</small></button>`;
      }).join("")}</section>`;
    }).join("");
    element.querySelectorAll("[data-quest-location]").forEach(button => button.onclick = () => showLocation(button.dataset.questLocation));
  }

  function reasonFromTags(tags = [], delta = 0) {
    if (tags.includes("ethical") || tags.includes("transparent")) return delta >= 0 ? "ocenil otevřený a čitelný postup" : "nesouhlasí s tím, komu otevřenost ublížila";
    if (tags.includes("corrupt") || tags.includes("contract")) return delta >= 0 ? "vidí v dohodě vlastní příležitost" : "vadí mu zákulisní účet rozhodnutí";
    if (tags.includes("children")) return delta >= 0 ? "ocenil ochranu školy a dětí" : "děti se staly nástrojem kampaně";
    if (tags.includes("pressAttack") || tags.includes("lie")) return delta >= 0 ? "považuje tvrdou komunikaci za účinnou" : "nevěří způsobu, jakým štáb pracuje s pravdou";
    if (tags.includes("jzdDeal")) return delta >= 0 ? "dohoda posílila jeho vliv" : "dohodu považuje za nevděčnou";
    return delta >= 0 ? "poslední rozhodnutí mu vyhovovalo" : "poslední rozhodnutí zvýšilo pochybnosti";
  }

  function decorateParty() {
    if (typeof state === "undefined") return;
    ensureState(state);
    document.querySelectorAll("#partyList .party-item").forEach((item,index) => {
      const entry = Object.entries(state.party || {})[index];
      if (!entry || item.querySelector(".v0145-companion-read")) return;
      const [id,party] = entry;
      const tone = companionTone(party.loyalty);
      const reason = state.ui.v0145.companionReasons[id] || "zatím bez nového osobního sporu";
      const line = document.createElement("div");
      line.className = `v0145-companion-read ${tone.className}`;
      line.innerHTML = `<strong>${tone.label}</strong><span>${esc(reason)}</span>`;
      item.appendChild(line);
    });
  }

  function renderFactionIntel() {
    if (typeof state === "undefined") return;
    const bars = document.getElementById("factionBars");
    if (!bars) return;
    let intel = document.getElementById("v0145FactionIntel");
    if (!intel) {
      intel = document.createElement("div");
      intel.id = "v0145FactionIntel";
      intel.className = "v0145-faction-intel";
      bars.insertAdjacentElement("afterend",intel);
    }
    const snapshot = prioritySnapshot(state,{questDefs,questDeadline,factionPlanDefs,companions});
    const faction = snapshot.faction;
    const operation = state.rivalOperation;
    const operationDef = operation?.id && typeof rivalOperationDefs !== "undefined" ? rivalOperationDefs[operation.id] : null;
    intel.innerHTML = `${faction ? `<div><small>NEJVĚTŠÍ MOCENSKÝ TLAK</small><strong>${esc(faction.icon)} ${esc(faction.name)} · ${Math.round(faction.progress)} %</strong><span>${faction.progress>=75?"zásah je bezprostřední":faction.progress>=45?"plán získává vlastní dynamiku":"plán je zatím zranitelný"}</span></div>` : ""}${operationDef ? `<div><small>SOUPEŘŮV DALŠÍ SMĚR</small><strong>${operationDef.icon} ${operation.revealed?esc(operationDef.name):"Neznámá operace"}</strong><span>${operation.revealed?esc(operationDef.stages[Math.max(0,(operation.stage||1)-1)]):"Odhalte záměr v debatě, médiích nebo přes družinu."}</span></div>` : ""}`;
  }

  function decorateDecision() {
    if (typeof state === "undefined" || state.phase !== "event") return;
    const body = document.querySelector("#eventView .scene-body");
    if (!body || body.querySelector(".v0145-decision-read")) return;
    const event = typeof eventById === "function" ? eventById(state.currentEvent) : null;
    const choices = event?.choices || [];
    const tags = [...new Set(choices.flatMap(choice => choice.tags || []))];
    const warnings = [];
    if (choices.some(choice => finite(choice.cost) > 0)) warnings.push("některé cesty stojí peníze");
    if (tags.includes("corrupt") || tags.includes("contract")) warnings.push("zákulisní účet se může vrátit v koalici");
    if (tags.includes("lie") || tags.includes("pressAttack")) warnings.push("média a družina si pamatují způsob komunikace");
    if (tags.includes("ethical") || tags.includes("transparent")) warnings.push("čistší cesta obvykle posílí důvěru, ale nemusí být nejrychlejší");
    const read = document.createElement("div");
    read.className = "v0145-decision-read";
    read.innerHTML = `<strong>Strategické čtení</strong><span>${warnings.length ? warnings.map(esc).join(" · ") : "Volba mění okamžitá čísla i pozdější reakce obce."}</span>`;
    const choiceBox = body.querySelector("#choiceBox");
    body.insertBefore(read, choiceBox || body.firstChild);
  }

  function counterForIntent(intent) {
    return intentCounters[intent] || { counter:"Pustit ke slovu občany", why:"Bezpečná odpověď staví na zkušenosti místních a zvyšuje důvěru." };
  }

  function decorateDebate() {
    if (typeof state === "undefined" || !state.debate?.active) return;
    const stage = document.querySelector("#debateScreen .debate-stage");
    if (!stage) return;
    let read = document.getElementById("v0145DebateRead");
    if (!read) {
      read = document.createElement("div");
      read.id = "v0145DebateRead";
      read.className = "v0145-debate-read";
      stage.appendChild(read);
    }
    const intent = state.debate.intent || state.debate.opponentIntent || "attack";
    const counter = counterForIntent(intent);
    read.innerHTML = `<small>DOPORUČENÝ PROTITAH</small><strong>${esc(counter.counter)}</strong><span>${esc(counter.why)}</span>`;
  }

  function decorateCoalition() {
    document.querySelectorAll("#coalitionOfferPanel .offer").forEach(button => {
      if (button.querySelector(".v0145-offer-read")) return;
      const text = button.textContent || "";
      const read = document.createElement("span");
      read.className = "v0145-offer-read";
      read.textContent = /program|audit|veřej/u.test(text) ? "Dopad: vyšší důvěryhodnost, menší volnost" : /funk|výbor|ochran/u.test(text) ? "Dopad: rychlá většina, dlouhodobá protislužba" : "Dopad: vyšší tlak a riziko povolebního účtu";
      button.appendChild(read);
    });
  }

  function decorateEnding() {
    if (typeof state === "undefined") return;
    const story = document.getElementById("endingStory");
    if (!story || document.getElementById("v0145ElectionAnalysis")) return;
    const analysis = electionAnalysis(state);
    const section = document.createElement("section");
    section.id = "v0145ElectionAnalysis";
    section.className = "v0145-election-analysis";
    section.innerHTML = `<h3>Proč výsledek dopadl právě takto</h3><div class="v0145-election-grid">
      <div><small>NEJSILNĚJŠÍ BLOK</small><strong>${analysis.strongest ? `${esc(analysis.strongest.icon||"")} ${esc(analysis.strongest.name)} · ${finite(analysis.strongest.share).toFixed(1)} %` : "bez dat"}</strong></div>
      <div><small>NEJVĚTŠÍ REZERVA</small><strong>${analysis.weakest ? `${esc(analysis.weakest.icon||"")} ${esc(analysis.weakest.name)} · ${finite(analysis.weakest.share).toFixed(1)} %` : "bez dat"}</strong></div>
      <div><small>POLITICKÝ ÚČET</small><strong>${analysis.costs.length ? analysis.costs.map(esc).join(" · ") : "bez zásadního neuhrazeného účtu"}</strong></div>
    </div>`;
    story.insertBefore(section, story.firstChild);
  }

  function installWrappers() {
    if (typeof state !== "undefined") ensureState(state);

    if (typeof normalizeState === "function") {
      const original = normalizeState;
      normalizeState = function v0145NormalizeState(...args) {
        const result = original.apply(this,args);
        ensureState(state);
        return result;
      };
    }

    if (typeof newGame === "function") {
      const original = newGame;
      newGame = function v0145NewGame(...args) {
        const result = original.apply(this,args);
        ensureState(state);
        state.ui.v0145.briefedDay = 0;
        state.ui.v0145.coachDone = false;
        revealToolbar();
        return result;
      };
    }

    if (typeof renderAll === "function") {
      const original = renderAll;
      renderAll = function v0145RenderAll(...args) {
        const result = original.apply(this,args);
        ensureState(state);
        revealToolbar();
        renderPriorityBar();
        decorateMap();
        renderQuestJournal();
        decorateParty();
        renderFactionIntel();
        decorateDecision();
        decorateDebate();
        decorateCoalition();
        return result;
      };
    }

    if (typeof partyReact === "function") {
      const original = partyReact;
      partyReact = function v0145PartyReact(tags = [], ...args) {
        ensureState(state);
        const before = Object.fromEntries(Object.entries(state.party || {}).map(([id,p]) => [id,finite(p.loyalty,50)]));
        const result = original.call(this,tags,...args);
        for (const [id,p] of Object.entries(state.party || {})) {
          const delta = Math.round(finite(p.loyalty,50)-finite(before[id],finite(p.loyalty,50)));
          if (delta) state.ui.v0145.companionReasons[id] = `${reasonFromTags(tags,delta)} (${delta>0?"+":""}${delta})`;
        }
        return result;
      };
    }

    if (typeof endDay === "function") {
      const original = endDay;
      endDay = function v0145EndDay(...args) {
        ensureState(state);
        const before = {day:state.day,stats:{...state.stats},debt:state.debt};
        const result = original.apply(this,args);
        ensureState(state);
        state.ui.v0145.dailyDelta = {fromDay:before.day,rows:deltaRows(before,state)};
        return result;
      };
    }

    if (typeof skipDay === "function") {
      const original = skipDay;
      skipDay = function v0145SkipDay(...args) {
        if (state?.phase === "map" && finite(state.actions)>0 && typeof confirm === "function") {
          const penalty = finite(state.actions)*2;
          const accepted = confirm(`Zbývají ${state.actions} akce. Ukončením dne získá Věčný přibližně +${penalty} momenta a obec odehraje své tahy bez vás. Pokračovat?`);
          if (!accepted) return false;
        }
        return original.apply(this,args);
      };
    }

    if (typeof showMap === "function") {
      const original = showMap;
      showMap = function v0145ShowMap(...args) {
        const result = original.apply(this,args);
        ensureState(state);
        revealToolbar();
        if (!state.ui.v0145.coachDone && state.flags?.introDone) setTimeout(() => showCoach(state.ui.v0145.coachStep),0);
        else setTimeout(() => showBriefing(false),0);
        return result;
      };
    }

    if (typeof showLocation === "function") {
      const original = showLocation;
      showLocation = function v0145ShowLocation(...args) {
        const result = original.apply(this,args);
        const body = document.querySelector("#locationView .scene-body");
        if (body && !body.querySelector(".v0145-location-read")) {
          const snapshot = prioritySnapshot(state,{questDefs,questDeadline,factionPlanDefs,companions});
          const loc = args[0];
          const relevant = snapshot.active.filter(item => item.location===loc).slice(0,2);
          const read = document.createElement("div");
          read.className="v0145-location-read";
          read.innerHTML = relevant.length ? `<strong>Proč jste tady</strong><span>${relevant.map(item=>`${esc(item.title)} · ${item.left<=0?"dnes":item.left+" dnů"}`).join(" · ")}</span>` : `<strong>Volný politický tah</strong><span>Tato lokace nemá bezprostřední termín. Hledejte příležitost, důkaz nebo vztah.</span>`;
          body.insertBefore(read,body.firstChild);
        }
        return result;
      };
    }

    if (typeof showEvent === "function") {
      const original = showEvent;
      showEvent = function v0145ShowEvent(...args) {
        const result = original.apply(this,args);
        decorateDecision();
        return result;
      };
    }

    if (typeof renderDebate === "function") {
      const original = renderDebate;
      renderDebate = function v0145RenderDebate(...args) {
        const result = original.apply(this,args);
        decorateDebate();
        return result;
      };
    }

    if (typeof renderCoalition === "function") {
      const original = renderCoalition;
      renderCoalition = function v0145RenderCoalition(...args) {
        const result = original.apply(this,args);
        decorateCoalition();
        return result;
      };
    }

    if (typeof showEnding === "function") {
      const original = showEnding;
      showEnding = function v0145ShowEnding(...args) {
        const result = original.apply(this,args);
        decorateEnding();
        return result;
      };
    }

    if (globalThis.KorytoApp) {
      Object.assign(globalThis.KorytoApp, {
        VERSION,
        showMap:typeof showMap === "function" ? showMap : globalThis.KorytoApp.showMap,
        showLocation:typeof showLocation === "function" ? showLocation : globalThis.KorytoApp.showLocation,
        showEvent:typeof showEvent === "function" ? showEvent : globalThis.KorytoApp.showEvent,
        newGame:typeof newGame === "function" ? newGame : globalThis.KorytoApp.newGame,
        normalizeState:typeof normalizeState === "function" ? normalizeState : globalThis.KorytoApp.normalizeState,
        endDay:typeof endDay === "function" ? endDay : globalThis.KorytoApp.endDay
      });
    }
  }

  function install() {
    const contentAdded = installContent();
    if (typeof document !== "undefined") {
      installToolbar();
      decorateCreation();
      installWrappers();
      if (typeof state !== "undefined") ensureState(state);
    }
    return {contentAdded};
  }

  const api = {
    VERSION, BUILD_VERSION, SAVE_VERSION, SAVE_SCHEMA, RELEASE_FLAG,
    coachSteps, classFocus, contentIds:["doorstepRumor","playgroundPhoto","busStopPromise","localInfluencer","posterWar","seniorTea","underpassFlood","silentMajority"],
    companionTone, classifyQuest, prioritySnapshot, electionAnalysis, counterForIntent,
    ensureState, deltaRows, installContent, install, showCoach, showBriefing,
    get report() {
      const target = typeof state !== "undefined" ? state : null;
      return {
        version:VERSION,
        buildVersion:BUILD_VERSION,
        saveVersion:SAVE_VERSION,
        saveSchema:SAVE_SCHEMA,
        systems:["onboarding","daily-loop","map-guidance","quest-journal","companion-feedback","faction-intel","debate-counters","election-analysis","new-content","tester-build"],
        contentEvents:api.contentIds.length,
        stateReady:Boolean(target?.flags?.[RELEASE_FLAG])
      };
    }
  };

  globalThis.KorytoCampaignExperience = api;
  globalThis.KorytoTest145 = api;
  install();
})();
