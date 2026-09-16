import {
  CONFIG,
  BELT,
  choosePlace,
} from "../../src/components/home/HeroSection/conveyor/config.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import {
  bounds,
  frameView,
  polygonPath,
  projectIndexed,
  projectedPose,
  bindingVisible,
  transform,
  segmentPath,
  spatialIndex,
  subtractTriangle,
  visibleSegments,
} from "./projection.js";

import { translatedBoxCache, translateBox, createBoxLayer } from "./boxes.js";
import { clippedStroke } from "./strokes.js";
import {
  splitRollerMarks,
  continuousBelt,
  createSeams,
  createRollerMarks,
} from "./belt.js";

import { stationaryGeometry, prepareStaticScene } from "./static-scene.js";

import { stationaryStrokes } from "./stationary-strokes.js";

export function createGate(
  container,
  data,
  { place = choosePlace, record = false, staticCache } = {},
) {
  const timeline = createTimeline(data.sky);
  const belt = continuousBelt(data.groups);
  const groups = splitRollerMarks(
    data.groups.filter((g) => !g.binding.startsWith("slats:")),
  );
  const fixed = stationaryGeometry(data);
  const rollerTriangles = fixed.triangles;
  let staticQuery, staticLines, staticColors;
  let depthPixel = 0;
  let strokeMargin = 0;
  let initialized = false;
  let viewport = [-Infinity, -Infinity, Infinity, Infinity];
  const inView = (box) =>
    box[0] <= viewport[2] &&
    box[2] >= viewport[0] &&
    box[1] <= viewport[3] &&
    box[3] >= viewport[1];
  function offsetSurface(triangle) {
    if (triangle.color !== "ink")
      triangle.plane[2] -=
        Math.max(Math.abs(triangle.plane[0]), Math.abs(triangle.plane[1])) *
          depthPixel +
        199.9 / (2 ** 24 - 1);
    return triangle;
  }
  function prepareStatic() {
    const prepared = prepareStaticScene(data, fixed, depthPixel);
    staticQuery = prepared.query;
    staticColors = prepared.colors;
    staticLines = prepared.lines;
  }

  const moving = groups.filter((group) => !group.binding.startsWith("roller:"));
  const localCorners = new Map(
    moving.map((group) => {
      const low = [Infinity, Infinity, Infinity],
        high = [-Infinity, -Infinity, -Infinity];
      group.vertices.forEach((v, i) => {
        const axis = i % 3;
        low[axis] = Math.min(low[axis], v);
        high[axis] = Math.max(high[axis], v);
      });
      return [
        group.binding,
        Array.from({ length: 8 }, (_, i) =>
          low.map((v, axis) => (i & (1 << axis) ? high[axis] : v)),
        ),
      ];
    }),
  );
  const prepared = new Map();
  const vertexBuffers = new Map(moving.map((group) => [group.binding, []]));
  const frameBounds = new Map();
  function groupBounds(group, frame) {
    let box = frameBounds.get(group.binding);
    if (!box) {
      box = bounds(
        localCorners
          .get(group.binding)
          .map((p) => transform(p, group.binding, frame)),
      );
      frameBounds.set(group.binding, box);
    }
    return box;
  }
  let revision = 0;
  const boxCache = translatedBoxCache();
  function prepareGroup(group, frame) {
    const pose = projectedPose(group.binding, frame);
    const previous = prepared.get(group.binding);
    if (
      previous &&
      pose.every((point, i) => point.every((v, k) => v === previous.pose[i][k]))
    )
      return previous.geometry;
    if (!inView(groupBounds(group, frame))) {
      const geometry = {
        binding: group.binding,
        triangles: [],
        lines: [],
        colors: [],
        revision: ++revision,
        ground: "",
      };
      prepared.set(group.binding, { pose, geometry });
      return geometry;
    }
    const cached = group.binding.startsWith("box:")
      ? boxCache.get(group, frame, offsetSurface)
      : null;
    const geometry = cached
      ? translateBox(cached)
      : projectIndexed(group, frame, pose, vertexBuffers.get(group.binding));
    geometry.binding = group.binding;
    geometry.triangles = geometry.triangles
      .filter((t) => inView(t.bounds))
      .map((t) => (cached ? t : offsetSurface(t)));
    for (const triangle of geometry.triangles) triangle.binding = group.binding;
    geometry.ground = geometry.triangles
      .map((t) => polygonPath(t.points))
      .join("");
    const ownQuery = cached ? null : spatialIndex(geometry.triangles);
    const query = ownQuery
      ? (box) => [...staticQuery(box), ...ownQuery(box)]
      : staticQuery;
    const articulated =
      ["upper", "fore", "wrist", "rotor", "jaw:-1", "jaw:1"].includes(
        group.binding,
      ) ||
      (group.binding.startsWith("box:") &&
        Math.abs(Math.sin(frame.boxes[Number(group.binding.slice(4))].roll)) >
          1e-8);
    geometry.lines = geometry.lines.filter((l) => inView(bounds([l.a, l.b])));
    if (!articulated)
      geometry.lines = geometry.lines.flatMap((line) =>
        visibleSegments(line.a, line.b, query(bounds([line.a, line.b]))).map(
          ([a, b]) => ({ a, b, fine: line.fine }),
        ),
      );
    geometry.articulated = articulated;
    geometry.revision = ++revision;
    geometry.bounds = bounds(geometry.triangles.flatMap((t) => t.points));
    const colorFaces = cached ? geometry.colors : geometry.triangles;
    geometry.colors = [];
    for (const face of colorFaces) {
      if (face.color === "ground") continue;
      let fragments = [face.points];
      for (const other of query(face.bounds)) {
        if (other.color === face.color) continue;
        fragments = fragments.flatMap((p) =>
          subtractTriangle(p, other, face.plane),
        );
        if (!fragments.length) break;
      }
      for (const points of fragments)
        geometry.colors.push({ ...face, points, bounds: bounds(points) });
    }
    prepared.set(group.binding, { pose, geometry });
    return geometry;
  }
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-label", "Conveyor sorting shapes into boxes");
  svg.setAttribute("role", "img");
  svg.style.cssText = "display:block;width:100%;height:100%;overflow:hidden";
  const paths = {};
  let seams, marks, stationary;
  for (const kind of [
    "static",
    "ground",
    "ink",
    "lamp",
    "stationaryLine",
    "stationaryFine",
    "line",
    "fine",
    "clipped",
    "glass",
  ]) {
    const path = document.createElementNS(
      ns,
      kind === "stationaryLine" || kind === "stationaryFine" ? "g" : "path",
    );
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
    if (kind === "static") {
      seams = createSeams(svg, belt.surfaces);
      marks = createRollerMarks(svg, groups);
    }
  }
  const boxLayer = createBoxLayer(svg, moving);
  const staticObstacles = data.staticTriangles
    .filter((t) =>
      [0, 3, 6].some(
        (i) =>
          (t[i + 2] * Math.sqrt(3) -
            t[i + 1] * Math.sqrt(6) +
            2 * CONFIG.lookAt[1]) /
            3 >
          BELT.top + 0.1,
      ),
    )
    .map((t) => bounds([t.slice(0, 3), t.slice(3, 6), t.slice(6, 9)]));
  const overlaps = (a, b) =>
    a[0] - strokeMargin <= b[2] &&
    a[2] + strokeMargin >= b[0] &&
    a[1] - strokeMargin <= b[3] &&
    a[3] + strokeMargin >= b[1];
  container.append(svg);
  paths.static.setAttribute(
    "d",
    data.ground + rollerTriangles.map((t) => polygonPath(t.points)).join(""),
  );
  let time = data.start;
  const samples = [];
  const costs = [];
  function recordCost(elapsed, phases) {
    if (!record) return;
    samples.push(elapsed);
    costs.push(phases);
    if (samples.length > 16384) {
      samples.splice(0, 8192);
      costs.splice(0, 8192);
    }
  }
  let lastGeometry = "";
  let lastDrawnTime;
  let lastLamp;
  const lastPaths = new Map();
  function writePath(kind, value) {
    if (lastPaths.get(kind) === value) return;
    paths[kind].setAttribute("d", value);
    lastPaths.set(kind, value);
  }
  function draw(t) {
    if (lastDrawnTime === t) return;
    const began = performance.now();
    time = t;
    lastDrawnTime = t;
    const frame = timeline.describe(t);
    frameBounds.clear();
    seams.draw(frame.beltShift);
    marks.draw(frame.beltShift);
    const active = moving.filter((group) =>
      bindingVisible(group.binding, frame),
    );
    const obstacles = [
      ...staticObstacles,
      ...active
        .filter(
          (g) =>
            !g.binding.startsWith("box:") && !g.binding.startsWith("roller:"),
        )
        .map((g) => groupBounds(g, frame)),
    ];
    const geometry = active
      .filter((group) => {
        if (!group.binding.startsWith("box:")) return true;
        const boxBounds = groupBounds(group, frame);
        const cached =
          inView(boxBounds) && !obstacles.some((b) => overlaps(boxBounds, b))
            ? boxCache.get(group, frame, offsetSurface)
            : null;
        boxLayer.draw(group.binding, cached);
        return !cached;
      })
      .map((group) => prepareGroup(group, frame));
    if (frame.lamp !== lastLamp) {
      lastLamp = frame.lamp;
      svg.style.setProperty(
        "--conveyor-lamp",
        `#${frame.lamp.toString(16).padStart(6, "0")}`,
      );
    }
    const signature = geometry.map((g) => g.revision).join(",");
    if (signature === lastGeometry) {
      const elapsed = performance.now() - began;
      recordCost(elapsed, [elapsed, 0, 0, 0]);
      return;
    }
    lastGeometry = signature;
    const dynamicTriangles = geometry.flatMap((g) => g.triangles);
    const dynamicQuery = spatialIndex(dynamicTriangles);
    const groupQuery = spatialIndex(geometry.filter((g) => g.triangles.length));
    const dependencies = (box, binding) =>
      groupQuery(box)
        .filter((g) => g.binding !== binding)
        .map((g) => g.revision)
        .join(",");
    const query = (box) => [...staticQuery(box), ...dynamicQuery(box)];
    const projectedAt = performance.now();
    const triangles = [...staticColors, ...geometry.flatMap((g) => g.colors)];
    const fills = { ink: "", lamp: "", glass: "" };
    for (const [index, triangle] of triangles.entries()) {
      if (!inView(triangle.bounds)) continue;
      if (triangle.color === "ground") continue;
      const dependency = dependencies(triangle.bounds, triangle.binding);
      if (triangle.output?.dependency === dependency) {
        fills[triangle.color] += triangle.output.path;
        continue;
      }
      let fragments = [triangle.points];
      const occluders =
        index < staticColors.length
          ? dynamicQuery(triangle.bounds)
          : dynamicQuery(triangle.bounds).filter(
              (t) => t.binding !== triangle.binding,
            );
      if (index < staticColors.length && !occluders.length) {
        triangle.output = { dependency, path: triangle.path };
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
      const path = fragments.map(polygonPath).join("");
      triangle.output = { dependency, path };
      fills[triangle.color] += path;
    }
    const filledAt = performance.now();
    stationary.draw(dependencies, dynamicQuery);
    const strokes = ["", ""];
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
        const expanded = [
          box[0] - width / 2,
          box[1] - width / 2,
          box[2] + width / 2,
          box[3] + width / 2,
        ];
        const dependency = dependencies(expanded, group.binding);
        if (line.output?.dependency === dependency) {
          clipped += line.output.clipped;
          strokes[line.fine] += line.output.path;
          continue;
        }
        const boxQuery = group.articulated ? query : dynamicQuery;
        const occluders = boxQuery([
          box[0] - width / 2,
          box[1] - width / 2,
          box[2] + width / 2,
          box[3] + width / 2,
        ]).filter((t) => group.articulated || t.binding !== group.binding);
        const visible = visibleSegments(line.a, line.b, occluders);
        let path = "",
          clippedPath = "";
        if (
          group.articulated &&
          visible.length &&
          !(
            visible.length === 1 &&
            visible[0][0].every((v, i) => Math.abs(v - line.a[i]) < 1e-8) &&
            visible[0][1].every((v, i) => Math.abs(v - line.b[i]) < 1e-8)
          )
        )
          clippedPath = clippedStroke(line.a, line.b, width, occluders);
        else for (const [a, b] of visible) path += segmentPath(a, b);
        line.output = { dependency, path, clipped: clippedPath };
        strokes[line.fine] += path;
        clipped += clippedPath;
      }
    const clippedAt = performance.now();
    writePath("ground", geometry.map((g) => g.ground).join(""));
    writePath("ink", fills.ink);
    writePath("lamp", fills.lamp);
    writePath("glass", fills.glass);
    writePath("clipped", clipped);
    writePath("line", strokes[0]);
    writePath("fine", strokes[1]);
    recordCost(performance.now() - began, [
      projectedAt - began,
      filledAt - projectedAt,
      clippedAt - filledAt,
      performance.now() - clippedAt,
    ]);
  }
  let lastView;
  let lastRatio;
  let lastHeight;
  function resize() {
    const placement = typeof place === "function" ? place() : place;
    const ratio = Math.min(devicePixelRatio, CONFIG.maxPixelRatio);
    const view = frameView(
      container.clientWidth,
      container.clientHeight,
      placement,
    );
    if (
      lastHeight === container.clientHeight &&
      lastRatio === ratio &&
      lastView?.every((value, i) => value === view[i])
    )
      return false;
    lastHeight = container.clientHeight;
    lastView = view;
    lastRatio = ratio;
    lastDrawnTime = undefined;
    prepared.clear();
    boxCache.clear();
    const margin =
      (CONFIG.lineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt;
    strokeMargin = margin;
    viewport = [
      view[0] - margin,
      view[1] - margin,
      view[0] + view[2] + margin,
      view[1] + view[3] + margin,
    ];
    depthPixel =
      (2 * CONFIG.frustum * (placement.zoom ?? 1)) /
      (Math.max(1, container.clientHeight) * ratio);
    prepareStatic();
    stationary = stationaryStrokes(
      [paths.stationaryLine, paths.stationaryFine],
      staticLines,
      inView,
    );
    seams.resize(
      staticQuery,
      margin,
      staticCache?.depthPixel === depthPixel ? staticCache.masks : undefined,
    );
    marks.resize(
      staticQuery,
      (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
    );
    boxLayer.resize(
      margin,
      (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
    );
    svg.setAttribute("viewBox", view.join(" "));
    // Preserve the reference's DPR-dependent stroke weights.
    const fineWidth =
      (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt;
    for (const name of ["line", "stationaryLine"])
      paths[name].setAttribute("stroke-width", String(margin));
    for (const name of ["fine", "stationaryFine"])
      paths[name].setAttribute("stroke-width", String(fineWidth));
    return true;
  }
  const observer = new ResizeObserver(() => {
    if (resize() && initialized) draw(time);
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
