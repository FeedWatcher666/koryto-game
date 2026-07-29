(() => {
  'use strict';

  const BUILD = '0.20.0-test.1';
  const SAVE_KEY = 'koryto:v0200:village-rpg';
  const WIDTH = 9;
  const HEIGHT = 7;
  const TOTAL_VOTERS = 15;
  const DAYS = 3;

  if (new URLSearchParams(window.location.search).get('legacy') === '1') {
    document.documentElement.classList.add('k200-legacy-mode');
    return;
  }

  const ARCHETYPES = Object.freeze({
    soused: {
      name: 'Soused odvedle',
      emoji: '🧑‍🌾',
      pitch: 'Zná každou díru v silnici i člověka, který ji slíbil opravit.',
      perk: '+1 krok každý den.',
      moves: 1
    },
    mluvka: {
      name: 'Mluvka z plakátu',
      emoji: '🎤',
      pitch: 'Dokáže říct tři věty, aniž by odpověděl. V politice vzácný talent.',
      perk: 'Širší úspěšná zóna v debatě.',
      timing: 12
    },
    sibir: {
      name: 'Okresní šíbr',
      emoji: '🕴️',
      pitch: 'Přesně nevíte, co umí. To je součást jeho kvalifikace.',
      perk: 'Začíná s jedním šanonem, ale také s malým průšvihem.',
      evidence: 1,
      scandal: 5
    }
  });

  const LOCATIONS = Object.freeze({
    pub: { x: 1, y: 1, icon: '🍺', name: 'Hospoda U Výčepního', game: 'timing', copy: 'Přesvědčte sál jednou dobře načasovanou pointou.' },
    office: { x: 7, y: 1, icon: '🏛️', name: 'Obecní úřad', game: 'memory', copy: 'Najděte správný šanon dřív, než ho někdo omylem skartuje.' },
    square: { x: 4, y: 5, icon: '📌', name: 'Náves', game: 'poster', copy: 'Přelepte soupeře dřív, než přelepí on vás.' }
  });

  const OBSTACLES = new Set([
    '3,0', '4,0', '5,0',
    '3,2', '5,2',
    '0,3', '8,3',
    '2,4', '6,4',
    '2,6', '3,6', '5,6', '6,6'
  ]);

  const PERSONAS = Object.freeze([
    { id: 'order', face: '🧹', line: 'U kontejnerů je papír vedle plastu. Civilizace končí.', answer: 'order', label: 'Pořádek' },
    { id: 'change', face: '😤', line: 'Všichni jsou zloději. Letos bych rád nové.', answer: 'change', label: 'Změna' },
    { id: 'calm', face: '🏡', line: 'Hlavně ať se tu nic nestaví. Ani opravuje. Ani mění.', answer: 'calm', label: 'Klid' },
    { id: 'order2', face: '🐕', line: 'Pes starosty zase běhá bez vodítka. Stát selhal.', answer: 'order', label: 'Pořádek' },
    { id: 'change2', face: '🧾', line: 'Razítko trvá měsíc. Úplatek prý jen týden.', answer: 'change', label: 'Změna' },
    { id: 'calm2', face: '🌳', line: 'Bydlím v Praze, ale o vaší obci rozhoduju na Facebooku.', answer: 'calm', label: 'Klid' },
    { id: 'order3', face: '🚗', line: 'Někdo mi stojí třicet centimetrů před vjezdem.', answer: 'order', label: 'Pořádek' },
    { id: 'change3', face: '📱', line: 'Chci transparentnost. Ale anonymně.', answer: 'change', label: 'Změna' },
    { id: 'calm3', face: '🥨', line: 'Program nečtu. Řekněte mi, kdo zajistí občerstvení.', answer: 'calm', label: 'Klid' },
    { id: 'order4', face: '🪚', line: 'Soused řeže dřevo v sobotu v 9:03. Máte plán?', answer: 'order', label: 'Pořádek' }
  ]);

  const DAY_EVENTS = Object.freeze([
    { title: 'Místní Facebook objevil pravdu', text: 'Někdo zveřejnil, že chcete zakázat Vánoce a povolit kruhový objezd.', effect: (s) => { s.trust -= 5; s.scandal += 2; } },
    { title: 'Soupeř rozdává guláš', text: 'Vladimír Věčný objevil ideologii, která se vejde do plastové misky.', effect: (s) => claimForRival(s, 1) },
    { title: 'Kronikář našel fotografii', text: 'Rok 2009. Vy, lesklá košile a nápis „Yes we can“ z papíru A4.', effect: (s) => { s.scandal += 4; } },
    { title: 'Obec rozkopala jedinou ulici', text: 'Důvod není znám. Faktura ano. Dnes máte o jeden krok méně.', effect: (s) => { s.moves = Math.max(2, s.moves - 1); } },
    { title: 'Nečekaný úspěch petice', text: 'Podepsali ji i tři lidé, kteří tvrdí, že petice nic neřeší.', effect: (s) => { s.trust += 5; } }
  ]);

  const ITEMS = Object.freeze({
    donut: { icon: '🍩', name: 'Volební kobliha', copy: '+2 kroky. Sacharidy zachraňují demokracii.', collect: (s) => { s.moves += 2; } },
    megaphone: { icon: '📣', name: 'Megafon po hasičích', copy: '+6 důvěry. Reproduktor chrčí, ale přesvědčivě.', collect: (s) => { s.trust += 6; } },
    envelope: { icon: '✉️', name: 'Transparentní obálka', copy: '+1 šanon, +4 průšvih. Je průhledná jen proti světlu.', collect: (s) => { s.evidence += 1; s.scandal += 4; } }
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const keyOf = (x, y) => `${x},${y}`;
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
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function locationAt(x, y) {
    return Object.entries(LOCATIONS).find(([, location]) => location.x === x && location.y === y) || null;
  }

  function passable(x, y) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !OBSTACLES.has(keyOf(x, y));
  }

  function occupiedStatic(x, y) {
    return OBSTACLES.has(keyOf(x, y)) || Boolean(locationAt(x, y));
  }

  function randomFreeTiles(random, count, excluded = new Set()) {
    const tiles = [];
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const key = keyOf(x, y);
        if (!occupiedStatic(x, y) && !excluded.has(key)) tiles.push({ x, y });
      }
    }
    return shuffle(tiles, random).slice(0, count);
  }

  function createState(seed = Date.now()) {
    const random = mulberry32(seed);
    const blocked = new Set(['0,6', '8,0', '4,3']);
    const voterTiles = randomFreeTiles(random, 10, blocked);
    voterTiles.forEach((tile) => blocked.add(keyOf(tile.x, tile.y)));
    const itemTiles = randomFreeTiles(random, 3, blocked);
    const itemIds = shuffle(Object.keys(ITEMS), random);

    return {
      build: BUILD,
      seed,
      phase: 'start',
      archetype: null,
      day: 1,
      moves: 8,
      player: { x: 0, y: 6 },
      rival: { x: 8, y: 0 },
      votes: { player: 2, rival: 3, undecided: 10 },
      trust: 50,
      scandal: 0,
      evidence: 0,
      voters: voterTiles.map((tile, index) => ({ ...tile, persona: PERSONAS[index % PERSONAS.length].id })),
      items: itemTiles.map((tile, index) => ({ ...tile, id: itemIds[index] })),
      visited: { pub: 0, office: 0, square: 0 },
      currentVoter: null,
      mini: null,
      dayEvent: null,
      toast: null,
      log: ['Kandidatura podána. Část obce si myslí, že jde o administrativní chybu.'],
      ending: null
    };
  }

  const seedParam = Number.parseInt(new URLSearchParams(window.location.search).get('seed') || '', 10);
  let state = createState(Number.isFinite(seedParam) ? seedParam : Date.now());
  let root;
  let live;
  let miniTimer = null;
  let miniInterval = null;
  let memoryTimers = [];

  function clearMiniTimers() {
    if (miniTimer) clearTimeout(miniTimer);
    if (miniInterval) clearInterval(miniInterval);
    miniTimer = null;
    miniInterval = null;
    memoryTimers.forEach(clearTimeout);
    memoryTimers = [];
  }

  function addLog(text) {
    state.log.unshift(text);
    state.log = state.log.slice(0, 8);
  }

  function normalizeVotes() {
    const sum = state.votes.player + state.votes.rival + state.votes.undecided;
    state.votes.undecided += TOTAL_VOTERS - sum;
    Object.keys(state.votes).forEach((key) => { state.votes[key] = clamp(state.votes[key], 0, TOTAL_VOTERS); });
  }

  function claimForPlayer(targetState, amount = 1) {
    let claimed = 0;
    while (claimed < amount && targetState.votes.undecided > 0) {
      const voter = targetState.voters.shift();
      if (voter) {
        targetState.votes.undecided -= 1;
        targetState.votes.player += 1;
        claimed += 1;
      } else break;
    }
    normalizeVotes();
    return claimed;
  }

  function claimForRival(targetState, amount = 1) {
    let claimed = 0;
    while (claimed < amount && targetState.votes.undecided > 0) {
      const voter = targetState.voters.shift();
      if (voter) {
        targetState.votes.undecided -= 1;
        targetState.votes.rival += 1;
        claimed += 1;
      } else break;
    }
    normalizeVotes();
    return claimed;
  }

  function voterAt(x, y) {
    return state.voters.find((voter) => voter.x === x && voter.y === y) || null;
  }

  function itemAt(x, y) {
    return state.items.find((item) => item.x === x && item.y === y) || null;
  }

  function personaById(id) {
    return PERSONAS.find((persona) => persona.id === id) || PERSONAS[0];
  }

  function openStart(archetypeId) {
    const archetype = ARCHETYPES[archetypeId];
    if (!archetype) return;
    state.archetype = archetypeId;
    state.moves = 8 + (archetype.moves || 0);
    state.evidence = archetype.evidence || 0;
    state.scandal = archetype.scandal || 0;
    state.phase = 'map';
    addLog(`${archetype.name} vyráží do ulic. Věčný už tvrdí, že vás osobně nezná.`);
    render();
  }

  function adjacent(x, y) {
    return Math.abs(state.player.x - x) + Math.abs(state.player.y - y) === 1;
  }

  function movePlayer(x, y) {
    if (state.phase !== 'map' || state.moves <= 0 || !adjacent(x, y) || !passable(x, y)) return false;
    state.player = { x, y };
    state.moves -= 1;

    const item = itemAt(x, y);
    if (item) {
      const data = ITEMS[item.id];
      data.collect(state);
      state.items = state.items.filter((entry) => entry !== item);
      state.toast = `${data.icon} ${data.name}: ${data.copy}`;
      addLog(`Nalezen předmět: ${data.name}.`);
    }

    const voter = voterAt(x, y);
    if (voter) {
      state.currentVoter = voter;
      state.phase = 'canvass';
      render();
      return true;
    }

    if (state.rival.x === x && state.rival.y === y) {
      state.scandal += 5;
      state.trust -= 3;
      state.toast = '📸 Fotografie z osobního střetu. Nikdo neví, kdo začal, ale všichni ji sdílejí.';
      addLog('Srážka s Věčným skončila fotografií, na které vypadáte vinně oba.');
    }

    moveRival();
    afterAction();
    render();
    return true;
  }

  function directionMove(dx, dy) {
    return movePlayer(state.player.x + dx, state.player.y + dy);
  }

  function rivalStepToward(target) {
    const candidates = [
      { x: state.rival.x + 1, y: state.rival.y },
      { x: state.rival.x - 1, y: state.rival.y },
      { x: state.rival.x, y: state.rival.y + 1 },
      { x: state.rival.x, y: state.rival.y - 1 }
    ].filter((tile) => passable(tile.x, tile.y));
    candidates.sort((a, b) => {
      const da = Math.abs(a.x - target.x) + Math.abs(a.y - target.y);
      const db = Math.abs(b.x - target.x) + Math.abs(b.y - target.y);
      return da - db;
    });
    if (candidates[0]) state.rival = candidates[0];
  }

  function moveRival() {
    if (!state.voters.length) return;
    const target = state.voters.slice().sort((a, b) => {
      const da = Math.abs(a.x - state.rival.x) + Math.abs(a.y - state.rival.y);
      const db = Math.abs(b.x - state.rival.x) + Math.abs(b.y - state.rival.y);
      return da - db;
    })[0];
    rivalStepToward(target);
    const caught = voterAt(state.rival.x, state.rival.y);
    if (caught) {
      state.voters = state.voters.filter((voter) => voter !== caught);
      state.votes.rival += 1;
      state.votes.undecided -= 1;
      addLog('Věčný odchytil nerozhodnutého voliče a slíbil mu lavičku, funkci nebo obojí.');
      state.toast = '🕴️ Věčný získal jednoho voliče.';
      normalizeVotes();
    }
  }

  function answerVoter(answer) {
    if (state.phase !== 'canvass' || !state.currentVoter) return;
    const voter = state.currentVoter;
    const persona = personaById(voter.persona);
    state.voters = state.voters.filter((entry) => entry !== voter);
    state.currentVoter = null;
    if (answer === persona.answer) {
      state.votes.player += 1;
      state.votes.undecided -= 1;
      state.trust += 2;
      state.toast = `${persona.face} „Dobře. Ale jestli se něco změní, budu proti.“`;
      addLog('Přesvědčen jeden volič. Přesvědčení je zatím podmíněné a odvolatelné.');
    } else {
      state.votes.rival += 1;
      state.votes.undecided -= 1;
      state.trust -= 2;
      state.toast = `${persona.face} „Tohle přesně říkal i Věčný. Jen lépe.“`;
      addLog('Špatně zvolený argument poslal voliče přímo k soupeři.');
    }
    normalizeVotes();
    state.phase = 'map';
    moveRival();
    afterAction();
    render();
  }

  function enterLocation(id) {
    const location = LOCATIONS[id];
    if (!location || state.phase !== 'map') return;
    if (state.player.x !== location.x || state.player.y !== location.y) return;
    state.visited[id] += 1;
    clearMiniTimers();
    if (location.game === 'timing') startTiming(id);
    if (location.game === 'memory') startMemory(id);
    if (location.game === 'poster') startPoster(id);
  }

  function startTiming(locationId) {
    const width = 24 + (ARCHETYPES[state.archetype].timing || 0);
    const random = mulberry32(state.seed + state.day * 71 + state.visited[locationId] * 13);
    state.phase = 'mini';
    state.mini = { type: 'timing', locationId, pointer: 0, direction: 1, zoneStart: 20 + Math.floor(random() * (55 - width)), zoneWidth: width, done: false };
    render();
    miniInterval = setInterval(() => {
      if (!state.mini || state.mini.type !== 'timing' || state.mini.done) return;
      state.mini.pointer += state.mini.direction * 3;
      if (state.mini.pointer >= 100) { state.mini.pointer = 100; state.mini.direction = -1; }
      if (state.mini.pointer <= 0) { state.mini.pointer = 0; state.mini.direction = 1; }
      const marker = root.querySelector('.k200-timing-marker');
      if (marker) marker.style.left = `${state.mini.pointer}%`;
    }, 30);
  }

  function stopTiming() {
    if (!state.mini || state.mini.type !== 'timing' || state.mini.done) return;
    state.mini.done = true;
    clearMiniTimers();
    const { pointer, zoneStart, zoneWidth } = state.mini;
    const inside = pointer >= zoneStart && pointer <= zoneStart + zoneWidth;
    const center = zoneStart + zoneWidth / 2;
    const perfect = Math.abs(pointer - center) <= zoneWidth * 0.18;
    if (perfect) {
      const claimed = claimForPlayer(state, 2);
      state.trust += 5;
      state.mini.result = `Pointa sedla přesně. ${claimed ? `Získáváte ${claimed} hlasy.` : 'Sál vám alespoň zatleskal.'}`;
      addLog('Hospodská debata skončila potleskem a několika upřímně překvapenými tvářemi.');
    } else if (inside) {
      const claimed = claimForPlayer(state, 1);
      state.trust += 2;
      state.mini.result = `Použitelné. ${claimed ? 'Jeden volič mění stranu.' : 'Nikdo neodešel, což je úspěch.'}`;
      addLog('Pointa přežila kontakt s hospodou.');
    } else {
      state.scandal += 4;
      state.trust -= 4;
      state.mini.result = 'Ticho. Pak někdo zakašlal slovo „trapné“. Průšvih +4.';
      addLog('Debata skončila tichem, které už někdo nahrál na telefon.');
    }
    normalizeVotes();
    render();
  }

  function startMemory(locationId) {
    const random = mulberry32(state.seed + state.day * 83 + state.visited[locationId] * 17);
    const sequence = [0, 1, 2].map(() => Math.floor(random() * 4));
    state.phase = 'mini';
    state.mini = { type: 'memory', locationId, sequence, input: [], showing: true, highlight: null, done: false };
    render();
    sequence.forEach((value, index) => {
      memoryTimers.push(setTimeout(() => {
        if (!state.mini || state.mini.type !== 'memory') return;
        state.mini.highlight = value;
        renderMiniOnly();
      }, 500 + index * 700));
      memoryTimers.push(setTimeout(() => {
        if (!state.mini || state.mini.type !== 'memory') return;
        state.mini.highlight = null;
        renderMiniOnly();
      }, 900 + index * 700));
    });
    memoryTimers.push(setTimeout(() => {
      if (!state.mini || state.mini.type !== 'memory') return;
      state.mini.showing = false;
      render();
    }, 500 + sequence.length * 700));
  }

  function memoryPick(index) {
    if (!state.mini || state.mini.type !== 'memory' || state.mini.showing || state.mini.done) return;
    state.mini.input.push(index);
    const position = state.mini.input.length - 1;
    if (state.mini.sequence[position] !== index) {
      state.mini.done = true;
      state.scandal += 3;
      state.mini.result = 'Otevřeli jste šanon „Dotace – nespalovat“. Někdo ho okamžitě spálil. Průšvih +3.';
      addLog('Šanonový labyrint vyhrál úřad. Jako vždy.');
      render();
      return;
    }
    if (state.mini.input.length === state.mini.sequence.length) {
      state.mini.done = true;
      state.evidence += 1;
      state.trust += 2;
      state.mini.result = 'Správný šanon nalezen. Máte důkaz a úředník má náhle obědovou pauzu.';
      addLog('Získán šanon, který oficiálně neexistuje.');
      render();
    } else render();
  }

  function startPoster(locationId) {
    const random = mulberry32(state.seed + state.day * 97 + state.visited[locationId] * 19);
    state.phase = 'mini';
    state.mini = { type: 'poster', locationId, hits: 0, misses: 0, step: 0, target: { x: 15 + Math.floor(random() * 70), y: 15 + Math.floor(random() * 60) }, done: false, randomSeed: Math.floor(random() * 100000) };
    render();
    miniTimer = setTimeout(finishPoster, 7000);
  }

  function posterHit() {
    if (!state.mini || state.mini.type !== 'poster' || state.mini.done) return;
    state.mini.hits += 1;
    state.mini.step += 1;
    const random = mulberry32(state.mini.randomSeed + state.mini.step * 37);
    state.mini.target = { x: 10 + Math.floor(random() * 78), y: 12 + Math.floor(random() * 68) };
    if (state.mini.hits >= 6) finishPoster();
    else renderMiniOnly();
  }

  function finishPoster() {
    if (!state.mini || state.mini.type !== 'poster' || state.mini.done) return;
    state.mini.done = true;
    clearMiniTimers();
    if (state.mini.hits >= 6) {
      const claimed = claimForPlayer(state, 2);
      state.trust += 4;
      state.mini.result = `Náves je vaše. ${claimed ? `Získáváte ${claimed} hlasy.` : 'Všechny lampy jsou demokraticky obsazené.'}`;
      addLog('Plakáty visí rovně. To už samo působí jako změna.');
    } else if (state.mini.hits >= 3) {
      const claimed = claimForPlayer(state, 1);
      state.mini.result = `${state.mini.hits} zásahů. ${claimed ? 'Jeden hlas získán.' : 'Aspoň jste přelepili reklamu na kominíka.'}`;
      addLog('Plakátová bitva skončila remízou a jednou poškozenou lampou.');
    } else {
      state.trust -= 3;
      state.mini.result = 'Věčný vás přelepil ještě během lepení. Důvěra −3.';
      addLog('Na vašem plakátu teď Věčný vypadá, jako by měl vaše tělo.');
    }
    normalizeVotes();
    render();
  }

  function renderMiniOnly() {
    const container = root?.querySelector('.k200-mini-stage');
    if (!container) return render();
    container.outerHTML = miniStage();
    bind();
  }

  function leaveMini() {
    if (!state.mini?.done) return;
    clearMiniTimers();
    state.mini = null;
    state.phase = 'map';
    moveRival();
    afterAction();
    render();
  }

  function useEvidence() {
    if (state.phase !== 'map' || state.evidence <= 0 || state.moves <= 0 || state.votes.rival <= 0) return;
    state.evidence -= 1;
    state.moves -= 1;
    state.votes.rival -= 1;
    state.votes.undecided += 1;
    state.scandal += 3;
    spawnVoter();
    normalizeVotes();
    state.toast = '📂 Šanon zveřejněn. Jeden Věčného hlas znovu pochybuje. Také policie.';
    addLog('Zveřejněný šanon vrátil jednoho voliče do nerozhodnutého stavu.');
    moveRival();
    afterAction();
    render();
  }

  function spawnVoter() {
    const random = mulberry32(state.seed + state.day * 101 + state.log.length * 11);
    const excluded = new Set([
      keyOf(state.player.x, state.player.y), keyOf(state.rival.x, state.rival.y),
      ...state.voters.map((v) => keyOf(v.x, v.y)),
      ...state.items.map((item) => keyOf(item.x, item.y))
    ]);
    const tile = randomFreeTiles(random, 1, excluded)[0];
    if (tile) state.voters.push({ ...tile, persona: PERSONAS[(state.log.length + state.day) % PERSONAS.length].id });
  }

  function afterAction() {
    state.trust = clamp(state.trust, 0, 100);
    state.scandal = clamp(state.scandal, 0, 100);
    normalizeVotes();
    if (state.votes.player >= 8 || state.votes.rival >= 8 || state.votes.undecided <= 0) {
      finishGame();
      return;
    }
    if (state.moves <= 0) endDay();
  }

  function endDay() {
    if (state.day >= DAYS) {
      finishGame();
      return;
    }
    state.day += 1;
    state.moves = 8 + (ARCHETYPES[state.archetype].moves || 0);
    const random = mulberry32(state.seed + state.day * 137);
    const event = DAY_EVENTS[Math.floor(random() * DAY_EVENTS.length)];
    state.dayEvent = { title: event.title, text: event.text };
    event.effect(state);
    normalizeVotes();
    state.phase = 'dayevent';
    addLog(`Den ${state.day}: ${event.title}.`);
  }

  function continueDay() {
    state.dayEvent = null;
    state.phase = 'map';
    if (state.votes.player >= 8 || state.votes.rival >= 8) finishGame();
    else render();
  }

  function finishGame() {
    clearMiniTimers();
    const playerWins = state.votes.player > state.votes.rival && state.votes.player >= 8;
    const draw = state.votes.player === state.votes.rival;
    let headline;
    let deck;
    if (playerWins && state.scandal < 15) {
      headline = 'NOVÁ TVÁŘ VYHRÁLA. OBEC ZATÍM NEVÍ, CO S TÍM';
      deck = 'Voliči zvolili změnu a okamžitě založili skupinu proti jejím prvním krokům.';
    } else if (playerWins) {
      headline = 'VÍTĚZSTVÍ S PACHUTÍ ŠANONU';
      deck = 'Mandát je silný. Vysvětlení některých fotografií slabší.';
    } else if (draw) {
      headline = 'PAT. ROZHODNE NEJPŘESVĚDČIVĚJŠÍ GULÁŠ';
      deck = 'Obě strany vyhlásily vítězství a objednaly stejný salonek.';
    } else {
      headline = 'VĚČNÝ ZŮSTÁVÁ VĚČNÝM';
      deck = 'Starosta poděkoval za férovou soutěž a nechal odstranit vaše plakáty ještě před výsledky.';
    }
    state.ending = { playerWins, headline, deck };
    state.phase = 'ending';
    persist();
    render();
  }

  function restart() {
    clearMiniTimers();
    state = createState(Date.now());
    render();
  }

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed.build !== BUILD) return false;
      state = parsed;
      state.phase = state.phase === 'mini' ? 'map' : state.phase;
      state.mini = null;
      render();
      return true;
    } catch { return false; }
  }

  function stat(label, value, suffix = '') {
    return `<div class="k200-stat"><span>${label}</span><strong>${value}${suffix}</strong></div>`;
  }

  function topbar() {
    const archetype = state.archetype ? ARCHETYPES[state.archetype] : null;
    return `<header class="k200-topbar">
      <div class="k200-brand"><b>K</b><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO <em>REBOOT v0.20</em></strong></div></div>
      <div class="k200-day">${state.phase === 'start' ? 'PŘEDVOLEBNÍ TICHO' : `DEN ${state.day}/${DAYS}`}</div>
      <div class="k200-stats">${stat('Hlasy', state.votes.player)}${stat('Věčný', state.votes.rival)}${stat('Kroky', state.moves)}${stat('Důvěra', state.trust, '%')}${stat('Průšvih', state.scandal, '%')}</div>
      <div class="k200-tools"><button data-action="save" ${state.phase === 'start' ? 'disabled' : ''}>Uložit</button><button data-action="load">Načíst</button><a href="?legacy=1">Archiv v0.17</a></div>
      ${archetype ? `<div class="k200-candidate">${archetype.emoji}<span>${archetype.name}</span></div>` : ''}
    </header>`;
  }

  function startView() {
    return `<main class="k200-start">
      <section class="k200-start-copy">
        <p class="k200-kicker">NOVÁ HRA · STARÁ OBEC</p>
        <h1>Patnáct voličů.<br>Šestnáct osobních sporů.</h1>
        <p>Proběhněte Dolní Vejprnice dřív než starosta Věčný. Mluvte s lidmi, vyhrajte trapné minihry, najděte šanon a hlavně se nenechte vyfotit u ničeho vysvětlitelného.</p>
        <div class="k200-promise"><span>🗺️ skutečný pohyb po obci</span><span>🎯 tři dovednostní minihry</span><span>🕴️ soupeř, který vám krade lidi před očima</span></div>
      </section>
      <section class="k200-archetypes">
        ${Object.entries(ARCHETYPES).map(([id, archetype]) => `<button class="k200-archetype" data-archetype="${id}"><span>${archetype.emoji}</span><strong>${archetype.name}</strong><p>${archetype.pitch}</p><small>${archetype.perk}</small></button>`).join('')}
      </section>
      <aside class="k200-start-poster"><div class="k200-poster-face">🐷</div><strong>VOLTE KORYTO</strong><span>Protože někdo to koryto stejně dostane.</span></aside>
    </main>`;
  }

  function tileContent(x, y) {
    const locationEntry = locationAt(x, y);
    const voter = voterAt(x, y);
    const item = itemAt(x, y);
    const isPlayer = state.player.x === x && state.player.y === y;
    const isRival = state.rival.x === x && state.rival.y === y;
    const classes = ['k200-tile'];
    if (OBSTACLES.has(keyOf(x, y))) classes.push('is-obstacle');
    else classes.push((x + y) % 2 ? 'is-road' : 'is-grass');
    if (adjacent(x, y) && passable(x, y) && state.phase === 'map' && state.moves > 0) classes.push('is-reachable');
    if (isPlayer) classes.push('has-player');
    if (isRival) classes.push('has-rival');
    const label = locationEntry ? locationEntry[1].name : voter ? 'Nerozhodnutý volič' : item ? ITEMS[item.id].name : `Pole ${x + 1}, ${y + 1}`;
    return `<button class="${classes.join(' ')}" data-x="${x}" data-y="${y}" aria-label="${label}" ${OBSTACLES.has(keyOf(x, y)) ? 'disabled' : ''}>
      ${locationEntry ? `<span class="k200-location">${locationEntry[1].icon}<small>${locationEntry[1].name.replace('Obecní ', '').replace('Hospoda ', '')}</small></span>` : ''}
      ${voter ? `<span class="k200-voter" title="Nerozhodnutý volič">${personaById(voter.persona).face}</span>` : ''}
      ${item ? `<span class="k200-item" title="${ITEMS[item.id].name}">${ITEMS[item.id].icon}</span>` : ''}
      ${isRival ? '<span class="k200-rival" title="Vladimír Věčný">🕴️</span>' : ''}
      ${isPlayer ? `<span class="k200-player" title="Vy">${ARCHETYPES[state.archetype].emoji}</span>` : ''}
    </button>`;
  }

  function board() {
    let tiles = '';
    for (let y = 0; y < HEIGHT; y += 1) for (let x = 0; x < WIDTH; x += 1) tiles += tileContent(x, y);
    return `<section class="k200-board-wrap"><div class="k200-map-label"><span>DOLNÍ VEJPRNICE</span><small>kurzor / WASD / kliknutí na sousední pole</small></div><div class="k200-board" role="grid">${tiles}</div></section>`;
  }

  function currentLocationPanel() {
    const entry = locationAt(state.player.x, state.player.y);
    if (!entry) return '';
    const [id, location] = entry;
    return `<div class="k200-location-card"><span>${location.icon}</span><div><strong>${location.name}</strong><p>${location.copy}</p></div><button data-location="${id}">Hrát minihru</button></div>`;
  }

  function mapView() {
    return `<main class="k200-game">${board()}<aside class="k200-sidebar">
      <section class="k200-objective"><p class="k200-kicker">VÁŠ ÚKOL</p><h2>Získejte 8 z 15 hlasů.</h2><div class="k200-vote-track"><i style="width:${state.votes.player / TOTAL_VOTERS * 100}%"></i><b style="left:${state.votes.rival / TOTAL_VOTERS * 100}%"></b></div><p>Vy ${state.votes.player} · Věčný ${state.votes.rival} · Nerozhodnutí ${state.votes.undecided}</p></section>
      ${state.toast ? `<div class="k200-toast">${state.toast}<button data-action="dismiss-toast">×</button></div>` : ''}
      ${currentLocationPanel()}
      <section class="k200-inventory"><h3>Co máte po kapsách</h3><div><span>📂 Šanon <b>${state.evidence}</b></span><button data-action="use-evidence" ${state.evidence <= 0 || state.votes.rival <= 0 || state.moves <= 0 ? 'disabled' : ''}>Vypustit na Věčného</button></div></section>
      <section class="k200-log"><h3>Obecní šeptanda</h3>${state.log.map((line) => `<p>${line}</p>`).join('')}</section>
    </aside></main>`;
  }

  function canvassView() {
    const persona = personaById(state.currentVoter?.persona);
    const options = [
      { id: 'order', icon: '🧹', label: 'Pořádek', copy: 'Pravidla, značky, zákazy a někdo, kdo za všechno může.' },
      { id: 'change', icon: '🔨', label: 'Změna', copy: 'Všechno předěláme. Podrobnosti po volbách.' },
      { id: 'calm', icon: '🌳', label: 'Klid', copy: 'Nic zásadního se nestane. To je také program.' }
    ];
    return `<main class="k200-dialogue"><section class="k200-resident"><div class="k200-resident-face">${persona.face}</div><p>„${persona.line}“</p></section><section><p class="k200-kicker">DVEŘE OD DVEŘÍ</p><h1>Co mu slíbíte?</h1><div class="k200-pitches">${options.map((option) => `<button data-pitch="${option.id}"><span>${option.icon}</span><strong>${option.label}</strong><small>${option.copy}</small></button>`).join('')}</div></section></main>`;
  }

  function timingMini() {
    const mini = state.mini;
    return `<div class="k200-mini-stage"><p class="k200-mini-instruction">Ukazatel se pohybuje. Zastavte ho v mosazné zóně. Přesný střed může získat dva hlasy.</p><div class="k200-timing"><div class="k200-timing-zone" style="left:${mini.zoneStart}%;width:${mini.zoneWidth}%"></div><i class="k200-timing-marker" style="left:${mini.pointer}%"></i></div>${mini.done ? `<div class="k200-mini-result">${mini.result}</div><button class="k200-primary" data-action="leave-mini">Zpátky do ulic</button>` : '<button class="k200-primary" data-action="stop-timing">PRONÉST POINTU</button>'}</div>`;
  }

  function memoryMini() {
    const mini = state.mini;
    const folders = ['📁', '🗂️', '📕', '📦'];
    return `<div class="k200-mini-stage"><p class="k200-mini-instruction">${mini.showing ? 'Zapamatujte si pořadí blikajících šanonů.' : mini.done ? 'Úřední proces byl ukončen.' : `Zopakujte pořadí: ${mini.input.length}/${mini.sequence.length}`}</p><div class="k200-folders">${folders.map((icon, index) => `<button data-folder="${index}" class="${mini.highlight === index ? 'is-flashing' : ''}" ${mini.showing || mini.done ? 'disabled' : ''}><span>${icon}</span><small>${['Dotace', 'Pergoly', 'Tajemné', 'Nespalovat'][index]}</small></button>`).join('')}</div>${mini.done ? `<div class="k200-mini-result">${mini.result}</div><button class="k200-primary" data-action="leave-mini">Zpátky do ulic</button>` : ''}</div>`;
  }

  function posterMini() {
    const mini = state.mini;
    return `<div class="k200-mini-stage"><p class="k200-mini-instruction">Klikněte na šest prázdných ploch dřív, než je obsadí Věčný. Zásahy: ${mini.hits}/6</p><div class="k200-poster-wall">${mini.done ? '' : `<button class="k200-poster-target" data-action="poster-hit" style="left:${mini.target.x}%;top:${mini.target.y}%">＋</button>`}<span class="k200-old-poster one">VOLTE VĚČNÉHO<br><small>už víte proč</small></span><span class="k200-old-poster two">NOVÁ LAVIČKA<br><small>stejný dodavatel</small></span></div>${mini.done ? `<div class="k200-mini-result">${mini.result}</div><button class="k200-primary" data-action="leave-mini">Zpátky do ulic</button>` : ''}</div>`;
  }

  function miniStage() {
    if (!state.mini) return '';
    if (state.mini.type === 'timing') return timingMini();
    if (state.mini.type === 'memory') return memoryMini();
    return posterMini();
  }

  function miniView() {
    const location = LOCATIONS[state.mini.locationId];
    return `<main class="k200-mini"><header><span>${location.icon}</span><div><p class="k200-kicker">MINIHRA</p><h1>${location.name}</h1><p>${location.copy}</p></div></header>${miniStage()}</main>`;
  }

  function dayEventView() {
    return `<main class="k200-breaking"><section><p class="k200-kicker">MIMOŘÁDNÁ OBECNÍ UDÁLOST</p><h1>${state.dayEvent.title}</h1><p>${state.dayEvent.text}</p><div class="k200-breaking-stamp">SDÍLENO 47×<br>OVĚŘENO 0×</div><button class="k200-primary" data-action="continue-day">Pokračovat do dne ${state.day}</button></section></main>`;
  }

  function endingView() {
    return `<main class="k200-ending"><section class="k200-newspaper"><header><span>VEJPRNICKÝ DENÍK</span><small>Nezávislý na faktech od roku 1993</small></header><p class="k200-kicker">VOLEBNÍ SPECIÁL</p><h1>${state.ending.headline}</h1><p class="k200-deck">${state.ending.deck}</p><div class="k200-score"><div><span>Vy</span><strong>${state.votes.player}</strong></div><div><span>Věčný</span><strong>${state.votes.rival}</strong></div><div><span>Důvěra</span><strong>${state.trust}%</strong></div><div><span>Průšvih</span><strong>${state.scandal}%</strong></div></div><blockquote>„Výsledek respektujeme. Samozřejmě podáme námitku.“ — oba volební štáby</blockquote><div class="k200-ending-actions"><button class="k200-primary" data-action="restart">Nová kampaň</button><a href="?legacy=1">Otevřít archiv původní hry</a></div></section></main>`;
  }

  function content() {
    if (state.phase === 'start') return startView();
    if (state.phase === 'canvass') return canvassView();
    if (state.phase === 'mini') return miniView();
    if (state.phase === 'dayevent') return dayEventView();
    if (state.phase === 'ending') return endingView();
    return mapView();
  }

  function render() {
    root.innerHTML = `${topbar()}${content()}<footer class="k200-footer"><span>Fiktivní obec. Skutečně podezřelé sliby.</span><span>Build ${BUILD}</span></footer>`;
    bind();
  }

  function bind() {
    root.querySelectorAll('[data-archetype]').forEach((button) => button.addEventListener('click', () => openStart(button.dataset.archetype)));
    root.querySelectorAll('[data-x][data-y]').forEach((button) => button.addEventListener('click', () => movePlayer(Number(button.dataset.x), Number(button.dataset.y))));
    root.querySelectorAll('[data-pitch]').forEach((button) => button.addEventListener('click', () => answerVoter(button.dataset.pitch)));
    root.querySelectorAll('[data-location]').forEach((button) => button.addEventListener('click', () => enterLocation(button.dataset.location)));
    root.querySelectorAll('[data-folder]').forEach((button) => button.addEventListener('click', () => memoryPick(Number(button.dataset.folder))));
    root.querySelector('[data-action="stop-timing"]')?.addEventListener('click', stopTiming);
    root.querySelector('[data-action="poster-hit"]')?.addEventListener('click', posterHit);
    root.querySelector('[data-action="leave-mini"]')?.addEventListener('click', leaveMini);
    root.querySelector('[data-action="use-evidence"]')?.addEventListener('click', useEvidence);
    root.querySelector('[data-action="continue-day"]')?.addEventListener('click', continueDay);
    root.querySelector('[data-action="restart"]')?.addEventListener('click', restart);
    root.querySelector('[data-action="dismiss-toast"]')?.addEventListener('click', () => { state.toast = null; render(); });
    root.querySelector('[data-action="save"]')?.addEventListener('click', () => { live.textContent = persist() ? 'Hra uložena.' : 'Uložení se nepodařilo.'; });
    root.querySelector('[data-action="load"]')?.addEventListener('click', () => { live.textContent = restore() ? 'Hra načtena.' : 'Uložená hra nebyla nalezena.'; });
  }

  function handleKey(event) {
    if (state.phase !== 'map') return;
    const key = event.key.toLowerCase();
    const directions = {
      arrowup: [0, -1], w: [0, -1],
      arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0],
      arrowright: [1, 0], d: [1, 0]
    };
    if (directions[key]) {
      event.preventDefault();
      directionMove(...directions[key]);
    }
  }

  function mount() {
    document.documentElement.classList.add('k200-active');
    document.querySelector('#app')?.setAttribute('aria-hidden', 'true');
    document.querySelector('#diceOverlay')?.setAttribute('aria-hidden', 'true');
    root = document.createElement('div');
    root.id = 'k200Root';
    root.className = 'k200-root';
    live = document.createElement('div');
    live.className = 'k200-sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.prepend(live);
    document.body.prepend(root);
    window.addEventListener('keydown', handleKey);
    render();
  }

  window.KorytoReboot = Object.freeze({
    BUILD,
    SAVE_KEY,
    WIDTH,
    HEIGHT,
    TOTAL_VOTERS,
    ARCHETYPES: copy(ARCHETYPES),
    LOCATIONS: copy(LOCATIONS),
    getState: () => copy(state),
    move: directionMove,
    choose: openStart,
    useEvidence,
    restart,
    forceFinish: finishGame
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
