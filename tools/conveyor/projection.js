import {
  ARM,
  BELT,
  IRIS,
  ITEM,
  MACHINE,
  SHAPES,
  CONFIG,
} from "../../src/components/home/HeroSection/conveyor/config.js";

import { TUBES } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import { mod } from "../../src/components/home/HeroSection/conveyor/math.js";

export function project([x, y, z]) {
  return [
    (x - z) / Math.SQRT2,
    (x - 2 * (y - CONFIG.lookAt[1]) + z) / Math.sqrt(6),
    (x + y + z) / Math.sqrt(3),
  ];
}

export function rotate([x, y, z], axis, angle) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  if (axis === "x") return [x, c * y - s * z, s * y + c * z];
  if (axis === "y") return [c * x + s * z, y, -s * x + c * z];
  return [c * x - s * y, s * x + c * y, z];
}

export function transform(point, binding, frame) {
  const arm = frame.arm;
  let p = point;
  let offset = [0, 0, 0];
  if (binding.startsWith("slats:")) {
    const top = binding.split(":")[1] === "top";
    offset = [
      0,
      top
        ? BELT.top - BELT.slatRise / 2
        : BELT.top - 1.5 * BELT.slatRise - 2 * BELT.rollerR,
      (top ? -1 : 1) * mod(frame.beltShift, BELT.slat),
    ];
  } else if (binding.startsWith("roller:")) {
    if (!binding.endsWith(":fixed"))
      p = rotate(p, "x", -frame.beltShift / BELT.rollerR);
    offset = [
      0,
      BELT.top - BELT.slatRise - BELT.rollerR,
      -BELT.rollerSpan + Number(binding.split(":")[1]) * BELT.rollerGap,
    ];
  } else if (binding.startsWith("iris:")) {
    const [, s, k] = binding.split(":").map(Number);
    const phi = (k / IRIS.blades) * Math.PI * 2;
    const beta =
      IRIS.betaShut + frame.iris[s] * (IRIS.betaOpen - IRIS.betaShut);
    p = rotate(p, "y", -(phi + beta));
    offset = [
      IRIS.pivotR * Math.cos(phi),
      TUBES[s].bottomY - IRIS.bladeDrop + k * IRIS.bladeStep,
      TUBES[s].z + IRIS.pivotR * Math.sin(phi),
    ];
  } else if (binding === "nozzle") {
    p = [
      p[0] * (1 + 0.12 * frame.pulse),
      p[1],
      p[2] * (1 + 0.12 * frame.pulse),
    ];
    offset = [0, (MACHINE.nozzleTop + MACHINE.nozzleBottom) / 2, 0];
  } else if (/^(stack|fall|refill):/.test(binding)) {
    const [pool, s0, k0] = binding.split(":");
    const s = Number(s0),
      k = Number(k0),
      shape = SHAPES[s];
    if (pool === "stack")
      offset = [
        0,
        TUBES[s].bottomY + ITEM.lift + k * shape.pitch + frame.stacks[s].shift,
        TUBES[s].z,
      ];
    else {
      const state = pool === "fall" ? frame.falling[k] : frame.refill[s][k];
      const q = fallingQuaternion(s, state);
      p = applyQuaternion([p[0], p[1] - shape.centre, p[2]], q);
      offset = [state.x, state.y, state.z];
    }
  } else if (binding.startsWith("box:")) {
    const box = frame.boxes[Number(binding.slice(4))];
    p = rotate(p, "x", box.roll);
    offset = [0, box.y, box.z];
  } else if (binding === "upper") {
    p = rotate(p, "z", arm.base);
    offset = [ARM.shoulder.x, ARM.shoulder.y, 0];
  } else if (binding === "fore") {
    p = rotate(p, "z", arm.tip);
    offset = [arm.elbowX, arm.elbowY, 0];
  } else if (binding === "wrist") {
    offset = [arm.x, arm.y, 0];
  } else if (binding === "rotor" || binding.startsWith("jaw:")) {
    if (binding.startsWith("jaw:")) {
      const side = Number(binding.slice(4));
      p = rotate(p, "y", -side * ARM.pincerOpen * (1 - arm.grip));
      p[0] += ARM.hinge;
    }
    p = rotate(p, "x", arm.roll);
    offset = [arm.x, arm.y, 0];
  }
  return project(p.map((value, i) => value + offset[i]));
}

export function frameView(width, height, { x = 0, y = 0, zoom = 1 }) {
  const h = CONFIG.frustum * zoom;
  const w = (h * width) / height;
  return [-w * (1 + x), -h * (1 - y), 2 * w, 2 * h];
}

export function projectedTriangle(
  points,
  color = "ground",
  doubleSided = false,
) {
  const [a, b, c] = points;
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(area) < 1e-10 || (!doubleSided && area >= 0)) return null;
  if (area < 0) points = [a, c, b];
  const dx =
    ((b[2] - a[2]) * (c[1] - a[1]) - (c[2] - a[2]) * (b[1] - a[1])) / area;
  const dy =
    ((b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2])) / area;
  return {
    points,
    color,
    plane: [dx, dy, a[2] - dx * a[0] - dy * a[1]],
    bounds: bounds(points),
  };
}

