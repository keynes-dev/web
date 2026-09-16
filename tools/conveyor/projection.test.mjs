import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";
import { createArm } from "../../src/components/home/HeroSection/conveyor/parts/arm.js";
import { createBoxes } from "../../src/components/home/HeroSection/conveyor/parts/boxes.js";
import { createTimeline } from "../../src/components/home/HeroSection/conveyor/timeline.js";
import {
  camera,
  frameCamera,
} from "../../src/components/home/HeroSection/conveyor/view.js";
import {
  frameView,
  project,
  projectedTriangle,
  subtractTriangle,
  transform,
  visibleSegments,
} from "./projection.js";

const data = JSON.parse(
  await readFile(
    new URL(
      "../../../../.artifacts/conveyor/gate-geometry.json",
      import.meta.url,
    ),
  ),
);
const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

test("SVG framing matches the original camera across breakpoints, zoom, and DPR", () => {
  for (const width of [320, 390, 640, 768, 1023, 1024, 1280, 1440, 1920]) {
    const height = width < 640 ? 224 : width < 1024 ? 256 : 416;
    for (const zoom of [0.8, 1, 1.2])
      for (const dpr of [1, 2]) {
        const placement = {
          ...(width < 1024 ? CONFIG.below : CONFIG.aside),
          zoom,
        };
        const view = frameView(width, height, placement);
        frameCamera(width / height, placement);
        for (const point of [
          [0, 0, 0],
          [0, 1.13, 0],
          [1, 2, 3],
          [-2, 5, -1],
        ]) {
          const reference = new THREE.Vector3(...point).project(camera);
          const candidate = project(point);
          near(
            (dpr * (reference.x + 1) * width) / 2,
            (dpr * (candidate[0] - view[0]) * width) / view[2],
          );
          near(
            (dpr * (1 - reference.y) * height) / 2,
            (dpr * (candidate[1] - view[1]) * height) / view[3],
          );
        }
      }
  }
});

test("all articulated transforms agree with Three.js throughout the rejected turn", () => {
  const scene = new THREE.Scene();
  const arm = createArm(scene),
    boxes = createBoxes(scene);
  const timeline = createTimeline(data.sky);
  const bindings = new Map(
    Object.entries(arm.parts).filter(([name]) => name !== "jaws"),
  );
  for (const jaw of arm.parts.jaws)
    bindings.set(`jaw:${jaw.userData.side}`, jaw);
  boxes.groups.forEach((box, i) => bindings.set(`box:${i}`, box));
  for (let sample = 0; sample <= 114; sample++) {
    const frame = timeline.describe(data.start + sample / 60);
    arm.apply(frame);
    boxes.apply(frame);
    scene.updateMatrixWorld(true);
    for (const [binding, object] of bindings)
      for (const point of [
        [0, 0, 0],
        [0.13, -0.2, 0.35],
      ]) {
        const expected = project(
          new THREE.Vector3(...point)
            .applyMatrix4(object.matrixWorld)
            .toArray(),
        );
        transform(point, binding, frame).forEach((value, i) =>
          near(value, expected[i]),
        );
      }
  }
});

test("occlusion clips at depth crossings instead of sorting by average depth", () => {
  const triangle = projectedTriangle(
    [
      [-2, -2, -2],
      [2, -2, 2],
      [0, 2, 0],
    ],
    "ground",
    true,
  );
  const segments = visibleSegments([-0.5, 0, 0], [0.5, 0, 0], [triangle]);
  assert.equal(segments.length, 1);
  near(segments[0][0][0], -0.5);
  near(segments[0][1][0], 0.00003);
});

test("a coplanar surface preserves its own outline and rear surfaces do not cut it", () => {
  const triangle = projectedTriangle(
    [
      [-2, -2, 0],
      [2, -2, 0],
      [0, 2, 0],
    ],
    "ground",
    true,
  );
  assert.deepEqual(visibleSegments([-0.5, 0, 0], [0.5, 0, 0], [triangle]), [
    [
      [-0.5, 0, 0],
      [0.5, 0, 0],
    ],
  ]);
  assert.deepEqual(visibleSegments([-0.5, 0, 1], [0.5, 0, 1], [triangle]), [
    [
      [-0.5, 0, 1],
      [0.5, 0, 1],
    ],
  ]);
});

