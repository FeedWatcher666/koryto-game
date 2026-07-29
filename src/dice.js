import {ATTRIBUTES, COMPANIONS} from "./data.js";
import {createIcosahedronRenderer} from "./dice-physics.js";

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
    if (result.rollMode === "advantage") return "Dvě kostky. Obec tomu říká pluralita názorů, dokud vyhraje ta správná.";
    if (result.rollMode === "disadvantage") return "Dvě kostky a započítá se horší. Konečně model odpovídající místní správě.";
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

function rollModeExplanation(result) {
  if (result.rollMode === "advantage") return `Výhoda: hází se dvakrát a zůstává vyšší výsledek ${result.roll}.`;
  if (result.rollMode === "disadvantage") return `Nevýhoda: hází se dvakrát a zůstává nižší výsledek ${result.roll}.`;
  if (result.cancelledRollModes) return "Výhoda a nevýhoda se navzájem zrušily. Hází se jednou.";
  return "Běžný hod jednou kostkou.";
}

export function createDicePresentation(state, choice, result) {
  const modeSources = result.rollMode === "advantage"
    ? result.advantageSources
    : result.rollMode === "disadvantage"
      ? result.disadvantageSources
      : result.cancelledRollModes
        ? [...result.advantageSources, ...result.disadvantageSources]
        : [];
  return {
    checkLabel: choice.label,
    attributeLabel: attributeLabel(choice.attribute),
    formula: `${result.rollNotation} + ${result.visibleModifier} proti ${result.dc}`,
    modifiers: result.modifierBreakdown || [],
    rollModeLabel: result.rollModeLabel,
    rollModeExplanation: rollModeExplanation(result),
    modeSources,
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

function noiseHit(context, start, duration, volume) {
  const length = Math.max(1, Math.round(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const decay = 1 - index / length;
    data[index] = (Math.random() * 2 - 1) * decay * decay;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(760, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(start);
}

function playThrowSequence(diceCount, reducedMotion) {
  const context = getAudioContext();
  if (!context) return;
  context.resume?.().catch(() => {});
  const start = context.currentTime;
  const multiplier = diceCount > 1 ? 1.18 : 1;
  [210, 278, 184, 326, 242, 302].forEach((frequency, index) => {
    tone(context, frequency, start + index * 0.085, 0.045, 0.012 * multiplier, index % 2 ? "triangle" : "square");
  });
  if (reducedMotion) return;
  noiseHit(context, start + 0.49, 0.12, 0.036 * multiplier);
  tone(context, 112, start + 0.49, 0.16, 0.04 * multiplier, "sine");
  noiseHit(context, start + 0.82, 0.09, 0.021 * multiplier);
  tone(context, 156, start + 0.82, 0.11, 0.025 * multiplier, "triangle");
  noiseHit(context, start + 1.05, 0.055, 0.013 * multiplier);
}

function playResultSting(result) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + 0.04;
  if (result.roll === 20) {
    [523, 659, 784].forEach((frequency, index) => tone(context, frequency, start + index * 0.07, 0.3, 0.032));
  } else if (result.roll === 1) {
    tone(context, 118, start, 0.38, 0.04, "sawtooth");
    tone(context, 74, start + 0.09, 0.45, 0.032, "square");
  } else {
    tone(context, result.level === "complication" ? 145 : 245, start, 0.24, 0.026);
  }
}

function dieMarkup(index) {
  return `<div class="dice-unit" data-die-index="${index}">
    <div class="dice-perspective">
      <canvas class="dice-canvas" data-d20-renderer="icosahedron" data-d20-face-labels="true"></canvas>
    </div>
    <strong class="dice-readout">?</strong>
    <span class="dice-selection"></span>
  </div>`;
}

function overlayMarkup(presentation, result) {
  const modifiers = presentation.modifiers.map(item => `<span>${item.label} <b>+${item.value}</b></span>`).join("");
  const sources = presentation.modeSources.map(source => `<li>${source}</li>`).join("");
  const multi = result.rolls.length > 1;
  return `<section class="dice-overlay is-rolling mode-${result.rollMode}" role="dialog" aria-modal="true" aria-label="Hod kostkou">
    <div class="dice-backdrop-sigil" aria-hidden="true">K</div>
    <div class="dice-stage">
      <p class="eyebrow dice-kicker">D20 ZKOUŠKA</p>
      <h2>${presentation.checkLabel}</h2>
      <div class="dice-check-meta">
        <span>${presentation.attributeLabel}</span>
        <strong>${presentation.formula}</strong>
      </div>
      <div class="roll-mode-banner mode-${result.rollMode}">
        <strong>${presentation.rollModeLabel}</strong>
        <span>${multi ? (result.rollMode === "advantage" ? "2d20 · ponechat vyšší" : "2d20 · ponechat nižší") : "1d20"}</span>
      </div>
      ${sources ? `<ul class="roll-mode-sources">${sources}</ul>` : ""}
      <div class="dice-modifiers" aria-label="Známé bonusy">${modifiers}</div>
      <div class="dice-rack ${multi ? "is-multi" : "is-single"}">${result.rolls.map((_, index) => dieMarkup(index)).join("")}</div>
      <div class="dice-status" aria-live="assertive">
        <strong>Hází se…</strong>
        <span>${multi ? "Obě kostky mají hlas. Jen jedna bude započítána." : "Kostka zvažuje váš životopis a místní vazby."}</span>
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
  wrapper.innerHTML = overlayMarkup(presentation, result).trim();
  const overlay = wrapper.firstElementChild;
  root.append(overlay);
  document.documentElement.classList.add("dice-lock");

  const units = [...overlay.querySelectorAll(".dice-unit")];
  const readouts = units.map(unit => unit.querySelector(".dice-readout"));
  const statusTitle = overlay.querySelector(".dice-status strong");
  const statusCopy = overlay.querySelector(".dice-status span");
  const reaction = overlay.querySelector(".dice-reaction");
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const spinDuration = reducedMotion ? 180 : 1320;
  const renderers = units.map((unit, index) => createIcosahedronRenderer(
    unit.querySelector(".dice-canvas"),
    {...result, roll: result.rolls[index]},
    {reducedMotion, dieIndex: index, selected: true}
  ));
  let skipped = false;
  let tickIndex = 0;
  const tickValues = [3, 17, 8, 12, 2, 19, 6, 14, 4, 18, 9, 11, 5, 16, 7, 13];
  const ticker = setInterval(() => {
    readouts.forEach((readout, index) => {
      readout.textContent = tickValues[(tickIndex + index * 5) % tickValues.length];
    });
    tickIndex += 1;
  }, reducedMotion ? 45 : 72);

  const skip = () => { skipped = true; };
  overlay.querySelector("[data-dice-skip]")?.addEventListener("click", skip, {once: true});
  playThrowSequence(result.rolls.length, reducedMotion);

  const started = performance.now();
  while (!skipped && performance.now() - started < spinDuration) await wait(32);
  clearInterval(ticker);
  const landingDurations = renderers.map(renderer => renderer.land({instant: skipped}));
  await wait(Math.max(...landingDurations));

  units.forEach((unit, index) => {
    const kept = index === result.keptIndex;
    readouts[index].textContent = result.rolls[index];
    unit.classList.add(kept ? "is-kept" : "is-discarded");
    unit.querySelector(".dice-selection").textContent = result.rolls.length === 1 ? "Výsledek" : kept ? "Ponecháno" : "Vyřazeno";
    renderers[index].setSelected(kept);
  });

  overlay.classList.remove("is-rolling");
  overlay.classList.add("is-landed", `tone-${result.outcome.tone}`);
  if (result.roll === 20) overlay.classList.add("is-critical");
  if (result.roll === 1) overlay.classList.add("is-fumble");
  statusTitle.textContent = result.outcome.label;
  statusCopy.textContent = `${presentation.rollModeExplanation} ${presentation.impactLine}`;
  reaction.hidden = false;
  overlay.querySelector(".dice-skip")?.remove();
  playResultSting(result);
  globalThis.navigator?.vibrate?.(result.roll === 20 ? [20, 35, 45] : result.roll === 1 ? [80, 30, 80] : 25);

  await wait(reducedMotion || skipped ? 360 : 1180);
  overlay.classList.add("is-exiting");
  await wait(reducedMotion ? 80 : 240);
  renderers.forEach(renderer => renderer.stop());
  overlay.remove();
  document.documentElement.classList.remove("dice-lock");
  return presentation;
}
