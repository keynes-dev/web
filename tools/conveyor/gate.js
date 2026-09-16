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
  projectedTriangle,
  projectIndexed,
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

export function createGate(
  container,
  data,
  { place = choosePlace, record = false } = {},
) {
  const timeline = createTimeline(data.sky);
  const belt = continuousBelt(data.groups);
  const groups = splitRollerMarks(
    data.groups.filter((g) => !g.binding.startsWith("slats:")),
  );
  const fixedRollers = groups
    .filter((group) => data.staticTriangles && group.binding.endsWith(":fixed"))
    .map((group) => projectIndexed(group, timeline.describe(0)));
  const rollerTriangles = [
    ...belt.triangles,
    ...fixedRollers.flatMap((group) => group.triangles),
  ];
  const rollerLines = [
    ...belt.lines,
    ...fixedRollers.flatMap((group) => group.lines),
  ];
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
  let strokeMargin = 0;
  let initialized = false;
  let viewport = [-Infinity, -Infinity, Infinity, Infinity];
  const inView = (box) =>
    box[0] <= viewport[2] &&
    box[2] >= viewport[0] &&
    box[1] <= viewport[3] &&
    box[3] >= viewport[1];
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
    const faces = [
      ...data.staticTriangles,
      ...rollerTriangles.map((t) => [...t.points.flat(), t.color]),
    ].map((t) =>
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
    for (const l of [
      ...data.staticSourceLines,
      ...rollerLines.map((line) => [...line.a, ...line.b, line.fine]),
    ]) {
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
  let revision = 0;
  const boxCache = translatedBoxCache();
  function prepareGroup(group, frame) {
    const pose = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
      .flatMap((p) => transform(p, group.binding, frame))
      .join(",");
    const previous = prepared.get(group.binding);
    if (previous?.pose === pose) return previous.geometry;
    if (
      !inView(
        bounds(
          localCorners
            .get(group.binding)
            .map((p) => transform(p, group.binding, frame)),
        ),
      )
    ) {
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
      : projectIndexed(group, frame);
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
  let seams, marks;
  for (const kind of [
    "static",
    "fixedInk",
    "fixedLamp",
    "fixedLine",
    "fixedFine",
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
    if (kind === "static") {
      seams = createSeams(svg, belt.surfaces);
      marks = createRollerMarks(svg, groups);
    }
  }
  const boxLayer = createBoxLayer(svg, moving);
  const staticObstacles = (data.staticTriangles ?? [])
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
  paths.fixedInk.setAttribute("d", data.fixedColors.ink);
  paths.fixedLamp.setAttribute("d", data.fixedColors.lamp);
  paths.fixedLine.setAttribute("d", data.fixedStrokes[0]);
  paths.fixedFine.setAttribute("d", data.fixedStrokes[1]);
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
  let lastLamp;
  const lastPaths = new Map();
  function writePath(kind, value) {
    if (lastPaths.get(kind) === value) return;
    paths[kind].setAttribute("d", value);
    lastPaths.set(kind, value);
  }
  function draw(t) {
    const began = performance.now();
    time = t;
    const frame = timeline.describe(t);
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
        .map((g) =>
          bounds(
            localCorners
              .get(g.binding)
              .map((p) => transform(p, g.binding, frame)),
          ),
        ),
    ];
    const geometry = active
      .filter((group) => {
        if (!group.binding.startsWith("box:")) return true;
        const boxBounds = bounds(
          localCorners
            .get(group.binding)
            .map((p) => transform(p, group.binding, frame)),
        );
        const cached =
          data.staticTriangles &&
          inView(boxBounds) &&
          !obstacles.some((b) => overlaps(boxBounds, b))
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
    const stationaryStrokes = ["", ""];
    for (const line of staticLines) {
      if (!inView(line.bounds)) continue;
      const dependency = dependencies(line.bounds);
      if (line.output?.dependency === dependency) {
        stationaryStrokes[line.fine] += line.output.path;
        continue;
      }
      const occluders = dynamicQuery(line.bounds);
      let path = "";
      if (!occluders.length) path = segmentPath(line.a, line.b);
      else
        for (const [a, b] of visibleSegments(line.a, line.b, occluders))
          path += segmentPath(a, b);
      line.output = { dependency, path };
      stationaryStrokes[line.fine] += path;
    }
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
    writePath("stationaryLine", stationaryStrokes[0]);
    writePath("stationaryFine", stationaryStrokes[1]);
    writePath("line", strokes[0]);
    writePath("fine", strokes[1]);
    recordCost(performance.now() - began, [
      projectedAt - began,
      filledAt - projectedAt,
      clippedAt - filledAt,
      performance.now() - clippedAt,
    ]);
  }
  function resize() {
    prepared.clear();
    boxCache.clear();
    const placement = typeof place === "function" ? place() : place;
    const ratio = Math.min(devicePixelRatio, CONFIG.maxPixelRatio);
    const view = frameView(
      container.clientWidth,
      container.clientHeight,
      placement,
    );
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
    seams.resize(staticQuery, margin);
    marks.resize(
      staticQuery,
      (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
    );
    boxLayer.resize(
      margin,
      (CONFIG.fineWidth * ratio * 2 * CONFIG.frustum) / CONFIG.weighedAt,
    );
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
    paths.stationaryLine.setAttribute(
      "stroke-width",
      paths.line.getAttribute("stroke-width"),
    );
    paths.stationaryFine.setAttribute(
      "stroke-width",
      paths.fine.getAttribute("stroke-width"),
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
