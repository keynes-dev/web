import { createConveyor } from "../../src/components/home/HeroSection/conveyor/main.js";
import { createGate } from "./gate.js";
import { unpackGeometry } from "./geometry-codec.js";
import { createConveyor as createSvgConveyor } from "./conveyor.js";
import * as THREE from "three";
import { createBelt } from "../../src/components/home/HeroSection/conveyor/parts/belt.js";
import { createMachine } from "../../src/components/home/HeroSection/conveyor/parts/machine.js";
import { createBoxes } from "../../src/components/home/HeroSection/conveyor/parts/boxes.js";
import { createArm } from "../../src/components/home/HeroSection/conveyor/parts/arm.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import { host } from "../../src/components/home/HeroSection/conveyor/host.js";
import { camera } from "../../src/components/home/HeroSection/conveyor/view.js";
import {
  choosePlace,
  CONFIG,
} from "../../src/components/home/HeroSection/conveyor/config.js";

const parameters = new URLSearchParams(location.search);
const nativeDpr = devicePixelRatio;
const renderDpr = Number(parameters.get("dpr") ?? nativeDpr);
if (![1, 2].includes(renderDpr))
  throw new Error("Comparison DPR must be 1 or 2");
if (parameters.has("dpr"))
  Object.defineProperty(window, "devicePixelRatio", {
    value: renderDpr,
    configurable: true,
  });
const full = parameters.has("full");
const baseline = parameters.has("baseline");
const attempt = full
  ? baseline
    ? "loop-baseline"
    : parameters.has("seams")
      ? "loop-translated"
      : "loop-optimized"
  : "indexed";
const original = document.querySelector("#original");
const candidate = document.querySelector("#candidate");
const status = document.querySelector("#status");
const slider = document.querySelector("#time");
const packed = await (
  await fetch(
    full
      ? baseline
        ? "/baseline-compiled.json"
        : "/loop-packed.json"
      : "/gate-compiled.json",
  )
).json();
const data = full && !baseline ? unpackGeometry(packed) : packed;
function gateReference() {
  const scene = new THREE.Scene();
  const parts = [
    createBelt(scene),
    createMachine(scene),
    createBoxes(scene),
    createArm(scene),
  ];
  const timeline = createTimeline(data.sky);
  const controls = host(original, {
    scene,
    camera,
    update(t) {
      const frame = timeline.describe(t);
      for (const part of parts) part.apply(frame);
    },
    loop: timeline.loop,
    still: data.start,
    place: choosePlace,
  });
  controls.pause();
  return { controls, timeline, destroy: controls.destroy };
}
let reference = full ? createConveyor(original) : gateReference();
slider.max = String(data.duration);
if (full) {
  document.title = "Conveyor SVG full loop comparison";
  document.querySelector("#play").textContent = "Play loop";
  document.querySelector("#capture").textContent = "Capture loop";
  document.querySelector("#measure").textContent = "Measure loop";
  document.querySelector("#time-label").textContent = "Loop time";
}
const svgConveyor =
  full && !baseline
    ? createSvgConveyor(candidate, { data, record: true })
    : null;
svgConveyor?.controls.stop();
const baselineModule = "/baseline-gate.js";
const gate = svgConveyor
  ? { ...svgConveyor, draw: svgConveyor.controls.seek }
  : (baseline
      ? (await import(/* @vite-ignore */ baselineModule)).createGate
      : createGate)(candidate, data, { record: true });
let mode = "reference",
  playing = false,
  animation = 0;
function setMode(next) {
  mode = next;
  original.style.visibility = next === "svg" ? "hidden" : "visible";
  candidate.style.visibility = next === "reference" ? "hidden" : "visible";
  candidate.style.opacity = next === "overlay" ? "0.5" : "1";
}
function draw(offset) {
  const t = data.start + offset;
  reference.controls.seek(t);
  gate.draw(t);
  slider.value = String(offset);
  status.textContent = `${mode} | ${full ? "loop" : "turn"} ${offset.toFixed(3)}s | SVG update ${gate.samples.at(-1).toFixed(2)}ms`;
}
function stop() {
  playing = false;
  cancelAnimationFrame(animation);
}
slider.addEventListener("input", () => {
  stop();
  draw(Number(slider.value));
});
for (const name of ["reference", "svg", "overlay"])
  document.querySelector(`#${name}`).addEventListener("click", () => {
    setMode(name);
    draw(Number(slider.value));
  });
