import { polygonPath, project, projectedTriangle } from "./projection.js";

const colors = ["ground", "ink", "lamp", "glass"];
const scale = 1e7;

function encode(values) {
  let previous = 0,
    binary = "";
  for (const value of values) {
    const delta = value - previous;
    previous = value;
    let n = delta < 0 ? -delta * 2 - 1 : delta * 2;
    while (n >= 128) {
      binary += String.fromCharCode((n % 128) | 128);
      n = Math.floor(n / 128);
    }
    binary += String.fromCharCode(n);
  }
  return btoa(binary);
}
function decode(value) {
  const binary = atob(value),
    values = [];
  let previous = 0,
    n = 0,
    factor = 1;
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i);
    n += (byte & 127) * factor;
    if (byte & 128) factor *= 128;
    else {
      previous += n % 2 ? -(n + 1) / 2 : n / 2;
      values.push(previous);
      n = 0;
      factor = 1;
    }
  }
  return values;
}

function packGroup(group) {
  const values = [
    ...new Set(group.vertices.map((v) => Math.round(v * scale))),
  ].sort((a, b) => a - b);
  const indices = new Map(values.map((v, i) => [v, i]));
  return [
    [
      encode(values),
      encode(group.vertices.map((v) => indices.get(Math.round(v * scale)))),
    ],
    [
      encode(group.faces.flatMap(([a, b, c]) => [a, b, c])),
      group.faces.map((f) => colors.indexOf(f[3]) * 2 + Number(f[4])),
    ],
    [
      encode(group.lines.flatMap(([a, b]) => [a, b])),
      group.lines.map((l) => l[2]),
    ],
  ];
}

function unpackGroup([coordinates, faces, lines]) {
  const values = decode(coordinates[0]);
  const vertices = decode(coordinates[1]).map((i) => values[i] / scale);
  const indices = decode(faces[0]),
    edges = decode(lines[0]);
  const group = { vertices, faces: [], lines: [] };
  for (let i = 0; i < indices.length; i += 3)
    group.faces.push([
      indices[i],
      indices[i + 1],
      indices[i + 2],
      colors[Math.floor(faces[1][i / 3] / 2)],
      Boolean(faces[1][i / 3] % 2),
    ]);
  for (let i = 0; i < edges.length; i += 2)
    group.lines.push([edges[i], edges[i + 1], lines[1][i / 2]]);
  return group;
}

export function packGeometry(data, world) {
  const stationary = { vertices: [], faces: [], lines: [] },
    points = new Map();
  function vertex(point) {
    const key = point.join(",");
    if (!points.has(key)) {
      points.set(key, stationary.vertices.length / 3);
      stationary.vertices.push(...point);
    }
    return points.get(key);
  }
  for (const t of data.staticTriangles)
    stationary.faces.push([
      vertex(t.slice(0, 3)),
      vertex(t.slice(3, 6)),
      vertex(t.slice(6, 9)),
      t[9],
      true,
    ]);
  for (const l of data.staticSourceLines)
    stationary.lines.push([vertex(l.slice(0, 3)), vertex(l.slice(3, 6)), l[6]]);
  const templates = [],
    known = new Map(),
    instances = [];
  for (const group of data.groups) {
    const packed = packGroup(group),
      key = JSON.stringify(packed);
    if (!known.has(key)) {
      known.set(key, templates.length);
      templates.push(packed);
    }
    instances.push([group.binding, known.get(key)]);
  }
  return {
    version: 1,
    sky: data.sky,
    start: data.start,
    duration: data.duration,
    loop: data.loop,
    world: Boolean(world),
    stationary: packGroup(world ?? stationary),
    templates,
    instances,
  };
}

export function unpackGeometry(data) {
  if (data.version !== 1)
    throw new Error(`Unsupported conveyor geometry version: ${data.version}`);
  const stationary = unpackGroup(data.stationary),
    templates = data.templates.map(unpackGroup);
  const point = (i) => {
    const p = stationary.vertices.slice(i * 3, i * 3 + 3);
    return data.world ? project(p) : p;
  };
  const round = (p) => p.map((v) => Math.round(v * scale) / scale);
  const projected = stationary.faces
    .map(([a, b, c, color, double]) =>
      projectedTriangle([point(a), point(b), point(c)], color, double),
    )
    .filter(Boolean);
  const staticTriangles = projected.map((t) => [
    ...t.points.flat().map((v) => Math.round(v * scale) / scale),
    t.color,
  ]);
  return {
    sky: data.sky,
    start: data.start,
    duration: data.duration,
    loop: data.loop,
    ground: projected
      .filter((t) => t.color !== "glass")
      .map((t) => polygonPath(t.points))
      .join(""),
    staticTriangles,
    staticSourceLines: stationary.lines.map(([a, b, fine]) => [
      ...round(point(a)),
      ...round(point(b)),
      fine,
    ]),
    groups: data.instances.map(([binding, index]) => ({
      binding,
      ...templates[index],
    })),
  };
}
