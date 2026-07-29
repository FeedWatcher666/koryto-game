const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
];
const VERTEX_LENGTH = Math.hypot(...RAW_VERTICES[0]);
const VERTICES = RAW_VERTICES.map(([x, y, z]) => [x / VERTEX_LENGTH, y / VERTEX_LENGTH, z / VERTEX_LENGTH]);
const FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];
const FACE_NUMBERS = [20, 7, 14, 3, 11, 16, 5, 18, 9, 2, 13, 6, 17, 4, 15, 8, 19, 1, 12, 10];
const CAMERA = {x: 0, y: 0, z: -1};

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

function paletteFor(result, landed, selected) {
  if (!selected) return {hue: 25, saturation: 12, edge: "rgba(105, 84, 67, .62)", ink: "rgba(241, 225, 194, .5)"};
  if (!landed) return {hue: 14, saturation: 55, edge: "rgba(255, 221, 158, .78)", ink: "rgba(255, 244, 214, .88)"};
  if (result.roll === 20) return {hue: 43, saturation: 76, edge: "rgba(255, 244, 174, .95)", ink: "#fff7c6"};
  if (result.roll === 1) return {hue: 2, saturation: 70, edge: "rgba(255, 177, 143, .9)", ink: "#ffe4d7"};
  if (result.level === "success") return {hue: 126, saturation: 31, edge: "rgba(222, 244, 184, .82)", ink: "#f5ffe9"};
  if (result.level === "costly") return {hue: 31, saturation: 62, edge: "rgba(255, 222, 154, .86)", ink: "#fff3d0"};
  return {hue: 7, saturation: 55, edge: "rgba(255, 184, 151, .82)", ink: "#ffe9dd"};
}

function finalAnglesFor(roll, dieIndex) {
  const seed = roll * 0.731 + dieIndex * 1.913;
  return {
    x: 0.22 + (seed % 1.7),
    y: -0.76 + ((seed * 1.37) % 1.9),
    z: -0.26 + ((seed * 0.83) % 0.52)
  };
}

function flightPose(elapsed, dieIndex) {
  const t = clamp(elapsed / 1220, 0, 1);
  const side = dieIndex % 2 === 0 ? -1 : 1;
  const travelX = side * (-72 + 98 * t) + Math.sin(t * Math.PI * 5 + dieIndex) * (10 * (1 - t));
  let bounce = 0;
  if (t < 0.54) {
    const local = t / 0.54;
    bounce = -112 * Math.sin(local * Math.PI);
  } else if (t < 0.81) {
    const local = (t - 0.54) / 0.27;
    bounce = -48 * Math.sin(local * Math.PI);
  } else {
    const local = (t - 0.81) / 0.19;
    bounce = -16 * Math.sin(local * Math.PI);
  }
  const spinDecay = 1 - t * 0.36;
  return {
    x: 0.46 + elapsed * 0.0067 * spinDecay + dieIndex * 0.31,
    y: -0.18 + elapsed * 0.0084 * spinDecay + dieIndex * 0.23,
    z: 0.11 + elapsed * 0.0048 * spinDecay,
    bounce,
    travelX,
    scale: 0.9 + Math.sin(t * Math.PI * 5) * 0.035,
    landed: false,
    phase: t < 0.54 ? "flight" : t < 0.81 ? "first-bounce" : "second-bounce"
  };
}

