import { BELT } from "../../src/components/home/HeroSection/conveyor/config.js";
import {
  project,
  projectedTriangle,
  bounds,
  polygonPath,
  segmentPath,
  subtractTriangle,
} from "./projection.js";
import { mod } from "../../src/components/home/HeroSection/conveyor/math.js";

export function continuousBelt(groups) {
  const triangles = [],
    lines = [],
    surfaces = [];
  for (const source of groups.filter((g) => g.binding.startsWith("slats:"))) {
    const upper = source.binding === "slats:top";
    const zs = source.vertices.filter((_, i) => i % 3 === 2);
    const lo = Math.min(...zs),
      hi = Math.max(...zs);
    const x = BELT.width / 2;
    const y = upper ? BELT.top : BELT.top - BELT.slatRise - 2 * BELT.rollerR;
    const bottom = y - BELT.slatRise;
    const top = [
      [-x, y, lo],
      [x, y, lo],
      [x, y, hi],
      [-x, y, hi],
    ].map(project);
    const side = [
      [x, y, lo],
      [x, bottom, lo],
      [x, bottom, hi],
      [x, y, hi],
    ].map(project);
    const end = [
      [-x, y, hi],
      [x, y, hi],
      [x, bottom, hi],
      [-x, bottom, hi],
    ].map(project);
    for (const p of [top, side, end]) {
      triangles.push(
        ...[
          [p[0], p[1], p[2]],
          [p[0], p[2], p[3]],
        ].map((t) => projectedTriangle(t, "ground", true)),
      );
      lines.push(...p.map((a, i) => ({ a, b: p[(i + 1) % 4], fine: 0 })));
    }
    const direction = upper ? -1 : 1;
    surfaces.push(
      { points: top, from: [-x, y], to: [x, y], direction },
      { points: side, from: [x, y], to: [x, bottom], direction },
    );
  }
  return { surfaces, triangles, lines };
}

export function createSeams(svg, surfaces) {
  const layers = surfaces.map((surface) => createFaceSeams(svg, surface));
  return {
    draw(shift) {
      for (const layer of layers) layer.draw(shift);
    },
    resize(query, width, masks) {
      layers.forEach((layer, index) =>
        layer.resize(query, width, masks?.[index]),
      );
    },
  };
}

let nextId = 0;
export function clipBeltSurface(top, query) {
  let fragments = [top];
  const plane = projectedTriangle(top.slice(0, 3), "ground", true).plane;
  for (const other of query(bounds(top))) {
    fragments = fragments.flatMap((p) => subtractTriangle(p, other, plane));
    if (!fragments.length) break;
  }
  return fragments.map(polygonPath).join("");
}

function createFaceSeams(svg, { points: top, from, to, direction }) {
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag) => document.createElementNS(ns, tag);
  const clip = make("clipPath"),
    outline = make("path"),
    group = make("g"),
    strip = make("path");
  const id = `conveyor-seams-${++nextId}`;
  clip.setAttribute("id", id);
  clip.setAttribute("clipPathUnits", "userSpaceOnUse");
  clip.append(outline);
  svg.append(clip);
  group.setAttribute("clip-path", `url(#${id})`);
  strip.setAttribute("fill", "none");
  strip.setAttribute("stroke", "currentColor");
  let path = "";
  for (let z = -BELT.length; z <= BELT.length; z += BELT.slat)
    path += segmentPath(project([...from, z]), project([...to, z]));
  strip.setAttribute("d", path);
  group.append(strip);
  svg.append(group);
  let previous;
  return {
    draw(shift) {
      const z = direction * mod(shift, BELT.slat);
      if (z === previous) return;
      previous = z;
      strip.setAttribute(
        "transform",
        `translate(${-z / Math.SQRT2} ${z / Math.sqrt(6)})`,
      );
    },
    resize(query, width, mask) {
      outline.setAttribute("d", mask ?? clipBeltSurface(top, query));
      strip.setAttribute("stroke-width", String(width));
    },
  };
}

export function createRollerMarks(svg, groups) {
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag) => document.createElementNS(ns, tag);
  const clip = make("clipPath"),
    outline = make("path"),
    layer = make("g");
  const id = `conveyor-marks-${++nextId}`;
  clip.setAttribute("id", id);
  clip.setAttribute("clipPathUnits", "userSpaceOnUse");
  clip.append(outline);
  svg.append(clip);
  layer.setAttribute("clip-path", `url(#${id})`);
  svg.append(layer);
  const patches = [],
    marks = [];
  const r = BELT.rollerR * BELT.rollerHub;
  for (const group of groups.filter(
    (g) => g.binding.startsWith("roller:") && !g.binding.endsWith(":fixed"),
  )) {
    const x = BELT.rollerW / 2 + 0.002,
      y = BELT.top - BELT.slatRise - BELT.rollerR;
    const z =
      -BELT.rollerSpan + Number(group.binding.split(":")[1]) * BELT.rollerGap;
    const center = project([x, y, z]);
    patches.push(
      [
        [-r, -r],
        [r, -r],
        [r, r],
        [-r, r],
      ].map(([dy, dz]) => project([x, y + dy, z + dz])),
    );
    const mark = make("path");

    // Project the rotating endpoints into screen coordinates so stroke weight
    // stays isotropic; the path itself has only four points per roller.
    mark.setAttribute("fill", "none");
    mark.setAttribute("stroke", "currentColor");
    mark.setAttribute("stroke-linecap", "round");
    layer.append(mark);
    marks.push({ mark, center });
  }
  let previous;
  return {
    draw(shift) {
      if (shift === previous) return;
      previous = shift;
      const a = -shift / BELT.rollerR,
        c = Math.cos(a) * r,
        s = Math.sin(a) * r;
      for (const { mark, center } of marks) {
        const p = (y, z) => [
          center[0] - z / Math.SQRT2,
          center[1] + (-2 * y + z) / Math.sqrt(6),
        ];
        mark.setAttribute(
          "d",
          segmentPath(p(c, s), p(-c, -s)) + segmentPath(p(-s, c), p(s, -c)),
        );
      }
    },
    resize(query, width) {
      const visible = [];
      for (const patch of patches) {
        const plane = projectedTriangle(
          patch.slice(0, 3),
          "ground",
          true,
        ).plane;
        let fragments = [patch];
        for (const other of query(bounds(patch))) {
          fragments = fragments.flatMap((p) =>
            subtractTriangle(p, other, plane),
          );
          if (!fragments.length) break;
        }
        visible.push(...fragments);
      }
      outline.setAttribute("d", visible.map(polygonPath).join(""));
      for (const { mark } of marks)
        mark.setAttribute("stroke-width", String(width));
    },
  };
}

// The face marks sit just outside the roller mesh. Only these two lines need
// to turn to suggest motion; keeping the teeth fixed preserves their caches.
export function splitRollerMarks(groups) {
  return groups.flatMap((group) => {
    if (!group.binding.startsWith("roller:")) return [group];
    const body = [],
      marks = [];
    for (const line of group.lines) {
      const [a, b] = line;
      const onFace =
        group.vertices[a * 3] > BELT.rollerW / 2 + 0.001 &&
        group.vertices[b * 3] > BELT.rollerW / 2 + 0.001;
      (onFace ? marks : body).push(line);
    }
    return [
      { ...group, binding: `${group.binding}:fixed`, lines: body },
      { ...group, faces: [], lines: marks },
    ];
  });
}