test("fully covered colored faces disappear without degenerate fragment growth", () => {
  const cover = projectedTriangle(
    [
      [-2, -2, 1],
      [2, -2, 1],
      [0, 2, 1],
    ],
    "ground",
    true,
  );
  const face = [
    [-0.1, -0.1, 0],
    [0.1, -0.1, 0],
    [0, 0.1, 0],
  ];
  assert.deepEqual(subtractTriangle(face, cover, [0, 0, 0]), []);
  const behind = projectedTriangle(
    [
      [-2, -2, -1],
      [2, -2, -1],
      [0, 2, -1],
    ],
    "ground",
    true,
  );
  assert.deepEqual(subtractTriangle(face, behind, [0, 0, 0]), [face]);
});

test("indexed projection preserves every visible face throughout the turn", async () => {
  const { projectGroup, projectIndexed } = await import("./projection.js");
  const compiled = JSON.parse(
    await readFile(
      new URL(
        "../../../../.artifacts/conveyor/gate-compiled.json",
        import.meta.url,
      ),
    ),
  );
  const timeline = createTimeline(data.sky);
  assert.deepEqual(compiled.sky, data.sky);
  assert.equal(compiled.start, data.start);
  assert.equal(compiled.loop, data.loop);
  for (let sample = 0; sample <= 114; sample++) {
    const frame = timeline.describe(data.start + sample / 60);
    for (const group of compiled.groups) {
      const actual = projectIndexed(group, frame);
      const expected = projectGroup(
        data.groups.find((g) => g.binding === group.binding),
        frame,
      );
      assert.equal(actual.triangles.length, expected.triangles.length);
      assert.equal(actual.lines.length, expected.lines.length);
      for (let i = 0; i < actual.triangles.length; i++) {
        assert.equal(actual.triangles[i].color, expected.triangles[i].color);
        actual.triangles[i].points.forEach((p, j) =>
          p.forEach((v, k) =>
            near(v, expected.triangles[i].points[j][k], 2e-7),
          ),
        );
      }
      actual.lines.forEach((line, i) => {
        for (const end of ["a", "b"])
          line[end].forEach((v, j) => near(v, expected.lines[i][end][j], 2e-7));
      });
    }
  }
});

test("spatial queries match brute force across negative coordinates and repeated queries", async () => {
  const { spatialIndex } = await import("./projection.js");
  const triangles = Array.from({ length: 100 }, (_, i) =>
    projectedTriangle(
      [
        [i / 10 - 5, -i / 20, 0],
        [i / 10 - 4.7, -i / 20, 0],
        [i / 10 - 5, -i / 20 + 0.2, 0],
      ],
      "ground",
      true,
    ),
  );
  const query = spatialIndex(triangles);
  for (let i = 0; i < 300; i++) {
    const box = [i / 20 - 7, -4, i / 20 - 6, -1];
    const expected = triangles.filter(
      ({ bounds: b }) =>
        b[0] <= box[2] && b[2] >= box[0] && b[1] <= box[3] && b[3] >= box[1],
    );
    assert.deepEqual(new Set(query(box)), new Set(expected));
  }
  assert.deepEqual(spatialIndex([])([-1, -1, 1, 1]), []);
});

