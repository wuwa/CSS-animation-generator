export const presets = [
  { id: "move-in", label: "MoveIn", base: "move", inOut: "in" },
  { id: "move-out", label: "MoveOut", base: "move", inOut: "out" },
  { id: "scale-in", label: "ScaleIn", base: "scale", inOut: "in" },
  { id: "scale-out", label: "ScaleOut", base: "scale", inOut: "out" },
  { id: "grow", label: "Grow", base: "grow", inOut: "in" },
  { id: "shrink", label: "Shrink", base: "shrink", inOut: "out" },
  { id: "shake", label: "Shake", base: "shake", inOut: "in" },
  { id: "bounce", label: "Bounce", base: "bounce", inOut: "in" },
  { id: "pop", label: "Pop", base: "pop", inOut: "in" },
  { id: "pulse", label: "Pulse", base: "pulse", inOut: "in" },
];

export const directions = [
  { id: "left", label: "←" },
  { id: "right", label: "→" },
  { id: "down", label: "↓" },
  { id: "up", label: "↑" },
  { id: "center", label: "•" },
];

export const speeds = [
  { id: "fast", label: "fast", seconds: 0.3 },
  { id: "medium", label: "medium", seconds: 0.6 },
  { id: "slow", label: "slow", seconds: 1 },
  { id: "custom", label: "custom", seconds: 2 },
];

const directionVectors = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
  center: [0, 0],
};

function flipDirection(direction) {
  switch (direction) {
    case "left":
      return "right";
    case "right":
      return "left";
    case "up":
      return "down";
    case "down":
      return "up";
    default:
      return "center";
  }
}

function effectiveDirection(direction, inOut) {
  return inOut === "in" ? flipDirection(direction) : direction;
}

const OPACITY_IN_START = "var(--start-end-opacity)";
const OPACITY_IN_END = 1;
const OPACITY_OUT_START = 1;
const OPACITY_OUT_END = 0;
const OPACITY_OUT_END_VAR = "var(--start-end-opacity)";
const SCALE_OUT_END = 0;

function readSharedNumbers() {
  const styles = getComputedStyle(document.documentElement);
  const toNumber = (name, fallback) => {
    const parsed = parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    startEndPosition: toNumber("--start-end-position", 60),
    startEndScale: toNumber("--start-end-scale", 0.75),
  };
}

function translate(direction, distance) {
  const [dx, dy] = directionVectors[direction] || [1, 0];
  const x = dx * distance;
  const y = dy * distance;
  return `translate(${x}px, ${y}px)`;
}

function moveKeyframes(direction, inOut) {
  const dir = effectiveDirection(direction, inOut);
  const { startEndPosition } = readSharedNumbers();
  const delta = translate(dir, startEndPosition);
  const from = inOut === "in" ? delta : "translate(0, 0)";
  const to = inOut === "in" ? "translate(0, 0)" : delta;
  const endOpacity = inOut === "in" ? OPACITY_IN_END : OPACITY_OUT_END_VAR;
  return `
@keyframes demo-move-${direction}-${inOut} {
  0% { transform: ${from}; opacity: ${inOut === "in" ? OPACITY_IN_START : OPACITY_OUT_START}; }
  100% { transform: ${to}; opacity: ${endOpacity}; }
}`;
}

function scaleKeyframes(direction, inOut) {
  const dir = effectiveDirection(direction, inOut);
  const { startEndScale, startEndPosition } = readSharedNumbers();
  const delta = translate(dir, startEndPosition);
  const base = "translate(0, 0)";
  const fromTranslate = inOut === "in" ? delta : base;
  const toTranslate = inOut === "in" ? base : delta;
  const fromScale = inOut === "in" ? startEndScale : 1;
  const toScale = inOut === "in" ? 1 : startEndScale;
  const fromOpacity = inOut === "in" ? OPACITY_IN_START : OPACITY_OUT_START;
  const toOpacity = inOut === "in" ? OPACITY_IN_END : OPACITY_OUT_END_VAR;
  return `
@keyframes demo-scale-${direction}-${inOut} {
  0% { transform: ${fromTranslate} scale(${fromScale}); opacity: ${fromOpacity}; }
  100% { transform: ${toTranslate} scale(${toScale}); opacity: ${toOpacity}; }
}`;
}

function fadeKeyframes(inOut) {
  const from = inOut === "in" ? OPACITY_IN_START : OPACITY_OUT_START;
  const to = inOut === "in" ? OPACITY_IN_END : OPACITY_OUT_END;
  return `
@keyframes demo-fade-${inOut} {
  0% { opacity: ${from}; }
  100% { opacity: ${to}; }
}`;
}

function collapseOrigin(direction) {
  switch (direction) {
    case "left":
      return "left center";
    case "right":
      return "right center";
    case "up":
      return "center top";
    case "down":
      return "center bottom";
    default:
      return "center center";
  }
}

