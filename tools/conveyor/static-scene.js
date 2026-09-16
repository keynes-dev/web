import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import { continuousBelt, splitRollerMarks } from "./belt.js";
import {
  bounds,
  polygonPath,
  projectedTriangle,
  projectIndexed,
  spatialIndex,
  subtractTriangle,
  visibleSegments,
} from "./projection.js";

export function stationaryGeometry(data) {
  const belt = continuousBelt(data.groups);
  const frame = createTimeline(data.sky).describe(0);
  const rollers = splitRollerMarks(data.groups)
    .filter((group) => group.binding.endsWith(":fixed"))
    .map((group) => projectIndexed(group, frame));
  return {
    triangles: [
      ...belt.triangles,
      ...rollers.flatMap((group) => group.triangles),
    ],
    lines: [...belt.lines, ...rollers.flatMap((group) => group.lines)],
  };
}

export function prepareStaticScene(data, fixed, depthPixel) {
  const faces = [
    ...data.staticTriangles,
    ...fixed.triangles.map((t) => [...t.points.flat(), t.color]),
  ].map((t) => {
    const face = projectedTriangle(
      [t.slice(0, 3), t.slice(3, 6), t.slice(6, 9)],
      t[9],
      true,
    );
    if (face.color !== "ink")
      face.plane[2] -=
        Math.max(Math.abs(face.plane[0]), Math.abs(face.plane[1])) *
          depthPixel +
        199.9 / (2 ** 24 - 1);
    return face;
  });
  const query = spatialIndex(faces.filter((face) => face.color !== "glass"));
  const fragments = [];
  faces.forEach((face, index) => {
    if (face.color === "ground") return;
    let pieces = [face.points];
    for (const other of query(face.bounds)) {
      if (other.color === face.color) continue;
      pieces = pieces.flatMap((p) => subtractTriangle(p, other, face.plane));
      if (!pieces.length) break;
    }
    for (const points of pieces) fragments.push([index, points]);
  });
  const segments = [];
  for (const line of [
    ...data.staticSourceLines,
    ...fixed.lines.map((l) => [...l.a, ...l.b, l.fine]),
  ]) {
    const a = line.slice(0, 3),
      b = line.slice(3, 6);
    for (const [start, end] of visibleSegments(a, b, query(bounds([a, b]))))
      segments.push([start, end, line[6]]);
  }
  return {
    query,
    colors: fragments.map(([index, points]) => ({
      ...faces[index],
      points,
      bounds: bounds(points),
      path: polygonPath(points),
    })),
    lines: segments.map(([a, b, fine]) => ({
      a,
      b,
      fine,
      bounds: bounds([a, b]),
    })),
  };
}