function drawFaceNumber(context, points, text, color, emphasis = false) {
  const centerX = (points[0].x + points[1].x + points[2].x) / 3;
  const centerY = (points[0].y + points[1].y + points[2].y) / 3;
  const edgeLength = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  if (edgeLength < 22) return;
  let angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
  if (angle > Math.PI / 2) angle -= Math.PI;
  if (angle < -Math.PI / 2) angle += Math.PI;
  const size = clamp(edgeLength * (emphasis ? 0.34 : 0.26), emphasis ? 15 : 10, emphasis ? 34 : 22);
  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${size}px Georgia, serif`;
  context.lineWidth = Math.max(2, size * 0.13);
  context.strokeStyle = "rgba(31, 10, 5, .72)";
  context.strokeText(String(text), 0, 1);
  context.fillStyle = color;
  context.fillText(String(text), 0, 0);
  context.restore();
}

export function createIcosahedronRenderer(canvas, result, options = {}) {
  const context = canvas.getContext("2d");
  if (!context) return {land: () => 0, stop: () => {}, setSelected: () => {}};

  const reducedMotion = Boolean(options.reducedMotion);
  const dieIndex = options.dieIndex || 0;
  const cameraDistance = 4.25;
  const light = normalize({x: -0.48, y: -0.84, z: -1});
  const finalAngles = finalAnglesFor(result.roll, dieIndex);
  let selected = options.selected !== false;
  let width = 240;
  let height = 240;
  let frame = 0;
  let stopped = false;
  let mode = reducedMotion ? "settled" : "rolling";
  let startTime = performance.now();
  let landingTime = 0;
  let landingFrom = {...finalAngles, bounce: 0, travelX: 0};
  const landingDuration = reducedMotion ? 80 : 720;

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

  function currentPose(time) {
    if (mode === "rolling") return flightPose(time - startTime, dieIndex);
    if (mode === "landing") {
      const raw = clamp((time - landingTime) / landingDuration, 0, 1);
      const ease = 1 - Math.pow(1 - raw, 4);
      const wobble = Math.sin(raw * Math.PI * 4.5) * Math.pow(1 - raw, 1.7);
      const microBounce = -Math.abs(Math.sin(raw * Math.PI * 3)) * 16 * (1 - raw);
      if (raw >= 1) mode = "settled";
      return {
        x: landingFrom.x + (finalAngles.x - landingFrom.x) * ease + wobble * 0.18,
        y: landingFrom.y + (finalAngles.y - landingFrom.y) * ease - wobble * 0.23,
        z: landingFrom.z + (finalAngles.z - landingFrom.z) * ease + wobble * 0.11,
        bounce: microBounce,
        travelX: landingFrom.travelX * (1 - ease) + (dieIndex % 2 === 0 ? -7 : 7) * (1 - raw),
        scale: 0.94 + ease * 0.06 + Math.sin(raw * Math.PI) * 0.07,
        landed: raw > 0.7,
        phase: raw < 0.38 ? "impact" : raw < 0.78 ? "wobble" : "settle"
      };
    }
    return {...finalAngles, bounce: 0, travelX: 0, scale: 1, landed: true, phase: "settled"};
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
    const radius = Math.min(width, height) * 0.355 * pose.scale;
    const centerX = width / 2 + pose.travelX;
    const centerY = height / 2 + pose.bounce - 7;
    const heightFactor = clamp(1 - Math.abs(pose.bounce) / 125, 0.25, 1);

    context.save();
    context.filter = `blur(${5 + (1 - heightFactor) * 7}px)`;
    context.fillStyle = `rgba(20, 7, 3, ${0.5 * heightFactor})`;
    context.beginPath();
    context.ellipse(
      width / 2 + pose.travelX * 0.72 + 10,
      height * 0.84,
      radius * (0.7 + heightFactor * 0.2),
      radius * (0.09 + heightFactor * 0.08),
      -0.08,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();

    const rotated = VERTICES.map(vertex => rotateVertex(vertex, pose.x, pose.y, pose.z));
    const projected = rotated.map(vertex => project(vertex, radius, centerX, centerY));
    const faces = [];

    FACES.forEach((indices, faceIndex) => {
      const [a, b, c] = indices.map(index => rotated[index]);
      const normal = normalize(cross(subtract(b, a), subtract(c, a)));
      const center = {x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3};
      const toCamera = normalize({x: -center.x, y: -center.y, z: -cameraDistance - center.z});
      const cameraAmount = dot(normal, toCamera);
      if (cameraAmount <= 0) return;
      faces.push({indices, faceIndex, normal, center, cameraAmount});
    });

    faces.sort((first, second) => second.center.z - first.center.z);
    const frontFace = faces.reduce((best, face) => !best || dot(face.normal, CAMERA) > dot(best.normal, CAMERA) ? face : best, null);
    const palette = paletteFor(result, pose.landed, selected);
    let minLight = 1;
    let maxLight = 0;

    faces.forEach(face => {
      const points = face.indices.map(index => projected[index]);
      const lightAmount = clamp((dot(face.normal, light) + 1) / 2, 0, 1);
      minLight = Math.min(minLight, lightAmount);
      maxLight = Math.max(maxLight, lightAmount);
      const faceVariation = ((face.faceIndex * 17) % 11) - 5;
      const lightness = clamp((selected ? 22 : 30) + lightAmount * (selected ? 45 : 18) + faceVariation, 17, 74);
      const gradient = context.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y);
      gradient.addColorStop(0, `hsl(${palette.hue + 3} ${palette.saturation}% ${clamp(lightness + 5, 0, 100)}%)`);
      gradient.addColorStop(1, `hsl(${palette.hue - 3} ${palette.saturation}% ${clamp(lightness - 7, 0, 100)}%)`);
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      context.lineTo(points[1].x, points[1].y);
      context.lineTo(points[2].x, points[2].y);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();
      context.strokeStyle = palette.edge;
      context.lineWidth = Math.max(1.25, radius / 72);
      context.lineJoin = "round";
      context.stroke();

      context.save();
      context.globalAlpha = selected ? 0.12 : 0.05;
      context.fillStyle = "#fff3c9";
      for (let speck = 0; speck < 3; speck += 1) {
        const u = (((face.faceIndex + 3) * (speck + 5) * 17) % 71) / 100 + 0.08;
        const v = (((face.faceIndex + 7) * (speck + 2) * 13) % 61) / 100 + 0.08;
        const w = Math.max(0.05, 1 - u - v);
        const total = u + v + w;
        const sx = (points[0].x * u + points[1].x * v + points[2].x * w) / total;
        const sy = (points[0].y * u + points[1].y * v + points[2].y * w) / total;
        context.fillRect(sx, sy, 1.2, 1.2);
      }
      context.restore();

      const isFront = face === frontFace;
      const faceNumber = pose.landed && isFront ? result.roll : FACE_NUMBERS[face.faceIndex];
      drawFaceNumber(context, points, faceNumber, palette.ink, pose.landed && isFront && selected);
    });

    canvas.dataset.frameSignature = `${pose.x.toFixed(3)}:${pose.y.toFixed(3)}:${pose.travelX.toFixed(2)}:${pose.bounce.toFixed(2)}`;
    canvas.dataset.visibleFaceCount = String(faces.length);
    canvas.dataset.lightingRange = (maxLight - minLight).toFixed(3);
    canvas.dataset.faceLabels = "20";
    canvas.dataset.material = selected ? "worn-bakelite" : "discarded-bakelite";
    canvas.dataset.phase = pose.phase;
    frame = requestAnimationFrame(draw);
  }

  frame = requestAnimationFrame(draw);
  return {
    land({instant = false} = {}) {
      const now = performance.now();
      const pose = mode === "rolling" ? flightPose(now - startTime, dieIndex) : {...finalAngles, bounce: 0, travelX: 0};
      landingFrom = pose;
      landingTime = now;
      mode = instant || reducedMotion ? "settled" : "landing";
      return instant || reducedMotion ? 80 : landingDuration;
    },
    setSelected(value) {
      selected = Boolean(value);
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
    }
  };
}
