"use strict";
(() => {
  const VERSION = "0.14.7 TEST.10";
  const BUILD_VERSION = "0.14.7-test.10";
  const SAVE_VERSION = "0.14.3-test.2";
  const SAVE_SCHEMA = 1;
  const RELEASE_FLAG = "v0147ConsequencesComplete";
  const ARC_IDS = ["register", "roof", "meadow"];

  const doctrines = {
    stability: {
      name: "Operace Klid na práci",
      icon: "🧱",
      description: "Věčný prodává minulost jako jedinou bezpečnou budoucnost.",
      debate: "Bude tvrdit, že vaše změny jsou drahý chaos.",
      pressure: { support: -2, trust: -1, oldguard: 4 }
    },
    paperwork: {
      name: "Operace Papír vítězí",
      icon: "📚",
      description: "Soupeř se pokouší pohřbít kampaň pod lhůtami, razítky a námitkami.",
      debate: "Vytáhne procesní chybu a bude ji vydávat za morální selhání.",
      pressure: { influence: -2, heat: 2, officials: -2 }
    },
    defection: {
      name: "Operace Volné křeslo",
      icon: "🪑",
      description: "Věčný nabízí vašim lidem funkce, ochranu a lepší židle.",
      debate: "Pokusí se zpochybnit soudržnost vašeho štábu.",
      pressure: { trust: -2, heat: 2 }
    },
    dossier: {
      name: "Operace Vaše složka",
      icon: "🗂️",
      description: "Každá obálka, dar a selektivní pravda se mění v budoucí titulek.",
      debate: "Přinese konkrétní účet, screenshot nebo člověka s výbornou pamětí.",
      pressure: { heat: 4, trust: -2, press: -3 }
    },
    patronage: {
      name: "Operace Všichni něco chtějí",
      icon: "🤝",
      description: "Soupeř spojuje spolky, podnikatele a staré závazky do jedné protikoalice.",
      debate: "Bude tvrdit, že bez jeho sítě obec přestane fungovat.",
      pressure: { influence: -2, business: 3, jzd: 2 }
    }
  };

  const tagFamilies = {
    ethical: ["ethical", "transparent", "children"],
    legal: ["legal", "gray"],
    public: ["public", "press"],
    power: ["power", "jzdDeal", "oldguard"],
    corrupt: ["corrupt", "contract", "destroyEvidence"],
    deceptive: ["lie", "pressAttack"]
  };

  const questEventMap = {
    register: ["register"],
    roof: ["roof", "roofEmergency", "roofCollapse"],
    meadow: ["meadow", "developerBacklash", "meadowProtest"]
  };

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const object = (value, fallback = {}) => value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  const array = value => Array.isArray(value) ? value : [];
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]);
  const localHash = text => {
    let hash = 2166136261 >>> 0;
    for (const char of String(text || "")) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  function familyFor(tags = []) {
    let best = "neutral";
    let score = 0;
    for (const [family, members] of Object.entries(tagFamilies)) {
      const hits = members.filter(tag => tags.includes(tag)).length;
      if (hits > score) {
        best = family;
        score = hits;
      }
    }
    return best;
  }

  function doctrineFor(target) {
    const memory = target?.campaignMemory;
    if (memory?.doctrine?.id && doctrines[memory.doctrine.id]) return memory.doctrine.id;
    const seed = `${target?.seed || "VEP"}|${target?.hero?.classId || "bard"}|${target?.hero?.origin || "idealist"}`;
    const ids = Object.keys(doctrines);
    return ids[localHash(seed) % ids.length];
  }

  function emptyMemory(target) {
    const doctrineId = doctrineFor(target || {});
    return {
      version: VERSION,
      decisions: [],
      tagCounts: {},
      favors: {},
      enemies: {},
      witnesses: {},
      arcs: Object.fromEntries(ARC_IDS.map(id => [id, { path: null, level: null, day: 0, returned: false }])),
      returns: [],
      ultimatums: [],
      betrayals: [],
      doctrine: { id: doctrineId, revealed: false, pressureDays: [], countered: 0 },
      powerMap: {},
      ending: null,
      replayFingerprint: ""
    };
  }

  function ensureState(target = typeof state !== "undefined" ? state : globalThis.KorytoApp?.getState?.()) {
    if (!target || typeof target !== "object") return target;
    target.campaignMemory = object(target.campaignMemory, emptyMemory(target));
    const memory = target.campaignMemory;
    memory.version = VERSION;
    memory.decisions = array(memory.decisions).slice(-120);
    memory.tagCounts = object(memory.tagCounts, {});
    memory.favors = object(memory.favors, {});
    memory.enemies = object(memory.enemies, {});
    memory.witnesses = object(memory.witnesses, {});
    memory.arcs = object(memory.arcs, {});
    for (const id of ARC_IDS) memory.arcs[id] = object(memory.arcs[id], { path: null, level: null, day: 0, returned: false });
    memory.returns = array(memory.returns);
    memory.ultimatums = array(memory.ultimatums);
    memory.betrayals = array(memory.betrayals);
    memory.doctrine = object(memory.doctrine, { id: doctrineFor(target), revealed: false, pressureDays: [], countered: 0 });
    if (!doctrines[memory.doctrine.id]) memory.doctrine.id = doctrineFor(target);
    memory.doctrine.pressureDays = array(memory.doctrine.pressureDays);
    memory.powerMap = object(memory.powerMap, {});
    target.flags = object(target.flags, {});
    target.flags[RELEASE_FLAG] = VERSION;
    updatePowerMap(target);
    memory.replayFingerprint = fingerprint(target);
    return target;
  }

  function addCount(map, key, amount = 1) {
    if (!key) return;
    map[key] = finite(map[key]) + amount;
  }

  function arcForEvent(eventId) {
    return ARC_IDS.find(id => questEventMap[id].includes(eventId)) || null;
  }

  function relationTarget(eventId, location, tags) {
    if (location === "school" || eventId.includes("roof")) return "Marie Čistá a rodiče";
    if (location === "jzd" || tags.includes("jzdDeal")) return "Oldřich Brázda a JZD";
    if (location === "paper" || tags.includes("pressAttack")) return "Daniela Špičková a redakce";
    if (location === "meadow" || tags.includes("contract")) return "Richard Holub a podnikatelé";
    if (location === "townhall" || tags.includes("legal")) return "Bohumil Tichý a úřad";
    return "veřejnost Dolních Vejprnic";
  }

  function rememberDecision(target, eventId, choice, level, location = target?.currentLocation) {
    if (!target || !eventId || !choice) return null;
    ensureState(target);
    const tags = array(choice.tags);
    const family = familyFor(tags);
    const record = {
      day: finite(target.day, 1),
      event: eventId,
      location: location || "hq",
      choice: String(choice.label || "Neznámá volba"),
      family,
      tags: [...tags],
      level: level || "unknown"
    };
    const memory = target.campaignMemory;
    memory.decisions.push(record);
    memory.decisions = memory.decisions.slice(-120);
    addCount(memory.tagCounts, family);
    for (const tag of tags) addCount(memory.tagCounts, `tag:${tag}`);
    const relation = relationTarget(eventId, location, tags);
    if (["ethical", "legal", "public"].includes(family)) addCount(memory.favors, relation);
    if (["corrupt", "deceptive"].includes(family)) {
      addCount(memory.enemies, relation);
      addCount(memory.witnesses, relation);
    }
    if (family === "power") {
      addCount(memory.favors, relation);
      addCount(memory.enemies, "poražení v mocenském obchodu");
    }
    const arcId = arcForEvent(eventId);
    if (arcId) memory.arcs[arcId] = { path: family, level: level || "unknown", day: finite(target.day, 1), returned: Boolean(memory.arcs[arcId]?.returned) };
    memory.replayFingerprint = fingerprint(target);
    return record;
  }

  function fingerprint(target) {
    const memory = target?.campaignMemory || {};
    const decisions = array(memory.decisions).map(item => `${item.event}:${item.family}:${item.level}`).join("|");
    const arcs = ARC_IDS.map(id => `${id}:${memory.arcs?.[id]?.path || "none"}`).join("|");
    return `${memory.doctrine?.id || doctrineFor(target)}|${arcs}|${decisions}`;
  }

  function dominantFamily(target) {
    const counts = target?.campaignMemory?.tagCounts || {};
    return ["ethical", "legal", "public", "power", "corrupt", "deceptive"].sort((a, b) => finite(counts[b]) - finite(counts[a]))[0] || "neutral";
  }

  function updatePowerMap(target = typeof state !== "undefined" ? state : null) {
    if (!target) return {};
    const plan = target.factionPlans || {};
    const voters = target.voters || {};
    const score = (player, rival, faction) => player >= rival + 8 ? "hráč" : rival >= player + 8 ? faction : "sporné";
    const map = {
      media: { label: "Média", icon: "📰", player: 100 - finite(plan.press?.progress), rival: finite(plan.press?.progress) + finite(target.stats?.heat) * 0.2, faction: "Věčný / redakce" },
      office: { label: "Úřad", icon: "📎", player: finite(voters.officials?.support, 40) + finite(target.stats?.influence) * 0.25, rival: finite(plan.oldguard?.progress) + finite(target.factions?.oldguard) * 0.25, faction: "staré struktury" },
      business: { label: "Podnikatelé", icon: "💼", player: finite(voters.entrepreneurs?.support, 40), rival: finite(plan.business?.progress) + Math.max(0, finite(target.factions?.business)), faction: "Holubova síť" },
      countryside: { label: "JZD a venkov", icon: "🚜", player: finite(voters.jzdWorkers?.support, 40), rival: finite(plan.jzd?.progress) + Math.max(0, finite(target.factions?.jzd)), faction: "Brázdova síť" },
      parents: { label: "Rodiče", icon: "🎒", player: finite(voters.parents?.support, 40) + Math.max(0, finite(target.factions?.citizens)) * 0.3, rival: finite(target.opponent?.momentum) * 0.7, faction: "Věčný" },
      associations: { label: "Spolky a hospoda", icon: "🍺", player: finite(voters.club?.support, 40) + finite(target.stats?.support) * 0.25, rival: finite(target.opponent?.momentum), faction: "Věčný" }
    };
    for (const item of Object.values(map)) item.owner = score(item.player, item.rival, item.faction);
    if (target.campaignMemory) target.campaignMemory.powerMap = map;
    return map;
  }

  function queueEvent(id, ttl = null, target = typeof state !== "undefined" ? state : globalThis.KorytoApp?.getState?.()) {
    if (!target) return;
    if (typeof state !== "undefined" && target === state && typeof schedule === "function") return schedule(id, ttl);
    target.pendingEvents = array(target.pendingEvents);
    target.pendingMeta = object(target.pendingMeta, {});
    if (!target.pendingEvents.includes(id) && !target.flags?.[`resolved_${id}`]) {
      target.pendingEvents.push(id);
      if (ttl !== null) target.pendingMeta[id] = { scheduledDay: finite(target.day, 1), expiresDay: finite(target.day, 1) + ttl };
    }
  }

  function effectSafe(changes) {
    if (typeof effect === "function") return effect(changes);
    const target = globalThis.KorytoApp?.getState?.();
    if (!target) return;
    target.stats = object(target.stats, {});
    for (const [key, value] of Object.entries(changes || {})) target.stats[key] = finite(target.stats[key]) + finite(value);
  }

  function currentArc(id) {
    return state?.campaignMemory?.arcs?.[id] || { path: "neutral", level: "unknown" };
  }

  function addDebt(amount) {
    if (typeof state === "undefined" || !state) return;
    state.debt = Math.max(0, finite(state.debt) + finite(amount));
  }

  function markReturn(id, resolution) {
    ensureState(state);
    const arc = state.campaignMemory.arcs[id];
    if (arc) arc.returned = true;
    state.campaignMemory.returns.push({ arc: id, day: state.day, resolution });
  }

  function installConsequenceEvents() {
    const catalog = typeof events !== "undefined" ? events : globalThis.KorytoApp?.events;
    if (!catalog || catalog.v0147RegisterReturn) return false;
    catalog.v0147RegisterReturn = {
      id: "v0147RegisterReturn", location: "townhall", queued: true, emoji: "📋", kicker: "NÁVRAT ROZHODNUTÍ", title: "Podpisy se vracejí jako seznam svědků",
      text: () => {
        const arc = currentArc("register");
        const variants = {
          ethical: "Lidé, kteří vám dali pravý podpis, chtějí vědět, zda jejich důvěra nebyla jen vstupenka do kampaně.",
          legal: "Procesní zkratka obstála. Okresní úřad nyní žádá vysvětlení, proč by ji nemohli používat všichni.",
          power: "Seznam z JZD je dokonale čitelný. Právě proto je nápadné, že všichni podepsali stejným perem.",
          corrupt: "Jeden podpis patří člověku, který tvrdí, že vás nikdy neviděl. Věčný už má jeho telefonní číslo."
        };
        return [variants[arc.path] || "Bohumil našel původní podpisové archy a tři různé verze toho, jak vznikly.", `Původní cesta: ${arc.path || "nejasná"}. Výsledek hodu: ${arc.level || "neznámý"}.`];
      },
      choices: [
        { label: "Zveřejnit celý podpisový příběh", detail: "Transparentnost může potvrdit vaši důvěryhodnost, nebo přesně popsat starý problém.", check: { attr: "resilience", dc: 13 }, tags: ["transparent", "public", "legal"], success: makeOutcome("Dokumenty odpovídají příběhu dostatečně na to, aby veřejnost přijala i nepříjemné části.", { trust: 7, heat: -4, integrity: 4 }, ["transparent"], () => markReturn("register", "zveřejněno")), fail: makeOutcome("Veřejnost zjistí, že vaše stručná verze měla šest stran příloh.", { trust: -4, heat: 7 }, ["transparent"], () => markReturn("register", "neúplně vysvětleno")) },
        { label: "Nechat Bohumila dokumenty procesně uzavřít", detail: "Rychlé řešení, které vytváří dalšího člověka s kopií.", check: { attr: "intellect", dc: 12 }, tags: ["legal", "gray"], success: makeOutcome("Úřad potvrdí, že kandidátka je platná a další otázky nejsou právně produktivní.", { influence: 5, heat: -3, integrity: -2 }, ["legal"], () => markReturn("register", "procesně uzavřeno")), fail: makeOutcome("Bohumil uzavře jen jednu ze dvou evidencí. Druhou otevře Daniela.", { heat: 8, press: -4 }, ["gray"], () => markReturn("register", "kopie unikla")) }
      ]
    };

    catalog.v0147RoofReturn = {
      id: "v0147RoofReturn", location: "school", queued: true, emoji: "🌧️", kicker: "NÁVRAT ROZHODNUTÍ", title: "První déšť prověřuje nejen střechu",
      text: () => {
        const arc = currentArc("roof");
        const variants = {
          ethical: "Oprava drží. Rodiče však našli dodatek, který se v otevřené soutěži objevil až po vašem vítězném projevu.",
          corrupt: "Střecha drží jen na místech, kde bude televizní kamera. Holub tvrdí, že jde o chytrou prioritizaci.",
          public: "Provizorní oprava přežila déšť díky rodičům. Teď chtějí vědět, zda se z provizoria nestal váš trvalý program.",
          legal: "Papíry jsou v pořádku. Voda si ale právní názor nepřečetla."
        };
        return [variants[arc.path] || "Ve škole se objevila nová skvrna a stará faktura.", `Původní cesta: ${arc.path || "nejasná"}.`];
      },
      choices: [
        { label: "Přiznat problém a otevřít reklamaci", detail: "Pomalé, veřejné a použitelné jako důkaz, že pravidla platí i pro spojence.", check: { attr: "authority", dc: 13 }, tags: ["ethical", "transparent", "children"], success: makeOutcome("Dodavatel nastoupí na reklamaci a Marie veřejně potvrdí, že jste problém nezametl pod okap.", { trust: 8, parents: 5, integrity: 5, heat: -3 }, ["ethical", "children"], () => markReturn("roof", "reklamace")), fail: makeOutcome("Reklamace začne sporem o to, zda déšť přišel ve smluvním termínu.", { heat: 7, support: -3 }, ["legal"], () => markReturn("roof", "reklamace ve sporu")) },
        { label: "Nechat Holuba opravu tiše dokončit", detail: "Rychlá suchá třída výměnou za další budoucí telefonát bez pozdravu.", check: { attr: "cunning", dc: 12 }, tags: ["contract", "corrupt", "power"], success: makeOutcome("Třída je suchá. Holub si do telefonu zapisuje, že radnice nyní dluží dvě laskavosti.", { support: 4, funds: 3, integrity: -8, debt: 2 }, ["contract", "corrupt"], () => { addDebt(2); markReturn("roof", "tichá protislužba"); }), fail: makeOutcome("Opravu natočí rodič. Video končí větou o zakázkách po volbách.", { heat: 13, trust: -8, integrity: -5 }, ["corrupt"], () => markReturn("roof", "video uniklo")) }
      ]
    };

    catalog.v0147MeadowReturn = {
      id: "v0147MeadowReturn", location: "meadow", queued: true, emoji: "🚧", kicker: "NÁVRAT ROZHODNUTÍ", title: "Louka má paměť delší než územní plán",
      text: () => {
        const arc = currentArc("meadow");
        const variants = {
          ethical: "Občané ubránili louku. Teď se hádají, kdo bude sekat trávu a kdo smí pořádat festival.",
          corrupt: "Holub přivezl bagr dřív než závaznou část smlouvy. Tvrdí, že bagr je nezávazná vizualizace.",
          legal: "Kompromisní mapa má dvě legendy. Developer používá tu, kde je parkoviště větší.",
          public: "Veřejné projednání vytvořilo silnou koalici. Její členové se teď navzájem blokují."
        };
        return [variants[arc.path] || "Na louce se objevily kolíky, petice a tři různé mapy budoucnosti.", `Původní cesta: ${arc.path || "nejasná"}.`];
      },
      choices: [
        { label: "Udělat z původního slibu závazné pravidlo", detail: "Proměnit volební větu v dokument, podle kterého lze odmítnout bagr i vlastní spojence.", check: { attr: "intellect", dc: 14 }, tags: ["legal", "transparent", "antiBusiness"], success: makeOutcome("Pravidlo přežije právníky i veřejnou schůzi. Holub poprvé musí jednat o skutečném kompromisu.", { trust: 8, citizens: 7, business: -8, integrity: 5 }, ["legal", "transparent"], () => markReturn("meadow", "závazné pravidlo")), fail: makeOutcome("Dokument má slabé místo přesně tam, kde Holub vlastní přístupovou cestu.", { heat: 6, business: 6, trust: -3 }, ["legal"], () => markReturn("meadow", "právní mezera")) },
        { label: "Vyměnit poslední ústupek za školku", detail: "Viditelný výsledek a velmi dlouhá poznámka pod čarou.", check: { attr: "cunning", dc: 14 }, tags: ["contract", "power", "corrupt"], success: makeOutcome("Holub podepíše školku i park. Vaše kampaň dostane výsledek a koaliční vyjednávání nového věřitele.", { support: 7, funds: 7, business: 8, integrity: -9, debt: 3 }, ["contract", "power"], () => { addDebt(3); markReturn("meadow", "školka za ústupek"); }), fail: makeOutcome("Vizualizace školky je krásná. Závazná část znovu obsahuje jen park a příjezdovou cestu.", { heat: 11, trust: -8, integrity: -6 }, ["contract"], () => markReturn("meadow", "nezávazná školka")) }
      ]
    };

    catalog.v0147CompanionUltimatum = {
      id: "v0147CompanionUltimatum", location: "hq", queued: true, emoji: "🚪", kicker: "ULTIMÁTUM DRUŽINY", title: "Jeden člen štábu pokládá klíče na stůl",
      text: () => {
        const id = state.flags.v0147UltimatumCompanion;
        const person = state.party?.[id] || globalThis.KorytoCompanionData?.companions?.[id] || { name: id || "Člen štábu", tolerance: "Už nechce pokračovat bez jasných hranic." };
        return [`${person.name} odmítá pokračovat jako dekorace kampaně. ${person.tolerance || "Požaduje jasnou změnu směru."}`, "Ultimátum není další číslo loajality. Je to nabídka, odmítnutí nebo budoucí tisková konference."];
      },
      choices: [
        { label: "Přijmout podmínky a dát veřejný závazek", detail: "Vztah se stabilizuje, ale závazek bude viditelný i po volbách.", check: { attr: "resilience", dc: 12 }, tags: ["ethical", "public", "commitment"], success: makeOutcome("Ultimátum se mění ve veřejnou dohodu. Člen štábu zůstává a bude kontrolovat každé další rozhodnutí.", { trust: 5, integrity: 4 }, ["ethical", "public"], () => resolveUltimatum("accepted")), fail: makeOutcome("Slib zní dobře, ale chybí termín. Ultimátum se pouze odkládá.", { heat: 4, trust: -2 }, ["public"], () => resolveUltimatum("delayed")) },
        { label: "Odmítnout vydírání a nechat dveře otevřené", detail: "Autorita za cenu možnosti, že dveřmi skutečně odejde.", check: { attr: "authority", dc: 13 }, tags: ["power", "public"], success: makeOutcome("Štáb přijme, že kandidát rozhoduje. Dotčený člověk odejde bez tiskové konference, ale ne bez paměti.", { influence: 5, trust: -3 }, ["power"], () => resolveUltimatum("left")), fail: makeOutcome("Odchod se odehraje před kamerou a Věčný má připravené volné křeslo.", { heat: 12, support: -6, trust: -7 }, ["power"], () => resolveUltimatum("defected")) },
        { label: "Koupit klid funkcí nebo protislužbou", detail: "Zůstane, ale politický vztah se mění v účetní vztah.", check: { attr: "cunning", dc: 12 }, tags: ["corrupt", "contract", "power"], success: makeOutcome("Člen štábu zůstává. Loajalita je nyní přesně vyčíslitelná a proto méně skutečná.", { influence: 4, funds: -5, integrity: -9, debt: 2 }, ["corrupt", "contract"], () => { addDebt(2); resolveUltimatum("bought"); }), fail: makeOutcome("Nabídka urazí i člověka, který ji původně chtěl. Kopie zprávy míří k Daniele.", { heat: 14, trust: -8, integrity: -6 }, ["corrupt"], () => resolveUltimatum("exposed")) }
      ]
    };
    return true;
  }

  function resolveUltimatum(result) {
    ensureState(state);
    const id = state.flags.v0147UltimatumCompanion;
    const person = state.party?.[id];
    const memory = state.campaignMemory;
    memory.ultimatums.push({ companion: id, day: state.day, result });
    if (person && ["accepted", "bought", "delayed"].includes(result)) person.loyalty = Math.max(finite(person.loyalty), result === "accepted" ? 58 : result === "bought" ? 44 : 35);
    if (person && ["left", "defected", "exposed"].includes(result)) {
      memory.betrayals.push({ companion: id, day: state.day, result });
      addCount(memory.enemies, person.name || id);
      delete state.party[id];
      if (result === "defected") {
        state.opponent.momentum = Math.min(100, finite(state.opponent?.momentum) + 12);
        memory.doctrine.revealed = true;
      }
    }
    state.flags.v0147UltimatumResolved = true;
  }

  function queueReturns(target = state) {
    ensureState(target);
    const due = { register: 5, roof: 8, meadow: 10 };
    const eventIds = { register: "v0147RegisterReturn", roof: "v0147RoofReturn", meadow: "v0147MeadowReturn" };
    for (const id of ARC_IDS) {
      const arc = target.campaignMemory.arcs[id];
      if (!arc?.path || arc.returned || finite(target.day) < due[id]) continue;
      const eventId = eventIds[id];
      if (!target.pendingEvents.includes(eventId) && !target.flags[`resolved_${eventId}`]) queueEvent(eventId, 3, target);
    }
  }

  function weakestCompanion(target) {
    return Object.entries(target.party || {}).map(([id, person]) => ({ id, loyalty: finite(person?.loyalty, 50), tension: finite(target.companionAmbitions?.[id]?.tension) })).sort((a, b) => (a.loyalty - a.tension * 0.35) - (b.loyalty - b.tension * 0.35))[0] || null;
  }

  function queueUltimatum(target = state) {
    ensureState(target);
    if (target.flags.v0147UltimatumQueued || target.flags.v0147UltimatumResolved || finite(target.day) < 7) return false;
    const weak = weakestCompanion(target);
    if (!weak || (weak.loyalty > 34 && weak.tension < 62)) return false;
    target.flags.v0147UltimatumQueued = true;
    target.flags.v0147UltimatumCompanion = weak.id;
    queueEvent("v0147CompanionUltimatum", 2, target);
    return true;
  }

  function applyDoctrinePressure(target = state) {
    ensureState(target);
    const memory = target.campaignMemory;
    const doctrine = doctrines[memory.doctrine.id];
    if (!doctrine || ![3, 6, 9, 12].includes(finite(target.day)) || memory.doctrine.pressureDays.includes(target.day)) return false;
    memory.doctrine.pressureDays.push(target.day);
    memory.doctrine.revealed = true;
    const changes = clone(doctrine.pressure);
    if (memory.doctrine.countered > 0) for (const key of Object.keys(changes)) changes[key] = Math.round(changes[key] * 0.6);
    effectSafe(changes);
    if (typeof addNews === "function") addNews(`${doctrine.icon} ${doctrine.name}: ${doctrine.description}`, "bad");
    if (memory.doctrine.id === "defection") queueUltimatum(target);
    return true;
  }

  function debateMemorySummary(target = state) {
    ensureState(target);
    const family = dominantFamily(target);
    const doctrine = doctrines[target.campaignMemory.doctrine.id];
    const arcBits = ARC_IDS.map(id => target.campaignMemory.arcs[id]?.path ? `${id}: ${target.campaignMemory.arcs[id].path}` : null).filter(Boolean);
    return {
      family,
      doctrine: doctrine?.name || "Neznámá operace",
      text: `${doctrine?.debate || "Věčný vytáhne historii kampaně."} Vaše dosavadní převaha: ${family}. ${arcBits.length ? `Kauzy: ${arcBits.join(", ")}.` : "Hlavní kauzy zatím neposkytují jasný argument."}`
    };
  }

  function applyDebateMemory(target = state) {
    if (!target?.debate?.active) return;
    const summary = debateMemorySummary(target);
    const counts = target.campaignMemory.tagCounts || {};
    if (summary.family === "ethical" || summary.family === "legal") {
      target.debate.firstHitShield = true;
      target.debate.nextBonus = finite(target.debate.nextBonus) + 1;
    }
    if (summary.family === "corrupt" || summary.family === "deceptive") {
      target.debate.opponentRep = Math.min(100, finite(target.debate.opponentRep, 55) + 5);
      target.debate.playerRep = Math.max(0, finite(target.debate.playerRep, 55) - 3);
    }
    if (finite(counts.power) >= 4) target.debate.momentum = finite(target.debate.momentum) + 1;
    target.debate.v0147MemorySummary = summary.text;
    target.debate.log = array(target.debate.log);
    target.debate.log.unshift(`🧠 Paměť kampaně: ${summary.text}`);
  }

  function classifyEnding(target = state) {
    ensureState(target);
    const stats = target.stats || {};
    const contracts = array(target.flags?.coalitionContracts);
    const dirty = contracts.filter(item => item.kind !== "program").length;
    const clean = contracts.length - dirty;
    const formed = Boolean(target.flags?.coalitionFormed) || finite(target.flags?.seats) >= finite(target.flags?.majority, 8);
    const exposed = Boolean(target.conspiracy?.exposed);
    let id = "ordinary-opposition";
    if (formed && finite(stats.integrity) < 30) id = "system-takeover";
    else if (formed && (finite(target.debt) >= 8 || dirty > clean)) id = "debtor-government";
    else if (formed && finite(target.flags?.seats) >= finite(target.flags?.majority, 8) && finite(stats.integrity) >= 60) id = "clean-majority";
    else if (formed && finite(stats.integrity) >= 65 && finite(target.debt) <= 3 && finite(target.promiseSummary?.broken) <= 1) id = "clean-coalition";
    else if (formed) id = "fragile-coalition";
    else if (exposed && finite(stats.integrity) >= 55) id = "whistleblower-defeat";
    else if (finite(stats.integrity) >= 70 && finite(stats.trust) >= 55) id = "honorable-opposition";
    else if (finite(stats.heat) >= 75 || finite(stats.trust) < 25) id = "public-collapse";
    const definitions = {
      "clean-majority": { emoji: "🏛️", title: "Mandát bez přívěsku", story: "Vyhrál jste dost silně, abyste nemusel první ráno splácet cizí funkce. Obec si však pamatuje, že samostatná většina není totéž co samostatná pravda." },
      "clean-coalition": { emoji: "🤝", title: "Nepohodlná čistá koalice", story: "Většina vznikla na programu, zveřejněných podmínkách a lidech, kteří se budou veřejně hádat. To je v Dolních Vejprnicích téměř institucionální inovace." },
      "debtor-government": { emoji: "🪑", title: "Starosta na splátky", story: "Radnici jste získal, ale každá klika už má věřitele. Vítězství začíná seznamem lidí, kterým musíte zvednout telefon." },
      "system-takeover": { emoji: "🐷", title: "Nový Věčný", story: "Věčného jste porazil tím, že jste se naučil jeho systém rychleji než on. Jména na dveřích se změnila. Telefonní seznam nikoli." },
      "fragile-coalition": { emoji: "🧩", title: "Většina z velmi různých důvodů", story: "Koalice drží, protože každý partner očekává něco jiného. První skutečné hlasování rozhodne, zda jde o vládu, nebo pouze společnou fotografii." },
      "whistleblower-defeat": { emoji: "📂", title: "Prohrál jste volby, otevřel jste archiv", story: "Radnici nepřebíráte. Obec však zná síť, která měla zůstat skrytá. Věčný vyhrál funkci a ztratil pohodlí beztrestnosti." },
      "honorable-opposition": { emoji: "🛡️", title: "Opozice, kterou nelze koupit prvním výborem", story: "Nevyhrál jste většinu, ale vznikla síla, která dokáže číst smlouvy, pamatovat si sliby a přežít jedno volební období." },
      "public-collapse": { emoji: "🔥", title: "Kampaň skončila dřív než tisková konference", story: "Příliš mnoho účtů, úniků a protichůdných pravd se spojilo v jediný příběh. Tentokrát ho nepsal váš štáb." },
      "ordinary-opposition": { emoji: "🚪", title: "Těsně mimo kancelář", story: "Kampaň změnila poměry, ale ne rozdělila klíče. Některé vztahy a závazky přežijí déle než výsledek voleb." }
    };
    const result = { id, ...definitions[id] };
    target.campaignMemory.ending = result;
    target.flags.v0147Ending = id;
    return result;
  }

  function memorySummaryHtml(target = state) {
    ensureState(target);
    const memory = target.campaignMemory;
    const doctrine = doctrines[memory.doctrine.id];
    const decisions = memory.decisions.slice(-6).reverse();
    const arcs = ARC_IDS.map(id => `<div class="v0147-memory-row"><span>${id}</span><strong>${esc(memory.arcs[id]?.path || "nevyřešeno")}${memory.arcs[id]?.returned ? " · následek se vrátil" : ""}</strong></div>`).join("");
    const rows = decisions.map(item => `<li><b>Den ${item.day}:</b> ${esc(item.choice)} <span>${esc(item.family)}</span></li>`).join("");
    return `<section class="v0147-ending-memory"><h3>Co si obec pamatuje</h3><p>${doctrine?.icon || "🧠"} Soupeřova strategie: <strong>${esc(doctrine?.name || memory.doctrine.id)}</strong></p>${arcs}<h4>Poslední rozhodnutí</h4><ul>${rows || "<li>Kampaň po sobě zanechala hlavně administrativní stopu.</li>"}</ul><p><strong>Ultimáta:</strong> ${memory.ultimatums.length} · <strong>Odchody nebo zrady:</strong> ${memory.betrayals.length} · <strong>Návraty důsledků:</strong> ${memory.returns.length}</p></section>`;
  }

  function renderPowerMap(target = state) {
    if (typeof document === "undefined") return;
    ensureState(target);
    let root = document.getElementById("v0147PowerMap");
    if (!root) {
      const sidebars = document.querySelectorAll?.("#gameScreen .side") || [];
      const host = sidebars[1] || sidebars[0];
      if (!host) return;
      root = document.createElement("div");
      root.id = "v0147PowerMap";
      root.className = "card v0147-power-card";
      host.insertBefore?.(root, host.firstChild || null);
    }
    const doctrine = doctrines[target.campaignMemory.doctrine.id];
    const cells = Object.values(target.campaignMemory.powerMap).map(item => `<div class="v0147-power-cell ${item.owner === "hráč" ? "player" : item.owner === "sporné" ? "contested" : "rival"}"><span>${item.icon} ${esc(item.label)}</span><strong>${esc(item.owner)}</strong></div>`).join("");
    root.innerHTML = `<h3>Mocenská mapa</h3><p class="v0147-doctrine">${doctrine?.icon || "🕴️"} ${target.campaignMemory.doctrine.revealed ? esc(doctrine?.name || "Strategie soupeře") : "Strategie soupeře zatím skrytá"}</p><div class="v0147-power-grid">${cells}</div>`;
  }

  function decorateDebate() {
    if (typeof document === "undefined") return;
    const box = document.getElementById("debateIntent");
    const text = state?.debate?.v0147MemorySummary;
    if (!box || !text || box.querySelector?.(".v0147-debate-memory")) return;
    const note = document.createElement("div");
    note.className = "v0147-debate-memory";
    note.textContent = text;
    box.appendChild?.(note);
  }

  function auditDecisions(catalog = globalThis.KorytoApp?.events || {}) {
    const rows = [];
    for (const [eventId, event] of Object.entries(catalog)) {
      const choices = array(event?.choices);
      if (choices.length < 2) continue;
      const signatures = choices.map(choice => {
        const tags = array(choice.tags).slice().sort().join(",");
        const success = JSON.stringify(choice.success?.effects || {});
        const fail = JSON.stringify(choice.fail?.effects || {});
        return `${tags}|${success}|${fail}`;
      });
      const families = new Set(choices.map(choice => familyFor(array(choice.tags))));
      rows.push({ event: eventId, choices: choices.length, uniqueOutcomes: new Set(signatures).size, families: [...families], potentiallyFalse: new Set(signatures).size === 1 || families.size === 1 && choices.length > 2 });
    }
    return {
      events: rows.length,
      realBranches: rows.filter(row => row.uniqueOutcomes > 1 && row.families.length > 1).length,
      potentiallyFalse: rows.filter(row => row.potentiallyFalse).map(row => row.event),
      rows
    };
  }

  function syntheticMemoryFromRun(run, seed) {
    const target = { seed: `REPLAY-${seed}`, hero: { classId: run.classId, origin: run.origin }, campaignMemory: null };
    target.campaignMemory = emptyMemory(target);
    for (const decision of run.telemetry?.decisions || []) {
      const fakeChoice = { label: decision.label, tags: decision.tags || [] };
      target.day = decision.day;
      target.currentLocation = decision.location;
      rememberDecision(target, decision.event, fakeChoice, decision.level, decision.location);
    }
    target.stats = { integrity: run.integrity, trust: run.trust, heat: run.heat };
    target.debt = run.debt;
    target.flags = { coalitionFormed: run.coalition, seats: run.seats, majority: 8, coalitionContracts: [] };
    target.promiseSummary = { broken: 0 };
    target.conspiracy = { exposed: false };
    const ending = classifySyntheticEnding(run);
    return { doctrine: target.campaignMemory.doctrine.id, arcs: Object.fromEntries(ARC_IDS.map(id => [id, target.campaignMemory.arcs[id]?.path || "none"])), fingerprint: fingerprint(target), ending, dominantFamily: dominantFamily(target) };
  }

  function classifySyntheticEnding(run) {
    if (run.coalition && run.integrity < 30) return "system-takeover";
    if (run.coalition && run.debt >= 8) return "debtor-government";
    if (run.seats >= 8 && run.integrity >= 60) return "clean-majority";
    if (run.coalition && run.integrity >= 65 && run.debt <= 3) return "clean-coalition";
    if (run.coalition) return "fragile-coalition";
    if (run.integrity >= 70 && run.trust >= 55) return "honorable-opposition";
    if (run.heat >= 75 || run.trust < 25) return "public-collapse";
    return "ordinary-opposition";
  }

  function runReplayAudit(options = {}) {
    const lab = globalThis.KorytoPlaytestLab;
    if (!lab?.simulateProfile) return { releaseReady: false, issues: [{ severity: "P1", type: "missing-lab", message: "Chybí v0.14.6 playtest laboratoř." }] };
    const pairs = Math.max(24, Math.floor(finite(options.pairs, 600)));
    const seed = Math.floor(finite(options.seed, 147000));
    const profileIds = Object.keys(lab.profiles || {});
    const classIds = lab.classIds || ["bard", "rogue", "paladin", "mage", "technocrat", "necro"];
    const rows = [];
    for (let index = 0; index < pairs; index++) {
      const profile = profileIds[index % profileIds.length];
      const classId = classIds[Math.floor(index / profileIds.length) % classIds.length];
      const first = lab.simulateProfile(profile, seed + index * 2, { classId });
      const second = lab.simulateProfile(profile, seed + index * 2 + 1, { classId });
      const a = syntheticMemoryFromRun(first, seed + index * 2);
      const b = syntheticMemoryFromRun(second, seed + index * 2 + 1);
      const arcDiff = ARC_IDS.filter(id => a.arcs[id] !== b.arcs[id]).length;
      rows.push({ profile, classId, routeDifferent: first.route !== second.route, doctrineDifferent: a.doctrine !== b.doctrine, arcDiff, endingDifferent: a.ending !== b.ending, fingerprintDifferent: a.fingerprint !== b.fingerprint, first: a, second: b });
    }
    const pct = (n, total) => total ? Math.round(n * 1000 / total) / 10 : 0;
    const endingSet = new Set(rows.flatMap(row => [row.first.ending, row.second.ending]));
    const doctrineSet = new Set(rows.flatMap(row => [row.first.doctrine, row.second.doctrine]));
    const replayDivergence = pct(rows.filter(row => row.fingerprintDifferent && (row.routeDifferent || row.arcDiff > 0 || row.endingDifferent)).length, rows.length);
    const routeDivergence = pct(rows.filter(row => row.routeDifferent).length, rows.length);
    const arcDivergence = pct(rows.filter(row => row.arcDiff > 0).length, rows.length);
    const endingDivergence = pct(rows.filter(row => row.endingDifferent).length, rows.length);
    const issues = [];
    if (replayDivergence < 75) issues.push({ severity: "P2", type: "low-replay-divergence", value: replayDivergence, message: "Dva průchody stejného archetypu se příliš často podobají." });
    if (endingSet.size < 5) issues.push({ severity: "P2", type: "ending-variety", value: endingSet.size, message: "Simulace dosáhla méně než pěti rozdílných konců." });
    if (doctrineSet.size < Object.keys(doctrines).length) issues.push({ severity: "P2", type: "doctrine-variety", value: doctrineSet.size, message: "Ne všechny strategie Věčného se objevily v replay auditu." });
    return {
      version: VERSION,
      buildVersion: BUILD_VERSION,
      pairs,
      campaigns: pairs * 2,
      replayDivergence,
      routeDivergence,
      arcDivergence,
      endingDivergence,
      endings: [...endingSet].sort(),
      doctrines: [...doctrineSet].sort(),
      decisionAudit: auditDecisions(),
      issues,
      releaseReady: !issues.some(issue => ["P1", "P2"].includes(issue.severity)),
      rows
    };
  }

  function replayMarkdown(report) {
    const lines = [
      `# Koryto ${VERSION} - audit následků a znovuhratelnosti`,
      "",
      `- Páry průchodů: ${report.pairs}`,
      `- Kampaně: ${report.campaigns}`,
      `- Celková odlišnost druhého průchodu: ${report.replayDivergence} %`,
      `- Odlišné trasy: ${report.routeDivergence} %`,
      `- Odlišné hlavní questové cesty: ${report.arcDivergence} %`,
      `- Odlišné konce: ${report.endingDivergence} %`,
      `- Dosažené konce: ${report.endings.join(", ")}`,
      `- Strategie Věčného: ${report.doctrines.join(", ")}`,
      `- Rozhodovací eventy: ${report.decisionAudit.events}`,
      `- Skutečně větvící eventy: ${report.decisionAudit.realBranches}`,
      `- Release ready: ${report.releaseReady ? "ANO" : "NE"}`,
      "",
      "## Nálezy",
      ""
    ];
    if (!report.issues.length) lines.push("Žádný automatický P1/P2 nález.");
    for (const issue of report.issues) lines.push(`- **${issue.severity} ${issue.type}:** ${issue.message}${issue.value !== undefined ? ` (${issue.value})` : ""}`);
    if (report.decisionAudit.potentiallyFalse.length) {
      lines.push("", "## Kandidáti na ruční audit falešných voleb", "");
      for (const id of report.decisionAudit.potentiallyFalse) lines.push(`- ${id}`);
    }
    return lines.join("\n");
  }

  function installWrappers() {
    installConsequenceEvents();
    if (globalThis.__KORYTO_V0147_WRAPPED__) return true;
    globalThis.__KORYTO_V0147_WRAPPED__ = true;

    if (typeof normalizeState === "function") {
      const original = normalizeState;
      normalizeState = function v0147NormalizeState(...args) {
        const result = original.apply(this, args);
        ensureState(state);
        return result;
      };
    }

    if (typeof newGame === "function") {
      const original = newGame;
      newGame = function v0147NewGame(...args) {
        const result = original.apply(this, args);
        ensureState(state);
        state.campaignMemory.doctrine.id = doctrineFor(state);
        return result;
      };
    }

    if (typeof applyResolved === "function") {
      const original = applyResolved;
      applyResolved = function v0147ApplyResolved(...args) {
        const captured = pendingResolution ? { event: state.currentEvent, choice: pendingResolution.choice, level: pendingResolution.level, location: state.currentLocation } : null;
        const result = original.apply(this, args);
        if (captured) rememberDecision(state, captured.event, captured.choice, captured.level, captured.location);
        queueReturns(state);
        queueUltimatum(state);
        updatePowerMap(state);
        return result;
      };
    }

    if (typeof endDay === "function") {
      const original = endDay;
      endDay = function v0147EndDay(...args) {
        const result = original.apply(this, args);
        ensureState(state);
        queueReturns(state);
        queueUltimatum(state);
        applyDoctrinePressure(state);
        updatePowerMap(state);
        return result;
      };
    }

    if (typeof showMap === "function") {
      const original = showMap;
      showMap = function v0147ShowMap(...args) {
        ensureState(state);
        queueReturns(state);
        queueUltimatum(state);
        const result = original.apply(this, args);
        renderPowerMap(state);
        return result;
      };
    }

    if (typeof renderAll === "function") {
      const original = renderAll;
      renderAll = function v0147RenderAll(...args) {
        const result = original.apply(this, args);
        renderPowerMap(state);
        decorateDebate();
        return result;
      };
    }

    if (typeof startDebate === "function") {
      const original = startDebate;
      startDebate = function v0147StartDebate(...args) {
        ensureState(state);
        const result = original.apply(this, args);
        applyDebateMemory(state);
        if (typeof renderDebate === "function") renderDebate();
        decorateDebate();
        return result;
      };
    }

    if (typeof showEnding === "function") {
      const original = showEnding;
      showEnding = function v0147ShowEnding(ending, roll, ...rest) {
        const classified = classifyEnding(state);
        const merged = { ...ending, emoji: classified.emoji, title: classified.title, story: `${classified.story} ${ending?.story || ""}` };
        const result = original.call(this, merged, roll, ...rest);
        const story = typeof document !== "undefined" ? document.getElementById("endingStory") : null;
        if (story && !story.querySelector?.(".v0147-ending-memory")) story.insertAdjacentHTML?.("beforeend", memorySummaryHtml(state));
        return result;
      };
    }

    if (globalThis.KorytoApp) {
      Object.assign(globalThis.KorytoApp, {
        VERSION,
        normalizeState: typeof normalizeState === "function" ? normalizeState : globalThis.KorytoApp.normalizeState,
        newGame: typeof newGame === "function" ? newGame : globalThis.KorytoApp.newGame,
        endDay: typeof endDay === "function" ? endDay : globalThis.KorytoApp.endDay,
        showMap: typeof showMap === "function" ? showMap : globalThis.KorytoApp.showMap,
        startDebate: typeof startDebate === "function" ? startDebate : globalThis.KorytoApp.startDebate,
        runReplayAudit,
        auditDecisions
      });
    }
    return true;
  }

  function install() {
    installWrappers();
    const target = globalThis.KorytoApp?.getState?.();
    if (target) ensureState(target);
    if (typeof document !== "undefined" && /(?:\?|&)replayqa=1(?:&|$)/.test(location.search || "")) {
      setTimeout(() => {
        const report = runReplayAudit({ pairs: 240 });
        document.body.innerHTML = `<main style="max-width:1100px;margin:0 auto;padding:24px"><h1>Koryto – následky a replay audit</h1><pre style="white-space:pre-wrap">${esc(replayMarkdown(report))}</pre></main>`;
      }, 0);
    }
    return true;
  }

  const api = {
    VERSION,
    BUILD_VERSION,
    SAVE_VERSION,
    SAVE_SCHEMA,
    RELEASE_FLAG,
    doctrines,
    ensureState,
    rememberDecision,
    updatePowerMap,
    queueReturns,
    queueUltimatum,
    applyDoctrinePressure,
    debateMemorySummary,
    classifyEnding,
    auditDecisions,
    runReplayAudit,
    replayMarkdown,
    installConsequenceEvents,
    installWrappers,
    install
  };

  globalThis.KorytoConsequences = api;
  globalThis.KorytoTest147 = api;
  install();
})();