export function bounds(points) {
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const point of points) {
    left = Math.min(left, point[0]);
    top = Math.min(top, point[1]);
    right = Math.max(right, point[0]);
    bottom = Math.max(bottom, point[1]);
  }
  return [left, top, right, bottom];
}

export function planeAt(plane, point) {
  return plane[0] * point[0] + plane[1] * point[1] + plane[2];
}
export function edge(a, b, p) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

export function hiddenInterval(a, b, triangle, epsilon = 0.00003) {
  let lo = 0,
    hi = 1;
  let start = planeAt(triangle.plane, a) - a[2] - epsilon;
  let end = planeAt(triangle.plane, b) - b[2] - epsilon;
  if (start <= 0 && end <= 0) return null;
  if (start < 0) lo = start / (start - end);
  else if (end < 0) hi = start / (start - end);
  const points = triangle.points;
  for (let i = 0; i < 3; i++) {
    start = edge(points[i], points[(i + 1) % 3], a);
    end = edge(points[i], points[(i + 1) % 3], b);
    if (start < 0 && end < 0) return null;
    if (start < 0) lo = Math.max(lo, start / (start - end));
    else if (end < 0) hi = Math.min(hi, start / (start - end));
    if (lo >= hi) return null;
  }
  return [lo, hi];
}

export function visibleSegments(a, b, triangles) {
  const covered = [];
  for (const triangle of triangles) {
    const interval = hiddenInterval(a, b, triangle);
    if (interval?.[0] === 0 && interval[1] === 1) return [];
    if (interval) covered.push(interval);
  }
  covered.sort((x, y) => x[0] - y[0]);
  const result = [];
  let cursor = 0;
  const at = (t) => a.map((value, i) => value + t * (b[i] - value));
  for (const [lo, hi] of covered) {
    if (lo > cursor + 1e-7) result.push([at(cursor), at(lo)]);
    cursor = Math.max(cursor, hi);
    if (cursor >= 1) break;
  }
  if (cursor < 1 - 1e-7) result.push([at(cursor), b]);
  return result;
}

export function clipPolygon(polygon, distance) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length];
    const da = distance(a),
      db = distance(b);
    if (da >= 0) result.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      result.push(a.map((value, j) => value + t * (b[j] - value)));
    }
  }
  let area = 0;
  for (let i = 0; i < result.length; i++) {
    const a = result[i],
      b = result[(i + 1) % result.length];
    area += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(area) > 1e-12 ? result : [];
}

export function subtractTriangle(polygon, occluder, plane) {
  const delta = occluder.plane.map((v, i) => v - plane[i]);
  if (polygon.every((p) => planeAt(delta, p) <= 0.00003)) return [polygon];
  for (let i = 0; i < 3; i++) {
    const a = occluder.points[i],
      b = occluder.points[(i + 1) % 3];
    if (polygon.every((p) => edge(a, b, p) < 0)) return [polygon];
  }
  const cuts = [
    (p) => planeAt(occluder.plane, p) - planeAt(plane, p) - 0.00003,
    ...occluder.points.map(
      (a, i) => (p) => edge(a, occluder.points[(i + 1) % 3], p),
    ),
  ];
  let overlap = polygon;
  for (const cut of cuts) {
    overlap = clipPolygon(overlap, cut);
    if (overlap.length < 3) return [polygon];
  }
  let inside = polygon;
  const outside = [];
  for (const cut of cuts) {
    if (inside.length < 3) break;
    const part = clipPolygon(inside, (p) => -cut(p));
    if (part.length >= 3) outside.push(part);
    inside = clipPolygon(inside, cut);
  }
  return outside;
}

export function spatialIndex(triangles) {
  const cells = new Map(),
    step = 0.3;
  const minY = Math.floor(
    Math.min(...triangles.map((t) => t.bounds[1])) / step,
  );
  const maxY = Math.floor(
    Math.max(...triangles.map((t) => t.bounds[3])) / step,
  );
  const stride = maxY - minY + 1;
  const seen = new Float64Array(triangles.length);
  let stamp = 0;
  triangles.forEach((triangle, index) => {
    const box = triangle.bounds;
    for (let x = Math.floor(box[0] / step); x <= Math.floor(box[2] / step); x++)
      for (
        let y = Math.floor(box[1] / step);
        y <= Math.floor(box[3] / step);
        y++
      ) {
        const key = x * stride + y - minY;
        let cell = cells.get(key);
        if (!cell) {
          cell = [];
          cells.set(key, cell);
        }
        cell.push(index);
      }
  });
  return (box) => {
    const found = [];
    stamp++;
    for (let x = Math.floor(box[0] / step); x <= Math.floor(box[2] / step); x++)
      for (
        let y = Math.max(minY, Math.floor(box[1] / step));
        y <= Math.min(maxY, Math.floor(box[3] / step));
        y++
      ) {
        const cell = cells.get(x * stride + y - minY);
        if (!cell) continue;
        for (const index of cell) {
          if (seen[index] === stamp) continue;
          seen[index] = stamp;
          const triangle = triangles[index],
            b = triangle.bounds;
          if (
            b[0] <= box[2] &&
            b[2] >= box[0] &&
            b[1] <= box[3] &&
            b[3] >= box[1]
          )
            found.push(triangle);
        }
      }
    return found;
  };
}

