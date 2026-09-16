import { createConveyor as createSvgConveyor } from "../../../../../tools/conveyor/conveyor.js";
import { unpackGeometry } from "../../../../../tools/conveyor/geometry-codec.js";
import packed from "./svg-geometry.json";

const data = unpackGeometry(packed);

// Temporary homepage preview. The production build still uses main.js.
export function createConveyor(container, options = {}) {
  const drawing = createSvgConveyor(container, { ...options, data });
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
