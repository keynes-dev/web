import assert from "node:assert/strict";
import test from "node:test";
import { stationaryStrokes } from "./stationary-strokes.js";
import { Element, installSvgSink } from "./svg-sink.mjs";
import { bounds, projectedTriangle } from "./projection.js";

test("stationary batches skip unchanged regions and restore strokes after an occluder leaves", () => {
  installSvgSink();
  const hosts = [new Element(), new Element()];
  const lines = Array.from({ length: 256 }, (_, i) => {
    const x = i < 128 ? 0 : 100;
    const a = [x, i % 128, 0],
      b = [x + 1, i % 128, 0];
    return { a, b, fine: 0, bounds: bounds([a, b]) };
  });
  const drawing = stationaryStrokes(hosts, lines, () => true);
  let revision = "",
    checks = 0;
  const dependencies = (box) => (box[0] < 50 ? revision : "");
  const occluder = projectedTriangle(
    [
      [-1, -1, 1],
      [3, -1, 1],
      [-1, 300, 1],
    ],
    "ground",
    true,
  );
  const query = () => {
    checks++;
    return revision ? [occluder] : [];
  };
  drawing.draw(dependencies, query);
  const original = hosts[0].children.map((n) => n.getAttribute("d"));
  assert.equal(checks, 256);
  drawing.draw(dependencies, query);
  assert.equal(checks, 256);
  revision = "moving";
  drawing.draw(dependencies, query);
  assert.equal(checks, 384);
  assert.notEqual(hosts[0].children[0].getAttribute("d"), original[0]);
  assert.equal(hosts[0].children[1].getAttribute("d"), original[1]);
  revision = "";
  drawing.draw(dependencies, query);
  assert.equal(checks, 512);
  assert.deepEqual(
    hosts[0].children.map((n) => n.getAttribute("d")),
    original,
  );
  stationaryStrokes(hosts, [], () => true);
  assert.equal(hosts[0].children.length, 0);
});
