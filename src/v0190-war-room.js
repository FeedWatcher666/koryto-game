(() => {
  'use strict';

  const BUILD = '0.19.0-test.1';
  const SAVE_KEY = 'koryto:v0190:war-room';
  const TOTAL_DELEGATES = 15;
  const MAX_ROUNDS = 6;
  const HAND_SIZE = 5;

  if (new URLSearchParams(window.location.search).get('legacy') === '1') {
    document.documentElement.classList.add('k190-legacy-mode');
    return;
  }

  const STAFF = Object.freeze({
    marie: {
      name: 'Marie Novotná',
      role: 'vedoucí kampaně',
      initials: 'MN',
      front: 'staff',
      ability: 'Čisté akce sníží tlak ještě o 1 a zvednou morálku. Odmítne špinavou operaci.'
    },
    miloslav: {
      name: 'Miloslav Koutný',
      role: 'stranický veterán',
      initials: 'MK',
      front: 'party',
      ability: 'Stranická karta získá navíc jednoho delegáta. Vznikne ale politický dluh.'
    },
    klara: {
      name: 'Klára Tichá',
      role: 'mediální poradkyně',
      initials: 'KT',
      front: 'media',
      ability: 'Mediální karta zablokuje mediální útok a odhalí příští záměr soupeře.'
    }
  });

  const INTENTS = Object.freeze([
    { id: 'smear', front: 'media', title: 'Špinavý sestřih', text: 'Věčný pustí do oběhu sestříhané video.', effect: 'Důvěra −7, tlak médií +2.' },
    { id: 'poach', front: 'party', title: 'Přetahování delegátů', text: 'Starosta obvolává vaše dva nejisté lidi.', effect: 'Soupeř získá až 2 delegáty.' },
    { id: 'staff_raid', front: 'staff', title: 'Útok na štáb', text: 'Někdo zveřejní soukromé zprávy dobrovolníků.', effect: 'Morálka −2, tlak štábu +2.' },
    { id: 'donor_leak', front: 'media', title: 'Únik o sponzorovi', text: 'Na veřejnost se dostane stará faktura.', effect: 'Skandál +6, důvěra −3.' },
    { id: 'whip', front: 'party', title: 'Starostův finální bič', text: 'Věčný nabízí funkce za podpis.', effect: 'Soupeř získá 2 delegáty.' },
    { id: 'final_smear', front: 'media', title: 'Poslední rána', text: 'Hodinu před hlasováním vyjde obvinění bez reakce.', effect: 'Důvěra −8; při vysokém skandálu soupeř získá delegáta.' }
  ]);

  const ROUND_EVENTS = Object.freeze([
    { title: 'Dva delegáti chtějí jistotu', text: 'Nerozhodnutí se bojí, že po hlasování zůstanou bez ochrany.', pressure: { party: 2, media: 0, staff: 0 } },
    { title: 'Starý výrok znovu žije', text: 'Lokální skupiny sdílejí větu vytrženou z kontextu.', pressure: { party: 0, media: 3, staff: 0 } },
    { title: 'Dobrovolníci padají únavou', text: 'Lidé ve štábu mají za sebou třetí noc bez spánku.', pressure: { party: 0, media: 0, staff: 3 } },
    { title: 'Věčný svolal vlastní schůzi', text: 'Soupeř dnes večer ukáže, kdo stojí za ním.', pressure: { party: 2, media: 2, staff: 0 } },
    { title: 'Průzkum rozhýbal obec', text: 'Každý čte jiná čísla a všichni panikaří.', pressure: { party: 1, media: 1, staff: 1 } },
    { title: 'Poslední hodiny', text: 'Telefony zvoní, dveře se zavírají a nikdo už nechce slyšet program.', pressure: { party: 3, media: 1, staff: 1 } }
  ]);

  const CARDS = Object.freeze([
    { id: 'whip_caucus', title: 'Obvolat delegáty', front: 'party', ap: 1, text: 'Sniž stranický tlak o 2 a získej 1 delegáta.', tags: ['čistá'], effect: 'partyWhip' },
    { id: 'backroom_deal', title: 'Zákulisní dohoda', front: 'party', ap: 2, text: 'Získej 2 delegáty, ale ztrať 4 důvěry a přidej dluh.', tags: ['špinavá'], dirty: true, effect: 'backroomDeal' },
    { id: 'promise_post', title: 'Příslib funkce', front: 'party', ap: 1, text: 'Získej 2 delegáty. Dluh +2, důvěra −3.', tags: ['špinavá'], dirty: true, effect: 'promisePost' },
    { id: 'counter_schedule', title: 'Zablokovat schůzi', front: 'party', ap: 1, money: 1, text: 'Sniž tlak strany o 2 a zablokuj stranický útok.', tags: ['obrana'], effect: 'counterSchedule' },
    { id: 'blackmail', title: 'Kompromat', front: 'party', ap: 2, text: 'Přetáhni 2 delegáty od soupeře. Skandál +10.', tags: ['špinavá'], dirty: true, effect: 'blackmail' },

    { id: 'fact_check', title: 'Rychlý fact-check', front: 'media', ap: 1, text: 'Sniž tlak médií o 3 a zablokuj mediální útok.', tags: ['obrana'], effect: 'factCheck' },
    { id: 'town_hall', title: 'Veřejná debata', front: 'media', ap: 1, text: 'Sniž tlak médií o 2 a získej 5 důvěry.', tags: ['čistá'], effect: 'townHall' },
    { id: 'paid_ads', title: 'Placený zásah', front: 'media', ap: 1, money: 2, text: 'Sniž tlak médií o 2 a získej 5 důvěry.', tags: ['placená'], effect: 'paidAds' },
    { id: 'opposition_research', title: 'Opoziční rešerše', front: 'media', ap: 1, text: 'Odhal příští záměr, získej důkaz a lízni kartu.', tags: ['informace'], effect: 'research' },
    { id: 'leak_documents', title: 'Únik dokumentů', front: 'media', ap: 1, text: 'Oslab soupeře. S důkazem je účinek silnější a riziko menší.', tags: ['špinavá'], dirty: true, effect: 'leakDocuments' },

    { id: 'volunteer_push', title: 'Dobrovolnický výjezd', front: 'staff', ap: 1, money: 1, text: 'Sniž tlak štábu o 2, morálka +2; při důvěře 45+ získej delegáta.', tags: ['čistá'], effect: 'volunteerPush' },
    { id: 'emergency_meeting', title: 'Krizová porada', front: 'staff', ap: 1, text: 'Sniž tlak štábu o 3, morálka +3.', tags: ['čistá'], effect: 'emergencyMeeting' },
    { id: 'sacrifice_aide', title: 'Obětní beránek', front: 'staff', ap: 1, text: 'Skandál −8, ale morálka −2 a tlak štábu +1.', tags: ['špinavá'], dirty: true, effect: 'sacrificeAide' },
    { id: 'closed_apology', title: 'Přiznat chybu štábu', front: 'staff', ap: 1, text: 'Morálka +3, důvěra +3, tlak štábu −2.', tags: ['čistá'], effect: 'closedApology' },
    { id: 'fundraiser', title: 'Rychlá sbírka', front: 'staff', ap: 1, text: 'Peníze +3, důvěra −2, tlak médií +1.', tags: ['zdroj'], effect: 'fundraiser' }
  ]);

  const CARD_BY_ID = Object.freeze(Object.fromEntries(CARDS.map((card) => [card.id, card])));

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const copy = (value) => JSON.parse(JSON.stringify(value));

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, random) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function baseState(seed) {
    const random = mulberry32(seed);
    const opening = ['whip_caucus', 'fact_check', 'volunteer_push', 'opposition_research', 'backroom_deal'];
    const rest = shuffle(CARDS.map((card) => card.id).filter((id) => !opening.includes(id)), random);
    const intents = shuffle(INTENTS.slice(0, 5).map((intent) => intent.id), random).concat('final_smear');
    return {
      build: BUILD,
      seed,
      phase: 'start',
      round: 1,
      ap: 3,
      money: 6,
      trust: 48,
      scandal: 0,
      debt: 0,
      morale: 6,
      evidence: 0,
      delegates: { player: 4, rival: 6, undecided: 5 },
      pressure: { party: 1, media: 1, staff: 1 },
      defenses: { party: false, media: false, staff: false },
      staff: { marie: 'ready', miloslav: 'ready', klara: 'ready' },
      selectedStaff: null,
      deck: opening.concat(rest),
      discard: [],
      hand: [],
      intentOrder: intents,
      intel: false,
      lastFront: null,
      frontStreak: 0,
      log: [],
      banner: null,
      endingReason: null
    };
  }

  const seedParam = Number.parseInt(new URLSearchParams(window.location.search).get('seed') || '', 10);
  let state = baseState(Number.isFinite(seedParam) ? seedParam : Date.now());
  let root;
  let live;

  function currentIntent() {
    const id = state.intentOrder[state.round - 1];
    return INTENTS.find((intent) => intent.id === id) || INTENTS[0];
  }

  function nextIntent() {
    const id = state.intentOrder[state.round];
    return INTENTS.find((intent) => intent.id === id) || null;
  }

  function drawOne() {
    if (!state.deck.length) {
      if (!state.discard.length) return;
      const random = mulberry32(state.seed + state.round * 97 + state.log.length * 13);
      state.deck = shuffle(state.discard, random);
      state.discard = [];
    }
    const id = state.deck.shift();
    if (id) state.hand.push(id);
  }

  function fillHand() {
    while (state.hand.length < HAND_SIZE && (state.deck.length || state.discard.length)) drawOne();
  }

  function addLog(text, tone = 'neutral') {
    state.log.unshift({ text, tone, round: state.round });
    state.log = state.log.slice(0, 14);
  }

  function addPressure(front, amount) {
    state.pressure[front] = clamp(state.pressure[front] + amount, 0, 10);
  }

  function reducePressure(front, amount) {
    const combo = state.lastFront === front ? 1 : 0;
    state.pressure[front] = clamp(state.pressure[front] - amount - combo, 0, 10);
    if (state.lastFront === front) state.frontStreak += 1;
    else state.frontStreak = 1;
    state.lastFront = front;
    if (combo) addLog(`Momentum na frontě ${frontLabel(front)}: tlak klesl ještě o 1.`, 'good');
  }

  function normalizeDelegates() {
    const total = state.delegates.player + state.delegates.rival + state.delegates.undecided;
    if (total !== TOTAL_DELEGATES) state.delegates.undecided += TOTAL_DELEGATES - total;
    for (const key of Object.keys(state.delegates)) state.delegates[key] = clamp(state.delegates[key], 0, TOTAL_DELEGATES);
  }

  function playerGain(amount) {
    let remaining = amount;
    const fromUndecided = Math.min(remaining, state.delegates.undecided);
    state.delegates.undecided -= fromUndecided;
    state.delegates.player += fromUndecided;
    remaining -= fromUndecided;
    const fromRival = Math.min(remaining, state.delegates.rival);
    state.delegates.rival -= fromRival;
    state.delegates.player += fromRival;
    normalizeDelegates();
  }

  function rivalGain(amount) {
    let remaining = amount;
    const fromUndecided = Math.min(remaining, state.delegates.undecided);
    state.delegates.undecided -= fromUndecided;
    state.delegates.rival += fromUndecided;
    remaining -= fromUndecided;
    const fromPlayer = Math.min(remaining, state.delegates.player);
    state.delegates.player -= fromPlayer;
    state.delegates.rival += fromPlayer;
    normalizeDelegates();
  }

  function rivalLose(amount) {
    const lost = Math.min(amount, state.delegates.rival);
    state.delegates.rival -= lost;
    state.delegates.undecided += lost;
    normalizeDelegates();
  }

  function playerLose(amount) {
    const lost = Math.min(amount, state.delegates.player);
    state.delegates.player -= lost;
    state.delegates.undecided += lost;
    normalizeDelegates();
  }

  function canUseStaff(staffId, card) {
    if (!staffId) return true;
    if (state.staff[staffId] !== 'ready') return false;
    if (staffId === 'marie' && card.dirty) return false;
    return true;
  }

  function cardPlayable(card) {
    if (state.phase !== 'game') return false;
    if (card.ap > state.ap) return false;
    if ((card.money || 0) > state.money) return false;
    if (!canUseStaff(state.selectedStaff, card)) return false;
    return true;
  }

  function applyStaffBonus(staffId, card) {
    if (!staffId) return;
    state.staff[staffId] = 'used';
    if (staffId === 'marie') {
      reducePressure(card.front, 1);
      state.morale = clamp(state.morale + 1, 0, 10);
      addLog('Marie udržela akci čistou: tlak −1, morálka +1.', 'good');
    }
    if (staffId === 'miloslav') {
      if (card.front === 'party') playerGain(1);
      state.debt += 1;
      addLog('Miloslav přivedl navíc delegáta. Zároveň si zapsal dluh.', 'warning');
    }
    if (staffId === 'klara') {
      state.intel = true;
      if (card.front === 'media') state.defenses.media = true;
      addLog('Klára odhalila příští tah a připravila mediální obranu.', 'good');
    }
  }

  function applyCardEffect(card) {
    switch (card.effect) {
      case 'partyWhip':
        reducePressure('party', 2);
        playerGain(1);
        addLog('Jeden delegát přešel na vaši stranu.', 'good');
        break;
      case 'backroomDeal':
        reducePressure('party', 3);
        playerGain(2);
        state.trust -= 4;
        state.debt += 1;
        addLog('Dohoda fungovala. Dva hlasy jsou vaše, účet přijde později.', 'warning');
        break;
      case 'promisePost':
        reducePressure('party', 2);
        playerGain(2);
        state.debt += 2;
        state.trust -= 3;
        addLog('Dvěma lidem jste prodal budoucnost, kterou ještě nevlastníte.', 'warning');
        break;
      case 'counterSchedule':
        reducePressure('party', 2);
        state.defenses.party = true;
        addLog('Soupeřův stranický útok je pro toto kolo zablokovaný.', 'good');
        break;
      case 'blackmail':
        reducePressure('party', 1);
        const stolen = Math.min(2, state.delegates.rival);
        state.delegates.rival -= stolen;
        state.delegates.player += stolen;
        state.scandal += 10;
        normalizeDelegates();
        addLog('Kompromat změnil stranu dvou delegátů. Kopie ale existují.', 'danger');
        break;
      case 'factCheck':
        reducePressure('media', 3);
        state.defenses.media = true;
        addLog('Mediální útok je pro toto kolo zablokovaný.', 'good');
        break;
      case 'townHall':
        reducePressure('media', 2);
        state.trust += state.scandal >= 15 ? 2 : 5;
        addLog(state.scandal >= 15 ? 'Lidé poslouchali, ale skandál už přehlušuje část sdělení.' : 'Veřejná debata zvedla důvěru.', 'good');
        break;
      case 'paidAds':
        reducePressure('media', 2);
        state.trust += 5;
        addLog('Placený zásah fungoval. Peníze zmizely, důvěra narostla.', 'good');
        break;
      case 'research':
        reducePressure('media', 1);
        state.intel = true;
        state.evidence += 1;
        drawOne();
        addLog('Máte nový důkaz a znáte příští záměr soupeře.', 'good');
        break;
      case 'leakDocuments':
        reducePressure('media', 2);
        if (state.evidence > 0) {
          state.evidence -= 1;
          rivalLose(2);
          state.scandal += 2;
          addLog('Ověřený únik odrazil dva delegáty od Věčného.', 'good');
        } else {
          rivalLose(1);
          state.scandal += 6;
          state.trust -= 2;
          addLog('Neověřený únik soupeře oslabil, ale část špíny zůstala na vás.', 'danger');
        }
        break;
      case 'volunteerPush':
        reducePressure('staff', 2);
        state.morale += 2;
        if (state.trust >= 45) {
          playerGain(1);
          addLog('Výjezd přesvědčil jednoho nerozhodnutého delegáta.', 'good');
        } else addLog('Dobrovolníci zabránili rozpadu štábu, ale hlas nezískali.', 'neutral');
        break;
      case 'emergencyMeeting':
        reducePressure('staff', 3);
        state.morale += 3;
        addLog('Krizová porada vrátila štábu energii.', 'good');
        break;
      case 'sacrificeAide':
        state.scandal -= 8;
        state.morale -= 2;
        addPressure('staff', 1);
        addLog('Skandál ustoupil. Všichni ve štábu ale viděli, koho jste obětoval.', 'danger');
        break;
      case 'closedApology':
        reducePressure('staff', 2);
        state.morale += 3;
        state.trust += 3;
        addLog('Přiznaná chyba zvedla morálku i důvěru.', 'good');
        break;
      case 'fundraiser':
        state.money += 3;
        state.trust -= 2;
        addPressure('media', 1);
        addLog('Kampaň má peníze. Média se ptají, odkud přišly.', 'warning');
        break;
      default:
        break;
    }
  }

  function playCard(cardId) {
    const card = CARD_BY_ID[cardId];
    if (!card || !state.hand.includes(cardId) || !cardPlayable(card)) return false;
    const staffId = state.selectedStaff;
    state.ap -= card.ap;
    state.money -= card.money || 0;
    state.hand.splice(state.hand.indexOf(cardId), 1);
    state.discard.push(cardId);
    applyCardEffect(card);
    applyStaffBonus(staffId, card);
    state.selectedStaff = null;
    state.trust = clamp(state.trust, 0, 100);
    state.scandal = clamp(state.scandal, 0, 100);
    state.morale = clamp(state.morale, 0, 10);
    fillHand();
    state.banner = { title: card.title, text: `Akce provedena na frontě ${frontLabel(card.front)}.` };
    persist();
    render();
    live.textContent = `Zahrána karta ${card.title}.`;
    return true;
  }

  function resolveIntent() {
    const intent = currentIntent();
    if (state.defenses[intent.front]) {
      addLog(`Zablokováno: ${intent.title}.`, 'good');
      state.banner = { title: 'Soupeř narazil', text: `${intent.title} byl připravenou obranou zneškodněn.` };
      return;
    }
    switch (intent.id) {
      case 'smear':
        state.trust -= 7;
        addPressure('media', 2);
        break;
      case 'poach':
        rivalGain(2);
        addPressure('party', 2);
        break;
      case 'staff_raid':
        state.morale -= 2;
        addPressure('staff', 2);
        break;
      case 'donor_leak':
        state.scandal += 6;
        state.trust -= 3;
        break;
      case 'whip':
        rivalGain(2);
        addPressure('party', 2);
        break;
      case 'final_smear':
        state.trust -= 8;
        if (state.scandal >= 10) rivalGain(1);
        addPressure('media', 2);
        break;
      default:
        break;
    }
    state.banner = { title: `Věčný: ${intent.title}`, text: intent.effect };
    addLog(`Soupeř provedl tah „${intent.title}“.`, 'danger');
  }

  function resolvePressure() {
    const penalties = [];
    if (state.pressure.party >= 7) {
      playerLose(1);
      penalties.push('Strana: ztratili jste delegáta.');
    }
    if (state.pressure.media >= 7) {
      state.trust -= 6;
      state.scandal += 2;
      penalties.push('Média: důvěra −6, skandál +2.');
    }
    if (state.pressure.staff >= 7) {
      state.morale -= 2;
      penalties.push('Štáb: morálka −2.');
    }
    for (const front of ['party', 'media', 'staff']) {
      state.pressure[front] = clamp(state.pressure[front] - 3, 0, 10);
    }
    if (penalties.length) addLog(`Nezvládnuté krize — ${penalties.join(' ')}`, 'danger');
  }

  function applyRoundEvent(round) {
    const event = ROUND_EVENTS[round - 1];
    if (!event) return;
    for (const [front, amount] of Object.entries(event.pressure)) addPressure(front, amount);
    state.banner = { title: event.title, text: event.text };
    addLog(`Nová krize: ${event.title}.`, 'warning');
  }

  function checkEnding(forceFinal = false) {
    if (state.trust <= 0) {
      state.phase = 'ending';
      state.endingReason = 'trust';
      return true;
    }
    if (state.morale <= 0) {
      state.phase = 'ending';
      state.endingReason = 'morale';
      return true;
    }
    if (forceFinal || state.round > MAX_ROUNDS) {
      state.phase = 'ending';
      state.endingReason = state.delegates.player >= 8 ? 'win' : 'delegates';
      return true;
    }
    return false;
  }

  function endRound() {
    if (state.phase !== 'game') return;
    resolveIntent();
    resolvePressure();
    state.trust = clamp(state.trust, 0, 100);
    state.scandal = clamp(state.scandal, 0, 100);
    state.morale = clamp(state.morale, 0, 10);
    if (state.round >= MAX_ROUNDS) {
      checkEnding(true);
      persist();
      render();
      return;
    }
    if (checkEnding(false)) {
      persist();
      render();
      return;
    }
    state.round += 1;
    state.ap = 3;
    state.defenses = { party: false, media: false, staff: false };
    state.staff = { marie: 'ready', miloslav: 'ready', klara: 'ready' };
    state.selectedStaff = null;
    state.lastFront = null;
    state.frontStreak = 0;
    applyRoundEvent(state.round);
    fillHand();
    persist();
    render();
    live.textContent = `Začíná kolo ${state.round}.`;
  }

  function startGame() {
    state.phase = 'game';
    fillHand();
    applyRoundEvent(1);
    addLog('Začíná šest kol boje o osm delegátů.', 'neutral');
    persist();
    render();
  }

  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.build !== BUILD || !parsed.delegates || !parsed.pressure) return false;
      state = parsed;
      return true;
    } catch {
      return false;
    }
  }

  function frontLabel(front) {
    return { party: 'strany', media: 'médií', staff: 'štábu' }[front] || front;
  }

  function frontTitle(front) {
    return { party: 'Strana', media: 'Veřejnost a média', staff: 'Volební štáb' }[front] || front;
  }

  function metric(label, value, suffix = '') {
    return `<div class="k190-metric"><span>${label}</span><strong>${value}${suffix}</strong></div>`;
  }

  function delegateTokens() {
    const tokens = [];
    for (let index = 0; index < state.delegates.player; index += 1) tokens.push('<span class="k190-delegate is-player" title="Váš delegát">K</span>');
    for (let index = 0; index < state.delegates.undecided; index += 1) tokens.push('<span class="k190-delegate is-undecided" title="Nerozhodnutý delegát">?</span>');
    for (let index = 0; index < state.delegates.rival; index += 1) tokens.push('<span class="k190-delegate is-rival" title="Delegát Vladimíra Věčného">V</span>');
    return tokens.join('');
  }

  function pressureCard(front) {
    const value = state.pressure[front];
    const penalty = front === 'party' ? 'Při 7+: ztratíte delegáta.' : front === 'media' ? 'Při 7+: důvěra −6 a skandál +2.' : 'Při 7+: morálka −2.';
    return `<section class="k190-front ${value >= 7 ? 'is-critical' : ''}" data-front="${front}">
      <header><span>${frontTitle(front)}</span><strong>${value}/10</strong></header>
      <div class="k190-pressure"><i style="width:${value * 10}%"></i></div>
      <small>${penalty}</small>
    </section>`;
  }

  function intentCard() {
    const intent = currentIntent();
    const next = nextIntent();
    return `<section class="k190-intent k190-intent--${intent.front}">
      <p class="k190-label">SOUPEŘŮV ZÁMĚR</p>
      <h2>${intent.title}</h2>
      <p>${intent.text}</p>
      <strong>${intent.effect}</strong>
      <span class="k190-intent-status">${state.defenses[intent.front] ? 'ZABLOKOVÁNO' : `ÚTOK NA: ${frontTitle(intent.front).toUpperCase()}`}</span>
      ${state.intel && next ? `<div class="k190-intel"><span>Příští tah</span><b>${next.title}</b></div>` : '<div class="k190-intel is-hidden"><span>Příští tah</span><b>Neznámý</b></div>'}
    </section>`;
  }

  function staffButton(id) {
    const member = STAFF[id];
    const status = state.staff[id];
    const selected = state.selectedStaff === id;
    return `<button class="k190-staff ${selected ? 'is-selected' : ''} ${status !== 'ready' ? 'is-used' : ''}" type="button" data-staff="${id}" ${status !== 'ready' ? 'disabled' : ''}>
      <span class="k190-avatar">${member.initials}</span>
      <span><strong>${member.name}</strong><small>${member.role}</small><em>${member.ability}</em></span>
      <b>${status === 'ready' ? (selected ? 'VYBRÁN' : 'PŘIPRAVEN') : 'POUŽIT'}</b>
    </button>`;
  }

  function cardButton(cardId) {
    const card = CARD_BY_ID[cardId];
    const playable = cardPlayable(card);
    const staff = state.selectedStaff ? STAFF[state.selectedStaff] : null;
    let lockReason = '';
    if (card.ap > state.ap) lockReason = 'Málo akcí';
    else if ((card.money || 0) > state.money) lockReason = 'Málo peněz';
    else if (staff && state.selectedStaff === 'marie' && card.dirty) lockReason = 'Marie odmítá';
    return `<button class="k190-card k190-card--${card.front} ${card.dirty ? 'is-dirty' : ''}" type="button" data-card="${card.id}" ${playable ? '' : 'disabled'}>
      <span class="k190-card-front">${frontTitle(card.front)}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
      <div class="k190-card-tags">${card.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
      <footer><strong>${card.ap} AP</strong>${card.money ? `<strong>${card.money}k</strong>` : ''}<em>${lockReason || 'ZAHRÁT'}</em></footer>
    </button>`;
  }

  function logView() {
    return `<section class="k190-log"><p class="k190-label">PRŮBĚH KAMPANĚ</p>${state.log.map((entry) => `<div class="is-${entry.tone}"><span>K${entry.round}</span><p>${entry.text}</p></div>`).join('')}</section>`;
  }

  function startView() {
    return `<main class="k190-start">
      <section>
        <p class="k190-label">TAKTICKÝ PROTOTYP</p>
        <h1>Šest kol do sněmu.</h1>
        <p class="k190-lead">Získejte 8 z 15 delegátů. Každé kolo máte tři akce, pět karet a soupeře, který svůj tah opravdu provede.</p>
        <div class="k190-rules">
          <div><strong>1</strong><span>Hlídejte tři fronty. Neřešená krize vás potrestá.</span></div>
          <div><strong>2</strong><span>Přiřaďte člověka ke kartě a využijte jeho schopnost.</span></div>
          <div><strong>3</strong><span>Čisté a špinavé tahy vedou k jiné ceně vítězství.</span></div>
        </div>
        <button class="k190-primary" type="button" data-action="start">Otevřít válečnou místnost</button>
      </section>
      <aside>
        <p class="k190-label">VÝCHOZÍ STAV</p>
        <div class="k190-start-score"><span><b>4</b> vy</span><span><b>5</b> nerozhodnutí</span><span><b>6</b> Věčný</span></div>
        <blockquote>„Tentokrát nestačí vybrat odpověď. Musíte přežít tah soupeře.“</blockquote>
      </aside>
    </main>`;
  }

  function gameView() {
    return `<main class="k190-game">
      <header class="k190-topbar">
        <div class="k190-brand"><span>K</span><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO <em>v0.19.0</em></strong></div></div>
        <div class="k190-round">KOLO <strong>${state.round}/${MAX_ROUNDS}</strong></div>
        <div class="k190-metrics">${metric('Akce', state.ap)}${metric('Peníze', state.money, 'k')}${metric('Důvěra', state.trust, '%')}${metric('Skandál', state.scandal, '%')}${metric('Dluh', state.debt)}${metric('Morálka', state.morale, '/10')}</div>
        <div class="k190-tools"><button type="button" data-action="save">Uložit</button><button type="button" data-action="load">Načíst</button><button type="button" data-action="restart">Restart</button><a href="?legacy=1">v0.17</a></div>
      </header>

      ${state.banner ? `<section class="k190-banner"><strong>${state.banner.title}</strong><span>${state.banner.text}</span></section>` : ''}

      <section class="k190-board">
        <aside class="k190-left">
          <section class="k190-delegates-panel">
            <div class="k190-panel-head"><div><p class="k190-label">HLAVNÍ CÍL</p><h2>Delegáti</h2></div><strong>${state.delegates.player}/8</strong></div>
            <div class="k190-delegates" aria-label="Rozdělení patnácti delegátů">${delegateTokens()}</div>
            <div class="k190-delegate-legend"><span class="is-player">Vy ${state.delegates.player}</span><span class="is-undecided">Nerozhodnutí ${state.delegates.undecided}</span><span class="is-rival">Věčný ${state.delegates.rival}</span></div>
          </section>
          ${intentCard()}
          ${logView()}
        </aside>

        <section class="k190-center">
          <div class="k190-fronts">${pressureCard('party')}${pressureCard('media')}${pressureCard('staff')}</div>
          <section class="k190-hand-head"><div><p class="k190-label">VAŠE RUKA</p><h2>Zahrajte karty za ${state.ap} zbývající AP</h2></div><button class="k190-end" type="button" data-action="end-round">Ukončit kolo</button></section>
          <section class="k190-hand" aria-label="Karty na ruce">${state.hand.map(cardButton).join('')}</section>
        </section>

        <aside class="k190-right">
          <section class="k190-staff-panel"><p class="k190-label">PŘIŘADIT ČLOVĚKA K DALŠÍ KARTĚ</p>${staffButton('marie')}${staffButton('miloslav')}${staffButton('klara')}<button class="k190-clear-staff" type="button" data-action="clear-staff">Hrát bez podpory</button></section>
          <section class="k190-resources"><p class="k190-label">PÁKY</p><div><span>Důkazy</span><strong>${state.evidence}</strong></div><div><span>Momentum</span><strong>${state.frontStreak >= 2 ? `${frontTitle(state.lastFront)} ×${state.frontStreak}` : 'žádné'}</strong></div><div><span>Balíček</span><strong>${state.deck.length}</strong></div></section>
        </aside>
      </section>
    </main>`;
  }

  function endingView() {
    const win = state.endingReason === 'win';
    const title = win ? 'Máte většinu. Teď spočítejte cenu.' : state.endingReason === 'trust' ? 'Kampaň se rozpadla veřejně.' : state.endingReason === 'morale' ? 'Štáb odešel dřív než voliči.' : 'Věčný udržel většinu.';
    const body = win
      ? `Získali jste ${state.delegates.player} z 15 delegátů. ${state.debt >= 4 ? 'Většinu drží pohromadě sliby a dluhy.' : 'Většina zatím není zatížená příliš mnoha závazky.'}`
      : `Končíte s ${state.delegates.player} delegáty. Soupeř má ${state.delegates.rival} a nerozhodnutí ${state.delegates.undecided}.`;
    return `<main class="k190-ending">
      <section>
        <p class="k190-label">${win ? 'VÍTĚZSTVÍ' : 'PROHRA'}</p>
        <h1>${title}</h1>
        <p class="k190-lead">${body}</p>
        <div class="k190-ending-score">${metric('Delegáti', state.delegates.player, '/15')}${metric('Důvěra', state.trust, '%')}${metric('Skandál', state.scandal, '%')}${metric('Dluhy', state.debt)}${metric('Morálka', state.morale, '/10')}</div>
        <div class="k190-ending-actions"><button class="k190-primary" type="button" data-action="restart">Hrát znovu s jiným balíčkem</button><a href="?legacy=1">Otevřít původní kampaň v0.17</a></div>
      </section>
      <aside>${logView()}</aside>
    </main>`;
  }

  function render() {
    const content = state.phase === 'start' ? startView() : state.phase === 'ending' ? endingView() : gameView();
    root.innerHTML = `${content}<footer class="k190-footer"><span>Fiktivní obec. Skutečný soupeřův tah.</span><span>Build ${BUILD} · seed ${state.seed}</span></footer>`;
    bind();
  }

  function bind() {
    root.querySelector('[data-action="start"]')?.addEventListener('click', startGame);
    root.querySelectorAll('[data-staff]').forEach((button) => button.addEventListener('click', () => {
      state.selectedStaff = state.selectedStaff === button.dataset.staff ? null : button.dataset.staff;
      render();
    }));
    root.querySelectorAll('[data-card]').forEach((button) => button.addEventListener('click', () => playCard(button.dataset.card)));
    root.querySelector('[data-action="clear-staff"]')?.addEventListener('click', () => { state.selectedStaff = null; render(); });
    root.querySelector('[data-action="end-round"]')?.addEventListener('click', endRound);
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
      const nextSeed = Date.now();
      state = baseState(nextSeed);
      try { localStorage.removeItem(SAVE_KEY); } catch {}
      render();
    });
    root.querySelector('[data-action="save"]')?.addEventListener('click', () => {
      live.textContent = persist() ? 'Hra byla uložena.' : 'Hru se nepodařilo uložit.';
    });
    root.querySelector('[data-action="load"]')?.addEventListener('click', () => {
      const ok = restore();
      live.textContent = ok ? 'Uložená hra byla načtena.' : 'Uložená hra nebyla nalezena.';
      if (ok) render();
    });
  }

  function mount() {
    document.documentElement.classList.add('k190-active');
    document.querySelector('#app')?.setAttribute('aria-hidden', 'true');
    document.querySelector('#diceOverlay')?.setAttribute('aria-hidden', 'true');
    root = document.createElement('div');
    root.id = 'k190Root';
    root.className = 'k190-root';
    live = document.createElement('div');
    live.className = 'k190-sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.prepend(live);
    document.body.prepend(root);
    render();
  }

  window.KorytoWarRoom = Object.freeze({
    BUILD,
    SAVE_KEY,
    TOTAL_DELEGATES,
    MAX_ROUNDS,
    CARDS: copy(CARDS),
    INTENTS: copy(INTENTS),
    getState: () => copy(state),
    playCard,
    endRound,
    reset: (seed = 190) => { state = baseState(seed); render(); },
    start: () => { if (state.phase === 'start') startGame(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
