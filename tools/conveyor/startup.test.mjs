import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createGate } from "./gate.js";
import { unpackGeometry } from "./geometry-codec.js";
import { Element, installSvgSink } from "./svg-sink.mjs";

const data = unpackGeometry(
  JSON.parse(
    await readFile(
      new URL(
        "../../src/components/home/HeroSection/conveyor/svg-geometry.json",
        import.meta.url,
      ),
    ),
  ),
);

test("startup draws once and unchanged resize notifications preserve the scene", () => {
  const notifyResize = installSvgSink();
  globalThis.devicePixelRatio = 2;
  const container = new Element();
  container.clientWidth = 1280;
  container.clientHeight = 416;
  const gate = createGate(container, data, {
    place: { x: 0.46 },
    record: true,
  });
  assert.equal(gate.samples.length, 1);
  gate.draw(data.start);
  notifyResize();
  assert.equal(gate.samples.length, 1);
  gate.draw(1);
  assert.equal(gate.samples.length, 2);
  // Equal aspect ratios still need new clipping at a different pixel height.
  container.clientWidth /= 2;
  container.clientHeight /= 2;
  notifyResize();
  assert.equal(gate.samples.length, 3);
  globalThis.devicePixelRatio = 1;
  notifyResize();
  assert.equal(gate.samples.length, 4);
  notifyResize();
  gate.draw(1);
  assert.equal(gate.samples.length, 4);
  gate.destroy();
  notifyResize();
  assert.equal(gate.samples.length, 4);
});
