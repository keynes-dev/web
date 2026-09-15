/*
  Every material in the scene. Line materials need the pixel size of the canvas
  to work out their width, so they are registered as they are made and the whole
  set is retuned through `setResolution`: a material added here cannot be one the
  resize forgot about.

  The drawing is two colours — the ground it is drawn on and the ink it is drawn
  in — and both come from the page rather than being fixed here, so the scene
  inverts with the site's theme instead of sitting as a lit panel in a dark one.
  Every white surface is the ground and every line the ink; a hole is ink too,
  since what shows through it has to read against the face it is cut in. The
  lamp keeps its own colours: those carry the verdict and mean the same thing
  whichever way round the page is.

  Each factory call owns its materials and line widths. The default set remains
  the conveyor's; other machines request their own set.
*/
import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { CONFIG } from "./config.js";

export function createMaterials() {
  const offset = {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  };

  // Widths are in CSS pixels. LineSegments2 writes the CSS viewport into
  // `resolution` before each draw, so a linewidth of 1 is a 1px stroke — the
  // same as a CSS border. Multiplying that by the device ratio would double
  // it on a retina display. Strokes follow the drawing's scale so a zoomed-out
  // frame keeps its proportions.
  const widths = new Map();
  function lineMaterial(width, weigh = true) {
    const material = new LineMaterial({ color: CONFIG.ink, linewidth: width });
    widths.set(material, { width, weigh });
    return material;
  }

  const white = new THREE.MeshBasicMaterial({
    color: CONFIG.ground,
    ...offset,
  });
  const black = new THREE.MeshBasicMaterial({ color: CONFIG.ink });
  const shell = new THREE.MeshBasicMaterial({
    color: CONFIG.ground,
    side: THREE.DoubleSide,
    ...offset,
  });
  const glass = new THREE.MeshBasicMaterial({
    color: 0x9fbfe0,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    ...offset,
  });
  const lampMat = new THREE.MeshBasicMaterial({
    color: CONFIG.lampColors.running,
    ...offset,
  });
  // Unlit, like everything else in the scene. Nothing here shades: it is line
  // work, and a surface that takes a light is a surface pretending to have been
  // photographed.
  const shapeMats = CONFIG.shapeColors.map(
    () =>
      new THREE.MeshBasicMaterial({
        color: CONFIG.ground,
        side: THREE.DoubleSide,
        ...offset,
      }),
  );
  const lineMat = lineMaterial(CONFIG.lineWidth);
  // Hairline weight for mechanism detail. At 512px a bolt head is only a few
  // pixels across, so the structural line weight fills it in solid.
  const fineMat = lineMaterial(CONFIG.fineWidth);

  const grounds = [white, shell, ...shapeMats];
  const inks = [black, lineMat, fineMat];

  // Repaint the drawing in the page's own two colours. Called with resolved sRGB
  // numbers, since a CSS custom property here is `oklch(...)` and three's colour
  // parser does not read it — the host resolves it through a canvas first.
  function setTheme(ground, ink) {
    for (const material of grounds) material.color.setHex(ground);
    for (const material of inks) material.color.setHex(ink);
  }

  /*
  `weight` is how large the drawing is being rendered against the size its line
  weights were chosen at. A line is otherwise a fixed number of screen pixels
  however far out the frame is zoomed, so a machine drawn half the size keeps
  full-weight strokes and its detail closes up into a blot.
*/
  function setResolution(width, height, pixelRatio, weight = 1) {
    for (const [material, spec] of widths) {
      material.resolution.set(width, height);
      material.linewidth = spec.weigh
        ? spec.width * pixelRatio * weight
        : spec.width;
    }
  }

  return {
    white,
    black,
    shell,
    glass,
    lampMat,
    shapeMats,
    lineMat,
    fineMat,
    setTheme,
    setResolution,
  };
}

export const {
  white,
  black,
  shell,
  glass,
  lampMat,
  shapeMats,
  lineMat,
  fineMat,
  setTheme,
  setResolution,
} = createMaterials();