document.querySelector("#play").addEventListener("click", () => {
  if (playing) return stop();
  playing = true;
  let last = performance.now();
  let elapsed = Number(slider.value);
  function tick(now) {
    elapsed += Math.min(now - last, 100) / 1000;
    last = now;
    draw(elapsed % data.duration);
    animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
});
const save = async (name, body) => {
  const response = await fetch(`/evidence/${name}`, { method: "POST", body });
  if (!response.ok)
    throw new Error(`Evidence write failed: ${response.status}`);
};
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));
const metadata = () => ({
  userAgent: navigator.userAgent,
  dpr: devicePixelRatio,
  nativeDpr,
  forcedRenderDpr: parameters.has("dpr"),
  width: original.clientWidth,
  height: original.clientHeight,
  loop: reference.timeline.loop,
  start: data.start,
  duration: data.duration,
  date: new Date().toISOString(),
});
document.querySelector("#measure").addEventListener("click", async () => {
  stop();
  const controls = [...document.querySelectorAll("button,input,select")];
  for (const control of controls) control.disabled = true;
  status.textContent = `Measuring ${attempt} ${mode}: one warm-up loop and three measured loops`;
  const longTasks = [];
  const observer = PerformanceObserver.supportedEntryTypes.includes("longtask")
    ? new PerformanceObserver((list) =>
        longTasks.push(
          ...list
            .getEntries()
            .map(({ startTime, duration }) => ({ startTime, duration })),
        ),
      )
    : null;
  observer?.observe({ entryTypes: ["longtask"] });
  let hidden = document.hidden;
  const visibility = () => {
    hidden ||= document.hidden;
  };
  document.addEventListener("visibilitychange", visibility);
  try {
    const intervals = [],
      updates = [];
    let last = await nextFrame();
    const begin = last;
    while (last - begin < data.duration * 4000) {
      const now = await nextFrame();
      const offset = ((now - begin) / 1000) % data.duration;
      const start = performance.now();
      if (mode === "reference") reference.controls.seek(data.start + offset);
      else gate.draw(data.start + offset);
      if (now - begin > data.duration * 1000) {
        intervals.push(now - last);
        updates.push(performance.now() - start);
      }
      last = now;
    }
    const sorted = [...updates].sort((a, b) => a - b);
    const result = {
      ...metadata(),
      mode,
      attempt,
      hiddenDuringMeasurement: hidden,
      longTasks: observer
        ? longTasks.filter(
            (task) => task.startTime > begin + data.duration * 1000,
          )
        : null,
      samples: intervals.length,
      under25ms: intervals.filter((n) => n < 25).length / intervals.length,
      updateP50: sorted[Math.floor(sorted.length * 0.5)],
      updateP99: sorted[Math.floor(sorted.length * 0.99)],
      intervals,
      updates,
      costs:
        mode === "svg"
          ? gate.costs
              .slice(-updates.length)
              .reduce(
                (sum, row) => sum.map((v, i) => v + row[i] / updates.length),
                [0, 0, 0, 0],
              )
          : undefined,
    };
    await save(
      `${attempt}-performance-${mode}-${original.clientWidth}.json`,
      JSON.stringify(result),
    );
    status.textContent = JSON.stringify(
      { ...result, intervals: undefined, updates: undefined },
      null,
      2,
    );
  } finally {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    for (const control of controls) control.disabled = false;
  }
});
async function captureFrame(offset, tag) {
  draw(offset);
  const canvas = original.querySelector("canvas");
  const name = `${attempt}-${original.clientWidth}-${devicePixelRatio}-${tag}`;
  await save(
    `${name}-reference.png`,
    await (await fetch(canvas.toDataURL())).blob(),
  );
  const svg = gate.svg.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", original.clientWidth);
  svg.setAttribute("height", original.clientHeight);
  svg.style.setProperty("color", getComputedStyle(original).color);
  svg.style.setProperty(
    "--conveyor-ground",
    getComputedStyle(document.documentElement).backgroundColor,
  );
  const serialized = new XMLSerializer().serializeToString(svg);
  await save(`${name}-candidate.svg`, serialized);
  const url = URL.createObjectURL(
    new Blob([serialized], { type: "image/svg+xml" }),
  );
  const image = new Image();
  image.src = url;
  await image.decode();
  const raster = document.createElement("canvas");
  raster.width = canvas.width;
  raster.height = canvas.height;
  raster.getContext("2d").drawImage(image, 0, 0, raster.width, raster.height);
  URL.revokeObjectURL(url);
  await save(
    `${name}-candidate.png`,
    await new Promise((resolve) => raster.toBlob(resolve)),
  );
}
async function captureTimes(times, prefix) {
  stop();
  const controls = [...document.querySelectorAll("button,input,select")];
  for (const control of controls) control.disabled = true;
  try {
    for (let i = 0; i < times.length; i++) {
      await captureFrame(times[i], `${prefix}${String(i).padStart(3, "0")}`);
      status.textContent = `Captured ${i + 1}/${times.length} frames`;
    }
    await save(
      `${attempt}-capture-${prefix || "cycle"}-${original.clientWidth}-${devicePixelRatio}.json`,
      JSON.stringify({ ...metadata(), times }),
    );
    status.textContent = "Capture complete";
  } finally {
    for (const control of controls) control.disabled = false;
  }
}
document.querySelector("#capture").addEventListener("click", () =>
  captureTimes(
    Array.from({ length: Math.ceil(data.duration * 60) + 1 }, (_, i) =>
      Math.min(data.duration, i / 60),
    ),
    "",
  ),
);
document
  .querySelector("#capture-frame")
  .addEventListener("click", () =>
    captureTimes([Number(slider.value)], "still-"),
  );
