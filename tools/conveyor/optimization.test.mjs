import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { unpackGeometry } from "./geometry-codec.js";
import { createGate } from "./gate.js";
import { Element, installSvgSink } from "./svg-sink.mjs";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";
import { splitRollerMarks, continuousBelt, createSeams } from "./belt.js";
import { translatedBoxCache, translateBox } from "./boxes.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import { transform, projectIndexed } from "./projection.js";

const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const [original, packed] = await Promise.all(
  ["loop-compiled.json", "loop-packed.json"].map(async (name) =>
    JSON.parse(await readFile(new URL(name, directory))),
  ),
);
const data = unpackGeometry(packed);

test("both belt runs have continuous visible faces and translated seams in opposite directions", () => {
  installSvgSink();
  const belt = continuousBelt(data.groups);
  assert.equal(belt.triangles.length, 12);
  assert.equal(belt.surfaces.length, 4);
  const svg = new Element();
  const seams = createSeams(svg, belt.surfaces);
  seams.resize(() => [], 0.01);
  seams.draw(0.13);
  const strips = svg.children
    .filter((n) => n.getAttribute("clip-path"))
    .map((n) => n.children[0]);
  const paths = strips.map((p) => p.getAttribute("d"));
  const before = strips.map((p) => p.getAttribute("transform"));
  assert.equal(before[0], before[1]);
  assert.equal(before[2], before[3]);
  assert.notEqual(before[0], before[2]);
  seams.draw(0.21);
  assert.deepEqual(
    strips.map((p) => p.getAttribute("d")),
    paths,
  );
  seams.draw(0.13);
  assert.deepEqual(
    strips.map((p) => p.getAttribute("transform")),
    before,
  );
});

test("box artwork is reused during translation and bypassed during the rejected turn", () => {
  const timeline = createTimeline(data.sky);
  const cache = translatedBoxCache();
  const group = data.groups.find((g) => g.binding === "box:0");
  const first = cache.get(group, timeline.describe(2), (t) => t);
  const nextFrame = timeline.describe(2.1);
  const next = cache.get(group, nextFrame, (t) => t);
  assert.equal(first.artwork, next.artwork);
  assert.notDeepEqual(first.delta, next.delta);
  const translated = translateBox(next);
  const direct = projectIndexed(group, nextFrame);
  assert.equal(translated.triangles.length, direct.triangles.length);
  translated.triangles.forEach((t, i) =>
    t.points
      .flat()
      .forEach((v, j) =>
        assert.ok(Math.abs(v - direct.triangles[i].points.flat()[j]) < 1e-10),
      ),
  );
  const turning = timeline.describe(7.6);
  const index = turning.boxes.findIndex(
    (b) => Math.abs(Math.sin(b.roll)) > 0.1,
  );
  assert.ok(index >= 0);
  assert.equal(
    cache.get(
      data.groups.find((g) => g.binding === `box:${index}`),
      turning,
      (t) => t,
    ),
    null,
  );
  cache.clear();
  assert.notEqual(cache.get(group, nextFrame, (t) => t).artwork, next.artwork);
});

test("roller bodies stay fixed while face marks retain the original rotation", () => {
  const rollers = data.groups.filter((group) =>
    group.binding.startsWith("roller:"),
  );
  const groups = splitRollerMarks(rollers);
  assert.equal(groups.length, rollers.length * 2);
  for (const original of rollers) {
    const body = groups.find(
      (group) => group.binding === `${original.binding}:fixed`,
    );
    const marks = groups.find((group) => group.binding === original.binding);
    assert.equal(marks.lines.length, 2);
    assert.equal(marks.faces.length, 0);
    assert.deepEqual(body.faces, original.faces);
    assert.equal(body.lines.length + marks.lines.length, original.lines.length);
    for (const shift of [0, 0.03, 0.17, 2.4, -0.1]) {
      const frame = { beltShift: shift };
      const point = [0.832, 0.043, 0];
      assert.deepEqual(
        transform(point, body.binding, frame),
        transform(point, original.binding, { beltShift: 0 }),
      );
      assert.deepEqual(
        transform(point, marks.binding, frame),
        transform(point, original.binding, frame),
      );
    }
  }
});

test("packed artwork preserves every coordinate, face, edge, fill path and timing value", () => {
  for (const field of [
    "groups",
    "staticTriangles",
    "staticSourceLines",
    "ground",
    "sky",
    "start",
    "duration",
    "loop",
  ])
    assert.deepEqual(data[field], original[field], field);
  assert.equal(packed.templates.length, 16);
});

test("visibility caches invalidate for nonsequential seeks, viewport changes and DPR", () => {
  const resize = installSvgSink();
  globalThis.devicePixelRatio = 2;
  const container = new Element();
  Object.assign(container, { clientWidth: 1280, clientHeight: 416 });
  let place = CONFIG.aside;
  const drawing = createGate(container, data, { place: () => place });
  const snapshot = (node) =>
    node.getAttribute("display") === "none"
      ? ["hidden"]
      : [
          node.getAttribute("d"),
          node.getAttribute("transform"),
          node.getAttribute("display"),
          node.children.map(snapshot),
        ];
  const paths = () => snapshot(drawing.svg);
  const snapshots = new Map();
  const times = [0, 0.833, 3.85, 7.1, 7.6, 8.5, 12.3, 13.5];
  for (const time of times) {
    drawing.draw(time);
    snapshots.set(time, paths());
  }
  for (const time of times.toReversed()) {
    drawing.draw(time);
    assert.deepEqual(paths(), snapshots.get(time));
  }
  place = CONFIG.below;
  Object.assign(container, { clientWidth: 390, clientHeight: 224 });
  globalThis.devicePixelRatio = 1;
  resize();
  const mobile = createGate(container, data, { place });
  mobile.draw(0);
  assert.deepEqual(paths(), snapshot(mobile.svg));
  mobile.destroy();
  place = CONFIG.aside;
  Object.assign(container, { clientWidth: 1280, clientHeight: 416 });
  globalThis.devicePixelRatio = 2;
  resize();
  assert.deepEqual(paths(), snapshots.get(0));
  assert.equal(drawing.samples.length, 0);
  drawing.destroy();
});
