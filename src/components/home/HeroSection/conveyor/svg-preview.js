import { createConveyor as createSvgConveyor } from "../../../../../tools/conveyor/conveyor.js";
import { unpackGeometry } from "../../../../../tools/conveyor/geometry-codec.js";
import packed from "./svg-geometry.json";

const data = unpackGeometry(packed);
const variants = import.meta.glob("./static/*.json", { import: "default" });
const prepared = new Map();

function variantKey(container) {
  return `./static/${container.clientHeight}-${Math.min(devicePixelRatio, 2)}.json`;
}

export async function prepareConveyor(container) {
  const key = variantKey(container);
  if (variants[key] && !prepared.has(key))
    prepared.set(key, await variants[key]());
}

// Temporary homepage preview. The production build still uses main.js.
export function createConveyor(container, options = {}) {
  const drawing = createSvgConveyor(container, {
    ...options,
    data,
    staticCache: prepared.get(variantKey(container)),
  });
  drawing.svg.setAttribute("aria-hidden", "true");
  const handle = {
    ...drawing,
    destroy() {
      drawing.destroy();
      if (window.conveyor === handle) delete window.conveyor;
    },
  };
  window.conveyor = handle;
  return handle;
}