document.querySelector("#capture-phases").addEventListener("click", () => {
  const first = reference.timeline.cycles.find((c) => c.entry);
  const times = new Set([
    0,
    data.duration,
    first.start + first.dropStart + 0.7,
  ]);
  for (const cycle of reference.timeline.cycles) {
    for (const field of ["start", "end"])
      if (Number.isFinite(cycle[field])) times.add(cycle[field]);
    for (const field of ["dropStart", "armStart", "approved", "length"])
      if (Number.isFinite(cycle[field])) times.add(cycle.start + cycle[field]);
    if (cycle.entry) times.add(cycle.start + CONFIG.phase.travel);
    if (cycle.entry?.reject) {
      let time = cycle.start + cycle.armStart;
      for (const duration of Object.values(CONFIG.arm)) {
        time += duration;
        times.add(time);
      }
    }
  }
  const samples = [...times]
    .flatMap((t) => [t - 0.0001, t, t + 0.0001])
    .filter((t) => t >= data.start && t <= data.start + data.duration)
    .map((t) => t - data.start);
  return captureTimes(
    [...new Set(samples)].sort((a, b) => a - b),
    "phase-",
  );
});
document.querySelector("#baseline").addEventListener("click", async () => {
  stop();
  setMode("reference");
  reference.destroy();
  reference = createConveyor(original);
  const canvas = original.querySelector("canvas");
  for (let i = 0; i <= Math.ceil(reference.timeline.loop * 60); i++) {
    reference.controls.seek(Math.min(reference.timeline.loop, i / 60));
    const name = `baseline-${original.clientWidth}-${devicePixelRatio}-${String(i).padStart(4, "0")}.png`;
    await save(name, await (await fetch(canvas.toDataURL())).blob());
    status.textContent = `Reference capture ${i}/${Math.ceil(reference.timeline.loop * 60)}`;
  }
  await save(
    `baseline-${original.clientWidth}-${devicePixelRatio}.json`,
    JSON.stringify(metadata()),
  );
  reference.destroy();
  reference = full ? createConveyor(original) : gateReference();
  status.textContent = "Reference capture complete";
});
draw(0);
setMode("reference");

window.addEventListener(
  "pagehide",
  () => {
    stop();
    gate.destroy();
    reference.destroy();
  },
  { once: true },
);
