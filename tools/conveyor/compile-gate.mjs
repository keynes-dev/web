import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { packGeometry } from "./geometry-codec.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import {
  bounds,
  projectGroup,
  spatialIndex,
  visibleSegments,
  subtractTriangle,
  polygonPath,
  segmentPath,
  project,
  projectedTriangle,
} from "./projection.js";

const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const full = process.argv.includes("--full");
const source = JSON.parse(
  await readFile(
    new URL(full ? "loop-geometry.json" : "gate-geometry.json", directory),
    "utf8",
  ),
);
const timeline = createTimeline(source.sky);
const stationary = projectGroup(
  source.groups.find((group) => group.binding === "static"),
  timeline.describe(source.start),
);
const moving = source.groups.filter((group) => group.binding !== "static");
const opaque = stationary.triangles.filter((t) => t.color !== "glass");
const query = spatialIndex(opaque);

// This is a conservative spatial envelope, not a sequence of rendered poses.
const envelope = [Infinity, Infinity, -Infinity, -Infinity];
for (let i = 0; i <= (full ? -1 : 200); i++) {
  const frame = timeline.describe(source.start + (source.duration * i) / 200);
  for (const group of moving)
    for (const face of projectGroup(group, frame).triangles) {
      envelope[0] = Math.min(envelope[0], face.bounds[0] - 0.1);
      envelope[1] = Math.min(envelope[1], face.bounds[1] - 0.1);
      envelope[2] = Math.max(envelope[2], face.bounds[2] + 0.1);
      envelope[3] = Math.max(envelope[3], face.bounds[3] + 0.1);
    }
}
const overlaps = (b) =>
  full ||
  (b[0] <= envelope[2] &&
    b[2] >= envelope[0] &&
    b[1] <= envelope[3] &&
    b[3] >= envelope[1]);
const staticLines = [],
  fixedStrokes = ["", ""];
for (const line of stationary.lines) {
  for (const [a, b] of visibleSegments(
    line.a,
    line.b,
    query(bounds([line.a, line.b])),
  )) {
    if (overlaps(bounds([a, b]))) staticLines.push([...a, ...b, line.fine]);
    else fixedStrokes[line.fine] += segmentPath(a, b);
  }
}
const staticColors = [],
  fixedColors = { ink: "", lamp: "", glass: "" };
for (const face of stationary.triangles) {
  if (face.color === "ground") continue;
  let fragments = [face.points];
  for (const other of query(face.bounds)) {
    if (other.color === face.color) continue;
    fragments = fragments.flatMap((polygon) =>
      subtractTriangle(polygon, other, face.plane),
    );
    if (!fragments.length) break;
  }
  for (const points of fragments) {
    if (overlaps(bounds(points)))
      staticColors.push({ points, plane: face.plane, color: face.color });
    else fixedColors[face.color] += polygonPath(points);
  }
}

function indexed(group) {
  const vertices = [],
    indices = new Map();
  function vertex(values, offset) {
    const point = values.slice(offset, offset + 3);
    const key = point.join(",");
    if (!indices.has(key)) {
      indices.set(key, vertices.length / 3);
      vertices.push(...point);
    }
    return indices.get(key);
  }
  return {
    binding: group.binding,
    vertices,
    faces: group.triangles.map((t) => [
      vertex(t, 0),
      vertex(t, 3),
      vertex(t, 6),
      t[9],
      t[10],
    ]),
    lines: group.lines.map((l) => [vertex(l, 0), vertex(l, 3), l[6]]),
  };
}

function boundaryPath(faces) {
  const edges = new Map(),
    points = new Map();
  const key = (p) =>
    p
      .slice(0, 2)
      .map((v) => Math.round(v * 1e6) / 1e6)
      .join(",");
  for (const { points: polygon } of faces)
    for (let i = 0; i < polygon.length; i++) {
      const a = key(polygon[i]),
        b = key(polygon[(i + 1) % polygon.length]);
      if (a === b) continue;
      points.set(a, polygon[i]);
      points.set(b, polygon[(i + 1) % polygon.length]);
      const reverse = `${b}|${a}`,
        forward = `${a}|${b}`;
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(forward, [a, b]);
    }
  const next = new Map();
  for (const [a, b] of edges.values()) {
    if (!next.has(a)) next.set(a, []);
    next.get(a).push(b);
  }
  let path = "";
  for (const [start, ends] of next)
    while (ends.length) {
      const polygon = [points.get(start)];
      let at = start;
      do {
        const list = next.get(at);
        if (!list?.length) break;
        at = list.pop();
        polygon.push(points.get(at));
      } while (at !== start);
      path += polygonPath(polygon);
    }
  return path;
}
const compiled = {
  attempt: full ? "loop" : "indexed",
  sky: source.sky,
  start: source.start,
  duration: source.duration,
  loop: source.loop,
  envelope: full ? null : envelope,
  ground: full
    ? opaque.map((face) => polygonPath(face.points)).join("")
    : boundaryPath(opaque),
  fixedStrokes,
  fixedColors,
  staticColors,
  staticLines,
  staticTriangles: full
    ? stationary.triangles.map((t) => [...t.points.flat(), t.color])
    : undefined,
  staticSourceLines: full
    ? stationary.lines.map((l) => [...l.a, ...l.b, l.fine])
    : undefined,
  occluders: opaque
    .filter((t) => overlaps(t.bounds))
    .map((t) => [...t.points.flat(), t.color]),
  groups: moving.map(indexed),
};
const rounded = JSON.parse(
  JSON.stringify(compiled, (_key, value) =>
    typeof value === "number" ? Math.round(value * 1e7) / 1e7 : value,
  ),
);
const json = JSON.stringify({
  ...rounded,
  sky: source.sky,
  start: source.start,
  duration: source.duration,
  loop: source.loop,
});
await writeFile(
  new URL(full ? "loop-compiled.json" : "gate-compiled.json", directory),
  json,
);
if (full) {
  const fixed = source.groups.find((g) => g.binding === "static");
  const visible = {
    ...fixed,
    triangles: fixed.triangles.filter((t) =>
      projectedTriangle(
        [
          project(t.slice(0, 3)),
          project(t.slice(3, 6)),
          project(t.slice(6, 9)),
        ],
        t[9],
        t[10],
      ),
    ),
  };
  const packed = JSON.stringify(
    packGeometry(JSON.parse(json), indexed(visible)),
  );
  await writeFile(new URL("loop-packed.json", directory), packed);
  console.log(
    JSON.stringify({
      packedBytes: packed.length,
      packedGzip: gzipSync(packed).length,
    }),
  );
}
console.log(
  JSON.stringify({
    bytes: json.length,
    gzip: gzipSync(json).length,
    envelope,
    staticLines: staticLines.length,
    staticColors: staticColors.length,
    occluders: compiled.occluders.length,
    vertices: compiled.groups.reduce(
      (sum, g) => sum + g.vertices.length / 3,
      0,
    ),
  }),
);