test("complete scene visibility and motion agree with Three.js at 60 samples per second", async () => {
  const { createBelt } =
    await import("../../src/components/home/HeroSection/conveyor/parts/belt.js");
  const { createDucting } =
    await import("../../src/components/home/HeroSection/conveyor/parts/ducting.js");
  const { createMachine } =
    await import("../../src/components/home/HeroSection/conveyor/parts/machine.js");
  const { createItems } =
    await import("../../src/components/home/HeroSection/conveyor/parts/items.js");
  const { bindingVisible } = await import("./projection.js");
  const scene = new THREE.Scene(),
    anchors = new Map();
  const belt = createBelt(scene);
  scene.children.forEach((o, i) =>
    anchors.set(
      i === 0 ? "slats:top" : i === 1 ? "slats:return" : `roller:${i - 2}`,
      o,
    ),
  );
  const duct = createDucting(scene);
  let iris = 0;
  for (const root of scene.children) {
    const blades = root.children.filter((o) => o.userData.phi !== undefined);
    if (blades.length) {
      blades.forEach((o, k) => anchors.set(`iris:${iris}:${k}`, o));
      iris++;
    }
  }
  const count = scene.children.length,
    machine = createMachine(scene);
  anchors.set("nozzle", scene.children[count + 1]);
  const boxes = createBoxes(scene),
    arm = createArm(scene);
  boxes.groups.forEach((o, i) => anchors.set(`box:${i}`, o));
  for (const name of ["upper", "fore", "wrist", "rotor"])
    anchors.set(name, arm.parts[name]);
  for (const o of arm.parts.jaws) anchors.set(`jaw:${o.userData.side}`, o);
  let cursor = scene.children.length;
  const items = createItems(scene);
  for (const pool of ["stack", "fall", "refill"])
    for (let s = 0; s < 3; s++)
      for (
        let k = 0;
        k < (pool === "stack" ? CONFIG.tubeCapacity : CONFIG.itemsPerDrop);
        k++
      )
        anchors.set(`${pool}:${s}:${k}`, scene.children[cursor++]);
  const timeline = createTimeline(data.sky);
  const point = [0.137, -0.217, 0.351];
  for (let sample = 0; sample <= Math.ceil(timeline.loop * 60); sample++) {
    const frame = timeline.describe(Math.min(timeline.loop, sample / 60));
    for (const part of [belt, duct, machine, boxes, arm, items])
      part.apply(frame);
    scene.updateMatrixWorld(true);
    for (const [binding, object] of anchors) {
      assert.equal(
        bindingVisible(binding, frame),
        object.visible,
        `${binding} visibility at ${sample}`,
      );
      if (!object.visible) continue;
      const expected = project(
        new THREE.Vector3(...point).applyMatrix4(object.matrixWorld).toArray(),
      );
      transform(point, binding, frame).forEach((v, i) =>
        near(v, expected[i], 1e-9),
      );
    }
  }
});

test("compiled opaque coverage preserves overlapping solids without transparent gaps", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const sharp = require(
    require.resolve("sharp", { paths: [require.resolve("astro")] }),
  );
  const { projectGroup, polygonPath } = await import("./projection.js");
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../../../.artifacts/conveyor/loop-geometry.json",
        import.meta.url,
      ),
    ),
  );
  const compiled = JSON.parse(
    await readFile(
      new URL(
        "../../../../.artifacts/conveyor/loop-compiled.json",
        import.meta.url,
      ),
    ),
  );
  const geometry = projectGroup(
    raw.groups.find((g) => g.binding === "static"),
    createTimeline(raw.sky).describe(0),
  );
  const complete = geometry.triangles
    .filter((t) => t.color !== "glass")
    .map((t) => polygonPath(t.points))
    .join("");
  const raster = async (path) =>
    sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="-5 -5 10 10"><path d="${path}"/></svg>`,
      ),
    )
      .ensureAlpha()
      .raw()
      .toBuffer();
  const [expected, actual] = await Promise.all([
    raster(complete),
    raster(compiled.ground),
  ]);
  assert.deepEqual(actual, expected);
});

test("stroke occlusion preserves a tapered end beyond the centre-line crossing", async () => {
  const { clippedStroke } = await import("./strokes.js");
  const cover = projectedTriangle(
    [
      [-10, -10, -20.5],
      [30, -10, 19.5],
      [-10, 30, 19.5],
    ],
    "ground",
    true,
  );
  const path = clippedStroke([0, 0, 0], [1, 0, 0], 0.2, [cover]);
  const points = [...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  assert.ok(points.some(([x, y]) => x > 0.59 && y < -0.09));
  assert.ok(points.every(([x, y]) => x + y < 0.5001));
});
