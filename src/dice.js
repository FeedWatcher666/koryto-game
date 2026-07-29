import {ATTRIBUTES, COMPANIONS} from "./data.js";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let audioContext = null;

function attributeLabel(attributeId) {
  return ATTRIBUTES.find(([id]) => id === attributeId)?.[1] || attributeId;
}

function companionReaction(state, result) {
  const companionId = state.party.active;
  if (!companionId) {
    if (result.roll === 20) return "Obecní cedule se poprvé shodnou. Podezřelé, ale užitečné.";
    if (result.roll === 1) return "Zastávka mlčí. Zatím nejspolehlivější místní instituce.";
    return "Někde v dálce štěkne pes, který má zjevně lepší přehled o územním plánu.";
  }

  const reactions = {
    marie: {
      critical: "Tohle si nechám potvrdit dvakrát. Jednou pro nás a jednou pro případné vyšetřování.",
      success: "Správně. Teď ještě kopii pro případ, že originál administrativně zmizí.",
      costly: "Tohle projde. A přesně proto je mi z toho trochu špatně.",
      complication: "Říkala jsem, že příloha B není dekorace. Teď už to ví i podatelna."
    },
    bohumil: {
      critical: "Tak tohle bude večer první runda zdarma. Druhá už je koaliční jednání.",
      success: "Dobré. Nikdo se neurazil natolik, aby přestal chodit na pivo.",
      costly: "Vyřízeno. Jen jsem právě slíbil salonek lidem, které nemáme rádi.",
      complication: "Tohle se do rána rozkřikne. Naštěstí každý přidá jinou verzi."
    }
  };

  return reactions[companionId]?.[result.level] || `${COMPANIONS[companionId]?.name || "Společník"} si výsledek zapisuje pro pozdější hádku.`;
}

function impactLine(result) {
  if (result.roll === 20) return "Obec nečekaně spolupracuje.";
  if (result.roll === 1) return "Tohle už někdo nahlásil.";
  if (result.level === "success") return "Plán drží. Zatím i bez izolepy.";
  if (result.level === "costly") return "Dveře se otevřely. Účet zůstal za nimi.";
  return "Neuspěli jste správným směrem.";
}

export function createDicePresentation(state, choice, result) {
  return {
    checkLabel: choice.label,
    attributeLabel: attributeLabel(choice.attribute),
    formula: `d20 + ${result.visibleModifier} proti ${result.dc}`,
    modifiers: result.modifierBreakdown || [],
    impactLine: impactLine(result),
    reaction: companionReaction(state, result),
    companionName: state.party.active ? COMPANIONS[state.party.active]?.name : "Dolní Vejprnice",
    companionIcon: state.party.active ? COMPANIONS[state.party.active]?.icon : "📍"
  };
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) return null;
  try {
    audioContext = new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

function tone(context, frequency, start, duration, volume = 0.025, type = "triangle") {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playRollingSound() {
  const context = getAudioContext();
  if (!context) return;
  context.resume?.().catch(() => {});
  const start = context.currentTime;
  [190, 230, 170, 260, 210, 290, 240].forEach((frequency, index) => {
    tone(context, frequency, start + index * 0.105, 0.055, 0.018, "square");
  });
}

function playLandingSound(result) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  if (result.roll === 20) {
    [523, 659, 784].forEach((frequency, index) => tone(context, frequency, start + index * 0.055, 0.28, 0.035));
  } else if (result.roll === 1) {
    tone(context, 120, start, 0.35, 0.04, "sawtooth");
    tone(context, 78, start + 0.07, 0.42, 0.035, "square");
  } else {
    tone(context, result.level === "complication" ? 145 : 245, start, 0.24, 0.03);
  }
}

function overlayMarkup(presentation) {
  const modifiers = presentation.modifiers.map(item => `<span>${item.label} <b>+${item.value}</b></span>`).join("");
  return `<section class="dice-overlay is-rolling" role="dialog" aria-modal="true" aria-label="Hod kostkou">
    <div class="dice-backdrop-sigil" aria-hidden="true">K</div>
    <div class="dice-stage">
      <p class="eyebrow dice-kicker">D20 ZKOUŠKA</p>
      <h2>${presentation.checkLabel}</h2>
      <div class="dice-check-meta">
        <span>${presentation.attributeLabel}</span>
        <strong>${presentation.formula}</strong>
      </div>
      <div class="dice-modifiers" aria-label="Známé bonusy">${modifiers}</div>
      <div class="dice-perspective" aria-hidden="true">
        <div class="dice-polyhedron">
          <div class="dice-facets"></div>
          <strong class="dice-number">?</strong>
        </div>
      </div>
      <div class="dice-status" aria-live="assertive">
        <strong>Hází se…</strong>
        <span>Kostka zvažuje váš životopis a místní vazby.</span>
      </div>
      <blockquote class="dice-reaction" hidden>
        <b>${presentation.companionIcon}</b>
        <div><strong>${presentation.companionName}</strong><span>${presentation.reaction}</span></div>
      </blockquote>
      <button type="button" class="dice-skip" data-dice-skip>Přeskočit animaci</button>
    </div>
  </section>`;
}

export async function playD20Roll({root = document.body, state, choice, result}) {
  const presentation = createDicePresentation(state, choice, result);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = overlayMarkup(presentation).trim();
  const overlay = wrapper.firstElementChild;
  root.append(overlay);
  document.documentElement.classList.add("dice-lock");

  const number = overlay.querySelector(".dice-number");
  const statusTitle = overlay.querySelector(".dice-status strong");
  const statusCopy = overlay.querySelector(".dice-status span");
  const reaction = overlay.querySelector(".dice-reaction");
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const spinDuration = reducedMotion ? 180 : 1050;
  let skipped = false;
  let tickIndex = 0;
  const tickValues = [3, 17, 8, 12, 2, 19, 6, 14, 4, 18, 9, 11, 5, 16, 7, 13];
  const ticker = setInterval(() => {
    number.textContent = tickValues[tickIndex % tickValues.length];
    tickIndex += 1;
  }, reducedMotion ? 45 : 68);

  const skip = () => { skipped = true; };
  overlay.querySelector("[data-dice-skip]")?.addEventListener("click", skip, {once: true});
  playRollingSound();

  const started = performance.now();
  while (!skipped && performance.now() - started < spinDuration) await wait(32);
  clearInterval(ticker);

  number.textContent = result.roll;
  overlay.classList.remove("is-rolling");
  overlay.classList.add("is-landed", `tone-${result.outcome.tone}`);
  if (result.roll === 20) overlay.classList.add("is-critical");
  if (result.roll === 1) overlay.classList.add("is-fumble");
  statusTitle.textContent = result.outcome.label;
  statusCopy.textContent = presentation.impactLine;
  reaction.hidden = false;
  overlay.querySelector(".dice-skip")?.remove();
  playLandingSound(result);
  globalThis.navigator?.vibrate?.(result.roll === 20 ? [20, 35, 45] : result.roll === 1 ? [80, 30, 80] : 25);

  await wait(reducedMotion || skipped ? 260 : 900);
  overlay.classList.add("is-exiting");
  await wait(reducedMotion ? 80 : 240);
  overlay.remove();
  document.documentElement.classList.remove("dice-lock");
  return presentation;
}
