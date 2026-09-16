import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import * as THREE from "three";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";
import { createBelt } from "../../src/components/home/HeroSection/conveyor/parts/belt.js";
import { createMachine } from "../../src/components/home/HeroSection/conveyor/parts/machine.js";
import { createBoxes } from "../../src/components/home/HeroSection/conveyor/parts/boxes.js";
import { createArm } from "../../src/components/home/HeroSection/conveyor/parts/arm.js";
import {
  createTimeline,
  TUBES,
} from "../../src/components/home/HeroSection/conveyor/timeline.js";
import {
  frameCamera,
  skyOffset,
} from "../../src/components/home/HeroSection/conveyor/view.js";
import {
  black,
  fineMat,
  lampMat,
} from "../../src/components/home/HeroSection/conveyor/materials.js";

const scene = new THREE.Scene();
const belt = createBelt(scene);
const machine = createMachine(scene);
const boxes = createBoxes(scene);
const arm = createArm(scene);
const sky = TUBES.map(() => 0);
for (const place of [CONFIG.aside, CONFIG.below]) {
  frameCamera(1, place);
  TUBES.forEach((tube, i) => {
    sky[i] = Math.max(
      sky[i],
      skyOffset(new THREE.Vector3(0, tube.topY, tube.z)),
    );
  });
}
const timeline = createTimeline(sky);
const cycle = timeline.cycles.find((entry) => entry.entry?.reject);
const start = cycle.start + cycle.armStart;
const duration = Object.values(CONFIG.arm).reduce(
  (sum, value) => sum + value,
  0,
);
const frame = timeline.describe(start);
for (const part of [belt, machine, boxes, arm]) part.apply(frame);
scene.updateMatrixWorld(true);

const bindings = new Map();
bindings.set(boxes.groups[cycle.box], `box:${cycle.box}`);
for (const key of ["upper", "fore", "wrist", "rotor"])
  bindings.set(arm.parts[key], key);
for (const jaw of arm.parts.jaws) bindings.set(jaw, `jaw:${jaw.userData.side}`);
const groups = new Map();
const vector = new THREE.Vector3();
scene.traverse((object) => {
  if (!object.isMesh) return;
  let anchor = object;
  while (anchor && !bindings.has(anchor)) anchor = anchor.parent;
  const binding = anchor ? bindings.get(anchor) : "static";
  let group = groups.get(binding);
  if (!group) {
    group = { binding, triangles: [], lines: [] };
    groups.set(binding, group);
  }
  const matrix = anchor
    ? anchor.matrixWorld.clone().invert().multiply(object.matrixWorld)
    : object.matrixWorld;
  const point = (attribute, index) => {
    vector.fromBufferAttribute(attribute, index).applyMatrix4(matrix);
    return vector.toArray().map((value) => Number(value.toFixed(7)));
  };
  if (object.isLineSegments2) {
    const a = object.geometry.attributes.instanceStart;
    const b = object.geometry.attributes.instanceEnd;
    for (let i = 0; i < a.count; i++) {
      group.lines.push([
        ...point(a, i),
        ...point(b, i),
        object.material === fineMat ? 1 : 0,
      ]);
    }
  } else {
    const position = object.geometry.attributes.position;
    const index = object.geometry.index;
    const count = index ? index.count : position.count;
    const color =
      object.material === black
        ? "ink"
        : object.material === lampMat
          ? "lamp"
          : "ground";
    for (let i = 0; i < count; i += 3) {
      group.triangles.push([
        ...point(position, index ? index.getX(i) : i),
        ...point(position, index ? index.getX(i + 1) : i + 1),
        ...point(position, index ? index.getX(i + 2) : i + 2),
        color,
        object.material.side === THREE.DoubleSide,
      ]);
    }
  }
});
const data = {
  sky,
  start,
  duration,
  loop: timeline.loop,
  groups: [...groups.values()],
};
const output = new URL("../../../../.artifacts/conveyor/", import.meta.url);
await mkdir(output, { recursive: true });
const json = JSON.stringify(data);
await writeFile(new URL("gate-geometry.json", output), json);
console.log(
  JSON.stringify({
    start,
    duration,
    groups: data.groups.length,
    triangles: data.groups.reduce((n, g) => n + g.triangles.length, 0),
    lines: data.groups.reduce((n, g) => n + g.lines.length, 0),
    bytes: json.length,
    gzip: gzipSync(json).length,
  }),
);
