import {
  presets,
  directions,
  speeds,
  keyframesForPreset,
  animationName,
  defaultSpeedValue,
  easingForPreset,
  getPresetConfig,
} from "./options.js";

const presetContainer = document.querySelector("#preset-options");
const directionContainer = document.querySelector("#direction-options");
const speedContainer = document.querySelector("#speed-options");
const speedSlider = document.querySelector("#speed-slider");
const speedNumber = document.querySelector("#speed-number");
const previewSelect = document.querySelector("#preview-object");
const driftRange = document.querySelector("#start-end-position-range");
const driftInput = document.querySelector("#start-end-position-input");
const scaleRange = document.querySelector("#start-end-scale-range");
const scaleInput = document.querySelector("#start-end-scale-input");
const opacityRange = document.querySelector("#start-end-opacity-range");
const opacityInput = document.querySelector("#start-end-opacity-input");
const previewBox = document.querySelector("#preview-box");
const cssSnippet = document.querySelector("#css-snippet");
const copyButton = document.querySelector("#copy-css");
const replayButton = document.querySelector("#replay");
let activeAnimation = { base: null, inOut: null };

const dynamicStyle = document.createElement("style");
dynamicStyle.id = "dynamic-animations";
document.head.appendChild(dynamicStyle);

const state = {
  preset: "move-in",
  direction: "left",
  speedId: "fast",
  customSpeed: defaultSpeedValue(),
  previewObject: "box",
};

function renderGroup(container, options) {
  if (!container) return;
  container.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-button";
    btn.dataset.id = opt.id;
    btn.textContent = opt.label;
    container.appendChild(btn);
  });
}

function setActive(container, activeId) {
  if (!container) return;
  [...container.querySelectorAll("button")].forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.id === activeId);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveDuration() {
  if (state.speedId === "custom") {
    return state.customSpeed;
  }
  const speed = speeds.find((s) => s.id === state.speedId);
  return speed ? speed.seconds : defaultSpeedValue();
}

function rebuildAnimation() {
  const config = getPresetConfig(state.preset) ?? presets[0];
  const base = config?.base ?? "move";
  const inOut = config?.inOut ?? "in";
  const baseDuration = resolveDuration();
  const duration = base === "pulse" ? baseDuration * 2 : baseDuration;
  const name = animationName(base, state.direction, inOut);
  const keyframes = keyframesForPreset(base, state.direction, inOut);
  const easing = easingForPreset(base, inOut);
  const iterations = base === "bounce" ? "infinite" : base === "pulse" ? 3 : 1;

  dynamicStyle.textContent = keyframes;
  previewBox.style.display = "";
  previewBox.style.animation = "none";
  // Force reflow to restart animation
  // eslint-disable-next-line no-unused-expressions
  previewBox.offsetHeight;
  previewBox.style.animation = `${name} ${duration}s ${easing} ${iterations} both`;

  const snippet = `.preview-box {\n  animation: ${name} ${duration}s ${easing} ${iterations} both;\n}\n${keyframes}`;
  cssSnippet.textContent = snippet.trim();
  activeAnimation = { base, inOut };
}

function renderPreviewObject() {
  previewBox.className = "preview-box";
  previewBox.innerHTML = "";

  if (state.previewObject === "button") {
    previewBox.classList.add("is-button");
    previewBox.innerHTML = `<span class="icon-dot">+</span><span>Book this Hotel</span>`;
  } else if (state.previewObject === "input") {
    previewBox.classList.add("is-input");
    const wrap = document.createElement("div");
    wrap.className = "preview-input-wrap";
    wrap.innerHTML = `<label for="preview-input-field">Label</label><input id="preview-input-field" type="text" placeholder="Type here" />`;
    previewBox.appendChild(wrap);
  } else if (state.previewObject === "notification") {
    previewBox.classList.add("is-notification");
    previewBox.innerHTML = `<div class="notification-icon">✓</div>
    <div class="notification-text">
      <strong>Exclusive deals on great hotels.</strong>
      <span>The world leader in online travel & related services. Great savings on hotels.</span>
    </div>`;
  }
}

function handleOptionClick(container, handler) {
  if (!container) return;
  container.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.id;
    if (!id) return;
    handler(id);
    setActive(container, id);
    rebuildAnimation();
  });
}

