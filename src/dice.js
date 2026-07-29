import {ATTRIBUTES, COMPANIONS} from "./data.js";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
];
const VERTEX_LENGTH = Math.hypot(...RAW_VERTICES[0]);
const ICOSAHEDRON_VERTICES = RAW_VERTICES.map(([x, y, z]) => [x / VERTEX_LENGTH, y / VERTEX_LENGTH, z / VERTEX_LENGTH]);
const ICOSAHEDRON_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {x: vector.x / length, y: vector.y / length, z: vector.z / length};
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function rotateVertex(vertex, angleX, angleY, angleZ) {
  let [x, y, z] = vertex;
  const sinX = Math.sin(angleX), cosX = Math.cos(angleX);
  const sinY = Math.sin(angleY), cosY = Math.cos(angleY);
  const sinZ = Math.sin(angleZ), cosZ = Math.cos(angleZ);

  [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
  [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];
  [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];
  return {x, y, z};
}

function paletteFor(result, landed) {
  if (!landed) return {hue: 17, saturation: 62, edge: "rgba(255, 221, 158, .72)"};
  if (result.roll === 20) return {hue: 43, saturation: 78, edge: "rgba(255, 244, 174, .92)"};
  if (result.roll === 1) return {hue: 2, saturation: 72, edge: "rgba(255, 177, 143, .82)"};
  if (result.level === "success") return {hue: 126, saturation: 34, edge: "rgba(222, 244, 184, .75)"};
  if (result.level === "costly") return {hue: 31, saturation: 68, edge: "rgba(255, 222, 154, .8)"};
  return {hue: 7, saturation: 58, edge: "rgba(255, 184, 151, .78)"};
}

function createIcosahedronRenderer(canvas, result, reducedMotion) {
  const context = canvas.getContext("2d");
  if (!context) return {land: () => 0, stop: () => {}};

  const cameraDistance = 4.2;
  const light = normalize({x: -0.55, y: -0.8, z: -1});
  const finalAngles = result.roll === 20
    ? {x: 0.28, y: -0.42, z: 0.08}
    : result.roll === 1
      ? {x: -0.62, y: 0.76, z: -0.18}
      : {x: 0.38 + (result.roll % 4) * 0.13, y: -0.54 + (result.roll % 5) * 0.11, z: 0.12};
  let width = 240;
  let height = 240;
  let frame = 0;
  let stopped = false;
  let mode = reducedMotion ? "settled" : "rolling";
  let startTime = performance.now();
  let landingTime = 0;
  let landingFrom = {x: 0, y: 0, z: 0};
  const landingDuration = reducedMotion ? 80 : 540;

  function resize() {
    const rectangle = canvas.getBoundingClientRect();
    width = Math.max(1, rectangle.width || 240);
    height = Math.max(1, rectangle.height || 240);
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  function rollingAngles(time) {
    const seconds = (time - startTime) / 1000;
    return {
      x: 0.4 + seconds * 6.4,
      y: -0.2 + seconds * 8.1,
      z: 0.1 + seconds * 4.7
    };
  }

  function currentPose(time) {
    if (mode === "rolling") {
      const angles = rollingAngles(time);
      const bounce = -Math.abs(Math.sin((time - startTime) / 92)) * 15;
      const scale = 0.94 + Math.sin((time - startTime) / 118) * 0.045;
      return {...angles, bounce, scale, landed: false};
    }
    if (mode === "landing") {
      const raw = clamp((time - landingTime) / landingDuration, 0, 1);
      const ease = 1 - Math.pow(1 - raw, 3);
      const wobble = Math.sin(raw * Math.PI * 3) * (1 - raw);
      if (raw >= 1) mode = "settled";
      return {
        x: landingFrom.x + (finalAngles.x - landingFrom.x) * ease + wobble * 0.22,
        y: landingFrom.y + (finalAngles.y - landingFrom.y) * ease - wobble * 0.28,
        z: landingFrom.z + (finalAngles.z - landingFrom.z) * ease + wobble * 0.14,
        bounce: -34 * (1 - ease) + Math.sin(raw * Math.PI) * -18,
        scale: 0.92 + ease * 0.08 + Math.sin(raw * Math.PI) * 0.08,
        landed: raw > 0.62
      };
    }
    return {...finalAngles, bounce: 0, scale: 1, landed: true};
  }

  function project(vertex, radius, centerX, centerY) {
    const perspective = cameraDistance / (cameraDistance + vertex.z);
    return {
      x: centerX + vertex.x * radius * perspective,
      y: centerY + vertex.y * radius * perspective,
      z: vertex.z,
      perspective
    };
  }

  function draw(time) {
    if (stopped) return;
    resize();
    context.clearRect(0, 0, width, height);
    const pose = currentPose(time);
    const radius = Math.min(width, height) * 0.37 * pose.scale;
    const centerX = width / 2;
    const centerY = height / 2 + pose.bounce - 4;
    const shadowStrength = clamp(1 - Math.abs(pose.bounce) / 70, 0.35, 1);

    context.save();
    context.filter = "blur(7px)";
    context.fillStyle = `rgba(20, 7, 3, ${0.44 * shadowStrength})`;
    context.beginPath();
    context.ellipse(centerX, height * 0.84, radius * (0.72 + shadowStrength * 0.12), radius * 0.16 * shadowStrength, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const rotated = ICOSAHEDRON_VERTICES.map(vertex => rotateVertex(vertex, pose.x, pose.y, pose.z));
    const projected = rotated.map(vertex => project(vertex, radius, centerX, centerY));
    const faces = [];

    ICOSAHEDRON_FACES.forEach((indices, faceIndex) => {
      const [a, b, c] = indices.map(index => rotated[index]);
      const edgeA = subtract(b, a);
      const edgeB = subtract(c, a);
      const normal = normalize(cross(edgeA, edgeB));
      const center = {x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3};
      const toCamera = normalize({x: -center.x, y: -center.y, z: -cameraDistance - center.z});
      if (dot(normal, toCamera) <= 0) return;
      faces.push({indices, faceIndex, normal, center});
    });

    faces.sort((first, second) => second.center.z - first.center.z);
    const palette = paletteFor(result, pose.landed);
    faces.forEach(face => {
      const points = face.indices.map(index => projected[index]);
      const lightAmount = clamp((dot(face.normal, light) + 1) / 2, 0, 1);
      const faceVariation = ((face.faceIndex * 17) % 11) - 5;
      const lightness = clamp(25 + lightAmount * 42 + faceVariation, 19, 72);
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      context.lineTo(points[1].x, points[1].y);
      context.lineTo(points[2].x, points[2].y);
      context.closePath();
      context.fillStyle = `hsl(${palette.hue} ${palette.saturation}% ${lightness}%)`;
      context.fill();
      context.strokeStyle = palette.edge;
      context.lineWidth = Math.max(1.2, radius / 78);
      context.lineJoin = "round";
      context.stroke();

      if (lightAmount > 0.72) {
        context.save();
        context.globalAlpha = (lightAmount - 0.7) * 0.45;
        context.fillStyle = "#fff6cf";
        context.fill();
        context.restore();
      }
    });

    frame = requestAnimationFrame(draw);
  }

  frame = requestAnimationFrame(draw);
  return {
    land({instant = false} = {}) {
      const now = performance.now();
      landingFrom = mode === "rolling" ? rollingAngles(now) : finalAngles;
      landingTime = now;
      mode = instant || reducedMotion ? "settled" : "landing";
      return instant || reducedMotion ? 80 : landingDuration;
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
    }
  };
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
        <canvas class="dice-canvas" data-d20-renderer="icosahedron"></canvas>
        <strong class="dice-number">?</strong>
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
  const spinDuration = reducedMotion ? 180 : 1180;
  const renderer = createIcosahedronRenderer(overlay.querySelector(".dice-canvas"), result, reducedMotion);
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
  const landingDuration = renderer.land({instant: skipped});
  await wait(landingDuration);

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

  await wait(reducedMotion || skipped ? 300 : 900);
  overlay.classList.add("is-exiting");
  await wait(reducedMotion ? 80 : 240);
  renderer.stop();
  overlay.remove();
  document.documentElement.classList.remove("dice-lock");
  return presentation;
}