function collapseKeyframes(presetId, direction, inOut) {
  const dir = effectiveDirection(direction, inOut);
  const isHorizontal = dir === "left" || dir === "right";
  const axis = isHorizontal ? "scaleX" : "scaleY";
  const from = inOut === "in" ? 0 : 1;
  const to = inOut === "in" ? 1 : SCALE_OUT_END;
  const origin = collapseOrigin(dir);
  return `
@keyframes demo-${presetId}-${direction}-${inOut} {
  0% { transform: ${axis}(${from}); opacity: ${inOut === "in" ? 0 : OPACITY_OUT_START}; transform-origin: ${origin}; }
  100% { transform: ${axis}(${to}); opacity: ${inOut === "in" ? OPACITY_IN_END : OPACITY_OUT_END}; transform-origin: ${origin}; }
}`;
}

function nudgeKeyframes(direction, inOut) {
  const dir = effectiveDirection(direction, inOut);
  const isVertical = dir === "up" || dir === "down";
  const signBase = dir === "left" || dir === "up" ? -1 : 1;
  const distance = "var(--bounce-nudge-distance)";
  const factors = [
    { pct: "0%", val: 0, rot: 0 },
    { pct: "15%", val: -1, rot: -1 },
    { pct: "30%", val: 0.9, rot: 0.5 },
    { pct: "45%", val: -0.7, rot: -0.5 },
    { pct: "60%", val: 0.5, rot: 0.3 },
    { pct: "75%", val: -0.2, rot: 0 },
    { pct: "100%", val: 0, rot: 0 },
  ];

  const dist = (factor) => {
    if (factor === 0) return "0";
    const effective = dir === "center" ? factor * 0.5 : factor * signBase;
    return `calc(${distance} * ${effective})`;
  };

  const transforms = factors
    .map(({ pct, val, rot }) => {
      const tx = isVertical ? "0" : dist(val);
      const ty = isVertical ? dist(val) : "0";
      return `  ${pct} { transform: translate3d(${tx}, ${ty}, 0) rotate(${rot}deg); }`;
    })
    .join("\n");

  return `
@keyframes demo-shake-${direction}-${inOut} {
${transforms}
}`;
}

function pulseKeyframes() {
  return `
@keyframes demo-pulse-in {
    0% {
        box-shadow: 0 0 0 0 rgba(32, 103, 218, 0.7);
    }

    100% {
        box-shadow: 0 0 0 10px rgba(32, 103, 218, 0);
    }
}`;
}

function popKeyframes(direction) {
  return `
@keyframes demo-pop-${direction}-in {
  0% { transform: scale(1); }
  16% { transform: scale(0.7); }
  28% { transform: scale(1.13); }
  44% { transform: scale(0.95); }
  59% { transform: scale(1.02); }
  73% { transform: scale(0.99); }
  100% { transform: scale(1); }
}`;
}

function bounceOffset(direction) {
  switch (direction) {
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    default:
      return { x: 0, y: -0.5 };
  }
}

function bounceKeyframes(direction) {
  const dir = effectiveDirection(direction, "in");
  const { x, y } = bounceOffset(dir);
  const distance = "var(--bounce-nudge-distance)";
  const dx = x === 0 ? "0" : x === 1 ? distance : `calc(${distance} * -1)`;
  const dy =
    y === 0
      ? "0"
      : y === 1
      ? distance
      : y === -0.5
      ? `calc(${distance} * -0.5)`
      : y === 0.5
      ? `calc(${distance} * 0.5)`
      : `calc(${distance} * -1)`;
  const mid = `translate(${dx}, ${dy})`;
  return `
@keyframes demo-bounce-${direction}-in {
  0%, 100% {
    transform: translate(0, 0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  50% {
    transform: ${mid};
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
}`;
}

export function keyframesForPreset(presetId, direction, inOut) {
  switch (presetId) {
    case "move":
      return moveKeyframes(direction, inOut);
    case "scale":
      return scaleKeyframes(direction, inOut);
    case "grow":
    case "shrink":
      return collapseKeyframes(presetId, direction, inOut);
    case "shake":
      return nudgeKeyframes(direction, inOut);
    case "bounce":
      return bounceKeyframes(direction);
    case "pop":
      return popKeyframes(direction);
    case "pulse":
      return pulseKeyframes();
    default:
      return fadeKeyframes(inOut);
  }
}

export function animationName(presetId, direction, inOut) {
  if (
    presetId === "move" ||
    presetId === "shake" ||
    presetId === "scale" ||
    presetId === "grow" ||
    presetId === "shrink" ||
    presetId === "bounce" ||
    presetId === "pop"
  ) {
    return `demo-${presetId}-${direction}-${inOut}`;
  }
  return `demo-${presetId}-${inOut}`;
}

export function easingForPreset(presetId, inOut) {
  const isIn = inOut === "in";
  if (presetId === "move" || presetId === "scale" || presetId === "grow" || presetId === "shrink") {
    return isIn ? "var(--ease-out-quart)" : "var(--ease-in-quart)";
  }
  if (presetId === "pop" || presetId === "pulse") {
    return "var(--ease-out-quart)";
  }
  if (presetId === "shake" || presetId === "bounce") {
    return "var(--ease-inout-back)";
  }
  return isIn ? "var(--ease-out-quart)" : "var(--ease-in-quart)";
}

export function defaultSpeedValue() {
  return speeds.find((s) => s.id === "medium").seconds;
}

export function getPresetConfig(id) {
  return presets.find((p) => p.id === id);
}
