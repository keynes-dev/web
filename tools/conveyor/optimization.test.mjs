import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { unpackGeometry } from "./geometry-codec.js";
import { createGate } from "./gate.js";
import { Element, installSvgSink } from "./svg-sink.mjs";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";

const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const [original, packed] = await Promise.all(
  ["loop-compiled.json", "loop-packed.json"].map(async (name) =>
    JSON.parse(await readFile(new URL(name, directory))),
  ),
);
const data = unpackGeometry(packed);

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
  const paths = () => drawing.svg.children.map((p) => p.getAttribute("d"));
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
  assert.deepEqual(
    paths(),
    mobile.svg.children.map((p) => p.getAttribute("d")),
  );
  mobile.destroy();
  place = CONFIG.aside;
  Object.assign(container, { clientWidth: 1280, clientHeight: 416 });
  globalThis.devicePixelRatio = 2;
  resize();
  assert.deepEqual(paths(), snapshots.get(0));
  assert.equal(drawing.samples.length, 0);
  drawing.destroy();
});
