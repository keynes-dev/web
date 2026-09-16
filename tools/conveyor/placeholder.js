import { createGate } from "./gate.js";
import { unpackGeometry } from "./geometry-codec.js";
import packed from "../../src/components/home/HeroSection/conveyor/svg-geometry.json";

const data = unpackGeometry(packed);
const container = document.querySelector("#drawing");
const status = document.querySelector("#status");
const nativeRatio = devicePixelRatio;
const nextFrame = () => new Promise(requestAnimationFrame);
async function save(name, body) {
  const response = await fetch(`/evidence/${name}`, { method: "POST", body });
  if (!response.ok) throw new Error(`Capture failed: ${response.status}`);
}
async function capture(heights) {
  status.textContent = "Capturing placeholders...";
  const buttons = [...document.querySelectorAll("button")];
  buttons.forEach((button) => (button.disabled = true));
  try {
    for (const ratio of [1, 2]) {
      Object.defineProperty(window, "devicePixelRatio", {
        value: ratio,
        configurable: true,
      });
      for (const height of heights) {
        container.style.height = `${height}px`;
        container.style.width = `${(height * 20) / 5.8}px`;
        const drawing = createGate(container, data, {
          place: { x: 0, y: 0, zoom: 1 },
        });
        try {
          await nextFrame();
          const first = drawing.timeline.cycles.find((cycle) => cycle.entry);
          for (const [pose, time] of [
            ["first", 0],
            ["reduced", first.start + first.dropStart + 0.7],
          ]) {
            drawing.draw(time);
            const svg = drawing.svg.cloneNode(true);
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg.setAttribute("width", String(container.clientWidth * ratio));
            svg.setAttribute("height", String(height * ratio));
            svg.style.cssText = `color:#2b2422;--conveyor-ground:#ffedd4;--conveyor-lamp:#${drawing.timeline.describe(time).lamp.toString(16).padStart(6, "0")}`;
            const source = new XMLSerializer().serializeToString(svg);
            const url = URL.createObjectURL(
              new Blob([source], { type: "image/svg+xml" }),
            );
            const image = new Image();
            image.src = url;
            try {
              await image.decode();
              const canvas = document.createElement("canvas");
              canvas.width = container.clientWidth * ratio;
              canvas.height = height * ratio;
              canvas.getContext("2d").drawImage(image, 0, 0);
              const name = `placeholder-browser-${pose}-${height}-${ratio}`;
              await save(`${name}.svg`, source);
              await save(
                `${name}.png`,
                await new Promise((resolve) => canvas.toBlob(resolve)),
              );
              status.textContent = `Captured ${name}`;
            } finally {
              URL.revokeObjectURL(url);
            }
          }
        } finally {
          drawing.destroy();
        }
      }
    }
    status.textContent = "Capture complete";
  } finally {
    Object.defineProperty(window, "devicePixelRatio", {
      value: nativeRatio,
      configurable: true,
    });
    buttons.forEach((button) => (button.disabled = false));
  }
}
document
  .querySelector("#compare")
  .addEventListener("click", () => capture([580]));
document
  .querySelector("#export")
  .addEventListener("click", () => capture([224, 256, 416]));
document.querySelectorAll("button").forEach((button) => {
  button.disabled = false;
});
