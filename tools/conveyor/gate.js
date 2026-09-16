import {
  CONFIG,
  choosePlace,
} from "../../src/components/home/HeroSection/conveyor/config.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import {
  bounds,
  frameView,
  polygonPath,
  projectedTriangle,
  projectIndexed,
  bindingVisible,
  segmentPath,
  spatialIndex,
  subtractTriangle,
  visibleSegments,
} from "./projection.js";

import { clippedStroke } from "./strokes.js";

export function createGate(container, data, { place = choosePlace } = {}) {
  const timeline = createTimeline(data.sky);
  let staticQuery = spatialIndex(
    data.occluders
      .map((t) =>
        projectedTriangle(
          [t.slice(0, 3), t.slice(3, 6), t.slice(6, 9)],
          t[9],
          true,
        ),
      )
      .filter(Boolean),
  );
  let staticLines = data.staticLines.map((l) => ({
    a: l.slice(0, 3),
    b: l.slice(3, 6),
    fine: l[6],
    bounds: bounds([l.slice(0, 3), l.slice(3, 6)]),
  }));
  let staticColors = data.staticColors.map((t) => ({
    ...t,
    bounds: bounds(t.points),
    path: polygonPath(t.points),
  }));
  let depthPixel = 0;
  let initialized = false;
  function offsetSurface(triangle) {
    if (data.staticTriangles && triangle.color !== "ink")
      triangle.plane[2] -=
        Math.max(Math.abs(triangle.plane[0]), Math.abs(triangle.plane[1])) *
          depthPixel +
        199.9 / (2 ** 24 - 1);
    return triangle;
  }
  function prepareStatic() {
    if (!data.staticTriangles) return;
    const faces = data.staticTriangles.map((t) =>
      offsetSurface(
        projectedTriangle(
          [t.slice(0, 3), t.slice(3, 6), t.slice(6, 9)],
          t[9],
          true,
        ),
      ),
    );
    staticQuery = spatialIndex(faces.filter((t) => t.color !== "glass"));
    staticColors = [];
    for (const face of faces) {
      if (face.color === "ground") continue;
      let fragments = [face.points];
      for (const other of staticQuery(face.bounds)) {
        if (other.color === face.color) continue;
        fragments = fragments.flatMap((p) =>
          subtractTriangle(p, other, face.plane),
        );
        if (!fragments.length) break;
      }
      for (const points of fragments)
        staticColors.push({
          ...face,
          points,
          bounds: bounds(points),
          path: polygonPath(points),
        });
    }
    staticLines = [];
    for (const l of data.staticSourceLines) {
      const a = l.slice(0, 3),
        b = l.slice(3, 6);
      for (const [start, end] of visibleSegments(
        a,
        b,
        staticQuery(bounds([a, b])),
      ))
        staticLines.push({
          a: start,
          b: end,
          fine: l[6],
          bounds: bounds([start, end]),
        });
    }
  }
  const moving = data.groups;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-label", "Conveyor sorting shapes into boxes");
  svg.setAttribute("role", "img");
  svg.style.cssText = "display:block;width:100%;height:100%;overflow:hidden";
  const paths = {};
  for (const kind of [
    "static",
    "fixedInk",
    "fixedLamp",
    "fixedLine",
    "fixedFine",
    "ground",
    "ink",
    "lamp",
    "line",
    "fine",
    "clipped",
    "glass",
  ]) {
    const path = document.createElementNS(ns, "path");
    if (/line|fine/i.test(kind)) {
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
    } else
      path.setAttribute(
        "fill",
        kind === "ground" || kind === "static"
          ? "var(--conveyor-ground, white)"
          : /ink/i.test(kind) || kind === "clipped"
            ? "currentColor"
            : "var(--conveyor-lamp)",
      );
    if (kind === "glass") {
      path.setAttribute("fill", "var(--conveyor-glass, #9fbfe0)");
      path.setAttribute("fill-opacity", "var(--conveyor-glass-opacity, 0.14)");
    }
    svg.append(path);
    paths[kind] = path;
  }
  container.append(svg);
  paths.static.setAttribute("d", data.ground);
  paths.fixedInk.setAttribute("d", data.fixedColors.ink);
  paths.fixedLamp.setAttribute("d", data.fixedColors.lamp);
  paths.fixedLine.setAttribute("d", data.fixedStrokes[0]);
  paths.fixedFine.setAttribute("d", data.fixedStrokes[1]);
  let time = data.start;
  const samples = [];
  const costs = [];
  function draw(t) {
    const began = performance.now();
    time = t;
    const frame = timeline.describe(t);
    const geometry = moving
      .filter((group) => bindingVisible(group.binding, frame))
      .map((group) => projectIndexed(group, frame));
    const dynamicTriangles = geometry
      .flatMap((g) => g.triangles)
      .map(offsetSurface);
    const dynamicQuery = spatialIndex(dynamicTriangles);
    const query = (box) => [...staticQuery(box), ...dynamicQuery(box)];
    const projectedAt = performance.now();
    const triangles = [...staticColors, ...dynamicTriangles];
    const fills = { ink: "", lamp: "", glass: "" };
    for (const [index, triangle] of triangles.entries()) {
      if (triangle.color === "ground") continue;
      let fragments = [triangle.points];
      const occluders =
        index < staticColors.length
          ? dynamicQuery(triangle.bounds)
          : query(triangle.bounds);
      if (index < staticColors.length && !occluders.length) {
        fills[triangle.color] += triangle.path;
        continue;
      }
      for (const other of occluders) {
        if (other.color === triangle.color) continue;
        fragments = fragments.flatMap((polygon) =>
          subtractTriangle(polygon, other, triangle.plane),
        );
        if (!fragments.length) break;
      }
      fills[triangle.color] += fragments.map(polygonPath).join("");
    }
    const filledAt = performance.now();
    const strokes = ["", ""];
    for (const line of staticLines) {
      const occluders = dynamicQuery(line.bounds);
      if (!occluders.length) strokes[line.fine] += segmentPath(line.a, line.b);
      else
        for (const [a, b] of visibleSegments(line.a, line.b, occluders))
          strokes[line.fine] += segmentPath(a, b);
    }
    let clipped = "";
    for (const group of geometry)
      for (const line of group.lines) {
        const width =
          ((line.fine ? CONFIG.fineWidth : CONFIG.lineWidth) *
            Math.min(devicePixelRatio, CONFIG.maxPixelRatio) *
            2 *
            CONFIG.frustum) /
          CONFIG.weighedAt;
        const box = bounds([line.a, line.b]);
        const occluders = query([
          box[0] - width / 2,
          box[1] - width / 2,
          box[2] + width / 2,
          box[3] + width / 2,
        ]);
        const visible = visibleSegments(line.a, line.b, occluders);
        if (
          (["upper", "fore", "wrist", "rotor", "jaw:-1", "jaw:1"].includes(
            group.binding,
          ) ||
            (group.binding.startsWith("box:") &&
              Math.abs(
                Math.sin(frame.boxes[Number(group.binding.slice(4))].roll),
              ) > 1e-8)) &&
          visible.length &&
          !(
            visible.length === 1 &&
            visible[0][0].every((v, i) => Math.abs(v - line.a[i]) < 1e-8) &&
            visible[0][1].every((v, i) => Math.abs(v - line.b[i]) < 1e-8)
          )
        )
          clipped += clippedStroke(line.a, line.b, width, occluders);
        else
          for (const [a, b] of visible) strokes[line.fine] += segmentPath(a, b);
      }
    const clippedAt = performance.now();
    paths.ground.setAttribute(
      "d",
      dynamicTriangles.map((t) => polygonPath(t.points)).join(""),
    );
    paths.ink.setAttribute("d", fills.ink);
    paths.lamp.setAttribute("d", fills.lamp);
    paths.glass.setAttribute("d", fills.glass);
    paths.clipped.setAttribute("d", clipped);
    svg.style.setProperty(
      "--conveyor-lamp",
      `#${frame.lamp.toString(16).padStart(6, "0")}`,
    );
    paths.line.setAttribute("d", strokes[0]);
    paths.fine.setAttribute("d", strokes[1]);
    samples.push(performance.now() - began);
    costs.push([
      projectedAt - began,
      filledAt - projectedAt,
      clippedAt - filledAt,
      performance.now() - clippedAt,
    ]);
  }
  function resize() {
    const placement = typeof place === "function" ? place() : place;
    const ratio = Math.min(devicePixelRatio, CONFIG.maxPixelRatio);
    depthPixel =
      (2 * CONFIG.frustum * (placement.zoom ?? 1)) /
      (Math.max(1, container.clientHeight) * ratio);
    prepareStatic();
    svg.setAttribute(
      "viewBox",
      frameView(container.clientWidth, container.clientHeight, placement).join(
        " ",
      ),
    );
    // Match the reference's DPR-dependent LineMaterial width, including its current scaling.
    paths.line.setAttribute(
      "stroke-width",
      String(
        (CONFIG.lineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
      ),
    );
    paths.fixedLine.setAttribute(
      "stroke-width",
      paths.line.getAttribute("stroke-width"),
    );
    paths.fixedFine.setAttribute(
      "stroke-width",
      String(
        (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
      ),
    );
    paths.fine.setAttribute(
      "stroke-width",
      String(
        (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
      ),
    );
  }
  const observer = new ResizeObserver(() => {
    resize();
    if (initialized) draw(time);
  });
  observer.observe(container);
  resize();
  draw(time);
  initialized = true;
  return {
    draw,
    svg,
    samples,
    costs,
    timeline,
    destroy() {
      observer.disconnect();
      svg.remove();
    },
  };
}