export function projectGroup(group, frame) {
  const triangles = [],
    lines = [];
  const point = (values, offset) =>
    transform(values.slice(offset, offset + 3), group.binding, frame);
  for (const values of group.triangles) {
    const triangle = projectedTriangle(
      [point(values, 0), point(values, 3), point(values, 6)],
      values[9],
      values[10],
    );
    if (triangle) triangles.push(triangle);
  }
  for (const values of group.lines)
    lines.push({ a: point(values, 0), b: point(values, 3), fine: values[6] });
  return { triangles, lines };
}

const number = (value) => Math.round(value * 1e5) / 1e5;
export const polygonPath = (points) =>
  `M${points.map((p) => `${number(p[0])},${number(p[1])}`).join("L")}Z`;
export const segmentPath = (a, b) =>
  `M${number(a[0])},${number(a[1])}L${number(b[0])},${number(b[1])}`;

export function projectedPose(binding, frame) {
  return [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ].map((p) => transform(p, binding, frame));
}

// Returned geometry borrows the optional buffer; keep one buffer per moving group.
export function projectIndexed(
  group,
  frame,
  pose = projectedPose(group.binding, frame),
  vertices = [],
) {
  const origin = pose[0];
  const axes = pose.slice(1).map((p) => p.map((v, i) => v - origin[i]));
  for (let i = 0; i < group.vertices.length; i += 3) {
    const x = group.vertices[i],
      y = group.vertices[i + 1],
      z = group.vertices[i + 2];
    const point = vertices[i / 3] ?? (vertices[i / 3] = [0, 0, 0]);
    for (let k = 0; k < 3; k++)
      point[k] = origin[k] + x * axes[0][k] + y * axes[1][k] + z * axes[2][k];
  }
  const triangles = [];
  for (const [a, b, c, color, double] of group.faces) {
    const triangle = projectedTriangle(
      [vertices[a], vertices[b], vertices[c]],
      color,
      double,
    );
    if (triangle) triangles.push(triangle);
  }
  return {
    binding: group.binding,
    triangles,
    lines: group.lines.map(([a, b, fine]) => ({
      a: vertices[a],
      b: vertices[b],
      fine,
    })),
  };
}

export function fallingQuaternion(shape, state) {
  if (shape === 2) return [0, 0, 0, 1];
  const n = shape * CONFIG.itemsPerDrop + state.spin;
  const axis = [
    Math.cos(n * 2.399),
    0.45 * Math.cos(n * 1.13),
    Math.sin(n * 2.399),
  ];
  const length = Math.hypot(...axis),
    angle = ((4.6 + 1.4 * (n % 4)) * state.t) / 2;
  let q = [...axis.map((v) => (v / length) * Math.sin(angle)), Math.cos(angle)];
  if (state.square > 0) {
    // Interpolate along the shortest quaternion arc toward identity.
    const sign = q[3] < 0 ? -1 : 1,
      cos = Math.abs(q[3]);
    if (cos >= 1) return q;
    const sine = Math.sqrt(1 - cos * cos);
    if (sine * sine <= Number.EPSILON) {
      q = q.map(
        (v, i) => v * (1 - state.square) + (i === 3 ? sign * state.square : 0),
      );
      const norm = Math.hypot(...q);
      return q.map((v) => v / norm);
    }
    const theta = Math.atan2(sine, cos);
    const a = Math.sin((1 - state.square) * theta) / sine,
      b = Math.sin(state.square * theta) / sine;
    q = q.map((v, i) => a * v + (i === 3 ? sign * b : 0));
  }
  return q;
}
export function applyQuaternion([x, y, z], [qx, qy, qz, qw]) {
  const tx = 2 * (qy * z - qz * y),
    ty = 2 * (qz * x - qx * z),
    tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + qy * tz - qz * ty,
    y + qw * ty + qz * tx - qx * tz,
    z + qw * tz + qx * ty - qy * tx,
  ];
}
export function bindingVisible(binding, frame) {
  const [pool, s0, k0] = binding.split(":"),
    s = Number(s0),
    k = Number(k0);
  if (pool === "stack") return k < frame.stacks[s].count;
  if (pool === "fall") return s === frame.shape && frame.falling[k].visible;
  if (pool === "refill") return frame.refill[s][k].visible;
  return true;
}
