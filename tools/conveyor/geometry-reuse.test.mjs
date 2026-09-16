import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { unpackGeometry } from "./geometry-codec.js";
import {
  bounds,
  transform,
  projectedPose,
  projectIndexed,
  bindingVisible,
} from "./projection.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
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
const timeline = createTimeline(data.sky);

test("reused arm and box vertices match independent transforms through a full loop", () => {
  for (const group of data.groups.filter((g) =>
    /^(box:|jaw:|upper$|fore$|wrist$|rotor$)/.test(g.binding),
  )) {
    const vertices = [];
    let previous;
    for (let t = 0; t < timeline.loop; t += 1 / 60) {
      const frame = timeline.describe(t);
      if (!bindingVisible(group.binding, frame)) continue;
      const pose = projectedPose(group.binding, frame);
      const reused = projectIndexed(group, frame, pose, vertices);
      assert.deepEqual(reused, projectIndexed(group, frame));
      if (previous) assert.equal(vertices[0], previous);
      previous = vertices[0];
      for (let i = 0; i < vertices.length; i++) {
        const expected = transform(
          group.vertices.slice(i * 3, i * 3 + 3),
          group.binding,
          frame,
        );
        for (let axis = 0; axis < 3; axis++)
          assert.ok(Math.abs(vertices[i][axis] - expected[axis]) < 1e-10);
      }
    }
  }
});

test("bounds preserve empty, signed-zero, and nonfinite semantics", () => {
  for (const points of [
    [],
    [
      [0, -0],
      [-0, 0],
    ],
    [
      [NaN, 1],
      [2, Infinity],
    ],
    [
      [-4, 2],
      [5, -1],
      [0, 7],
    ],
  ]) {
    assert.deepEqual(bounds(points), [
      Math.min(...points.map((p) => p[0])),
      Math.min(...points.map((p) => p[1])),
      Math.max(...points.map((p) => p[0])),
      Math.max(...points.map((p) => p[1])),
    ]);
  }
});