function initOptions() {
  renderGroup(presetContainer, presets);
  renderGroup(directionContainer, directions);
  renderGroup(speedContainer, speeds);

  if (directionContainer) {
    directionContainer.classList.add("direction-flower");
    const areaMap = {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      center: "center",
    };
    [...directionContainer.querySelectorAll("button")].forEach((btn) => {
      btn.classList.add("dir");
      const id = btn.dataset.id;
      if (id && areaMap[id]) {
        btn.dataset.area = areaMap[id];
      }
    });
  }

  setActive(presetContainer, state.preset);
  setActive(directionContainer, state.direction);
  setActive(speedContainer, state.speedId);

  speedSlider.value = state.customSpeed;
  speedNumber.value = state.customSpeed;

  handleOptionClick(presetContainer, (id) => {
    state.preset = id;
  });

  handleOptionClick(directionContainer, (id) => {
    state.direction = id;
  });

  handleOptionClick(speedContainer, (id) => {
    state.speedId = id;
  });
}

function initCustomSpeed() {
  const sync = (value) => {
    const numeric = clamp(parseFloat(value), 0.4, 4);
    if (Number.isNaN(numeric)) return;
    state.customSpeed = numeric;
    speedSlider.value = numeric;
    speedNumber.value = numeric;
    rebuildAnimation();
  };

  speedSlider?.addEventListener("input", (e) => sync(e.target.value));
  speedNumber?.addEventListener("input", (e) => sync(e.target.value));
}

function initCopy() {
  if (!copyButton) return;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet.textContent);
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    } catch (error) {
      copyButton.textContent = "Copy failed";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
      // eslint-disable-next-line no-console
      console.error(error);
    }
  });
}

function initReplay() {
  if (!replayButton) return;
  replayButton.addEventListener("click", rebuildAnimation);
}

function initAnimationEnd() {
  if (!previewBox) return;
  previewBox.addEventListener("animationend", () => {
    const { base, inOut } = activeAnimation || {};
    if ((base === "move" || base === "scale") && inOut === "out") {
      previewBox.style.display = "none";
    }
  });
}

initOptions();
initCustomSpeed();
initCopy();
initReplay();
initAnimationEnd();
renderPreviewObject();
rebuildAnimation();

previewSelect?.addEventListener("change", (e) => {
  state.previewObject = e.target.value;
  renderPreviewObject();
  rebuildAnimation();
});

function initAdvancedControls() {
  const rootStyles = getComputedStyle(document.documentElement);
  const driftRaw = rootStyles.getPropertyValue("--start-end-position")?.trim() || "60px";
  const driftDefault = driftRaw || "60px";
  const scaleDefault = parseFloat(rootStyles.getPropertyValue("--start-end-scale")) || 0.75;
  const opacityDefault = parseFloat(rootStyles.getPropertyValue("--start-end-opacity")) || 0;
  const normalizeDistance = (value) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }
    return trimmed;
  };

  const syncDrift = (value) => {
    const normalized = normalizeDistance(String(value));
    if (!normalized) return;
    const numeric = parseFloat(normalized);
    if (driftRange && Number.isFinite(numeric)) driftRange.value = numeric;
    if (driftInput && Number.isFinite(numeric)) driftInput.value = numeric;
    document.documentElement.style.setProperty("--start-end-position", normalized);
    rebuildAnimation();
  };

  const syncScale = (value) => {
    const numeric = parseFloat(value);
    if (!Number.isFinite(numeric)) return;
    if (scaleRange) scaleRange.value = numeric;
    if (scaleInput) scaleInput.value = numeric;
    document.documentElement.style.setProperty("--start-end-scale", `${numeric}`);
    rebuildAnimation();
  };

  const syncOpacity = (value) => {
    const numeric = parseFloat(value);
    if (!Number.isFinite(numeric)) return;
    if (opacityRange) opacityRange.value = numeric;
    if (opacityInput) opacityInput.value = numeric;
    document.documentElement.style.setProperty("--start-end-opacity", `${numeric}`);
    rebuildAnimation();
  };

  if (driftRange) driftRange.value = parseFloat(driftDefault);
  if (driftInput) driftInput.value = parseFloat(driftDefault);
  if (scaleRange) scaleRange.value = scaleDefault;
  if (scaleInput) scaleInput.value = scaleDefault;
  if (opacityRange) opacityRange.value = opacityDefault;
  if (opacityInput) opacityInput.value = opacityDefault;

  driftRange?.addEventListener("input", (e) => syncDrift(e.target.value));
  driftInput?.addEventListener("input", (e) => syncDrift(e.target.value));

  scaleRange?.addEventListener("input", (e) => syncScale(e.target.value));
  scaleInput?.addEventListener("input", (e) => syncScale(e.target.value));
  opacityRange?.addEventListener("input", (e) => syncOpacity(e.target.value));
  opacityInput?.addEventListener("input", (e) => syncOpacity(e.target.value));
}

initAdvancedControls();
