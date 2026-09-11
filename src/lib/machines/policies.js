/*
  A denied request revised in place. Four cubes arrive on one trolley, the
  height gate refuses them, and a two-link pincer removes the upper pair before
  the same trolley retries in its original direction.

  The host supplies the drafting helpers and materials. This module owns no
  camera, renderer, browser lifecycle, or shared material state.
*/
import * as THREE from "three";

import {
  createPolicyTimeline,
  POLICY_GEOMETRY,
  POLICY_PHASES,
} from "./policies-timeline.js";

const COLORS = Object.freeze({
  amber: 0xf2b705,
  red: 0xe3262e,
  green: 0x18b85a,
});

const BELT = Object.freeze({
  minX: -3.52,
  length: 7.04,
  width: 1.35,
  top: 0.45,
  slatPitch: 0.32,
  rollerR: (0.32 * 3) / (2 * Math.PI),
});

export const POLICY_ARM_GEOMETRY = Object.freeze({
  x: POLICY_GEOMETRY.stopX,
  shoulderY: 3.45,
  shoulderZ: 2.55,
  upper: 1.45,
  fore: 1.45,
  wristOffsetY: 0.72,
  pedestalHalfDepth: 0.15,
  trayFarZ: 1.94,
});
const ARM = POLICY_ARM_GEOMETRY;

function addBox(parent, draft, ...dimensions) {
  const object = draft.box(...dimensions);
  parent.add(object);
  return object;
}

function createTransport(root, draft) {
  const slats = [];
  const count = Math.round(BELT.length / BELT.slatPitch);
  for (let index = 0; index < count; index++) {
    const slat = addBox(
      root,
      draft,
      BELT.slatPitch - 0.045,
      0.07,
      BELT.width,
      0,
      BELT.top - 0.035,
      0,
    );
    slat.userData.offset = index * BELT.slatPitch;
    slats.push(slat);
  }

  const rollers = [];
  for (const x of [-2.9, -1.95, -1, 0, 1, 1.95, 2.9]) {
    const roller = draft.barrel("z", -0.7, 0.7, BELT.rollerR, BELT.rollerR, {
      radial: 24,
      ring: 0.08,
    });
    roller.position.set(x, BELT.top - BELT.rollerR - 0.06, 0);
    root.add(roller);
    rollers.push(roller);
  }

  addBox(root, draft, BELT.length + 0.18, 0.12, 0.12, 0, 0.08, -0.73);
  addBox(root, draft, BELT.length + 0.18, 0.12, 0.12, 0, 0.08, 0.73);

  return {
    apply(shift) {
      for (const slat of slats) {
        slat.position.x =
          BELT.minX +
          ((((slat.userData.offset + shift) % BELT.length) + BELT.length) %
            BELT.length);
      }
      for (const roller of rollers) roller.rotation.z = -shift / BELT.rollerR;
    },
  };
}

function createTrolley(root, draft) {
  const trolley = new THREE.Group();
  root.add(trolley);
  addBox(trolley, draft, 1.2, 0.14, 0.92, 0, 0.83, 0);
  addBox(trolley, draft, 0.12, 0.25, 1.0, -0.53, 1.0, 0);

  const wheels = [];
  for (const x of [-0.38, 0.38]) {
    for (const z of [-0.39, 0.39]) {
      const wheel = draft.barrel("z", -0.06, 0.06, 0.16, 0.16, {
        radial: 20,
        ring: 0.07,
      });
      wheel.position.set(x, 0.61, z);
      trolley.add(wheel);
      wheels.push(wheel);
    }
  }
  return {
    apply(cart) {
      trolley.visible = cart.visible;
      trolley.position.x = cart.x;
      for (const wheel of wheels) wheel.rotation.z = cart.wheel;
    },
  };
}

function createGate(root, draft, materials) {
  const lintelBottom = POLICY_GEOMETRY.deckTop + POLICY_GEOMETRY.gateClearance;
  const postHeight = 2.82;
  for (const z of [-1.03, 1.03]) {
    addBox(root, draft, 0.24, postHeight, 0.24, 0.12, postHeight / 2, z);
  }
  addBox(root, draft, 0.24, 0.42, 2.3, 0.12, lintelBottom + 0.21, 0);

  const lamp = new THREE.Group();
  lamp.position.set(0.31, lintelBottom + 0.55, 0.78);
  lamp.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), materials.lampMat),
  );
  lamp.add(draft.sphereSilhouette(0.13, new THREE.Vector3()));
  root.add(lamp);
  return {
    apply(colour) {
      materials.lampMat.color.setHex(COLORS[colour]);
    },
  };
}

function createTray(root, draft) {
  addBox(root, draft, 1.08, 0.12, 0.78, -0.82, 0.48, 1.55);
  for (const x of [-1.31, -0.33]) {
    addBox(root, draft, 0.1, 0.36, 0.1, x, 0.24, 1.22);
    addBox(root, draft, 0.1, 0.36, 0.1, x, 0.24, 1.88);
  }
}

function makeLink(draft, length, thickness) {
  const link = new THREE.Group();
  addBox(link, draft, thickness, thickness, length, 0, 0, length / 2);
  return link;
}

export function solvePolicyArm(y, z) {
  const wristY = y + ARM.wristOffsetY;
  const dy = wristY - ARM.shoulderY;
  const dz = z - ARM.shoulderZ;
  const distance = Math.min(Math.hypot(dy, dz), ARM.upper + ARM.fore - 0.001);
  const bend = Math.acos(
    Math.min(
      1,
      Math.max(
        -1,
        (distance * distance - ARM.upper ** 2 - ARM.fore ** 2) /
          (2 * ARM.upper * ARM.fore),
      ),
    ),
  );
  const aim = Math.atan2(-dy, dz);
  const shoulder =
    aim -
    Math.atan2(
      ARM.fore * Math.sin(bend),
      ARM.upper + ARM.fore * Math.cos(bend),
    );
  const elbowY = ARM.shoulderY - Math.sin(shoulder) * ARM.upper;
  const elbowZ = ARM.shoulderZ + Math.cos(shoulder) * ARM.upper;
  return { bend, elbowY, elbowZ, shoulder, wristY, wristZ: z };
}

function createArm(root, draft) {
  const upper = makeLink(draft, ARM.upper, 0.2);
  const fore = makeLink(draft, ARM.fore, 0.17);
  const wrist = new THREE.Group();
  const jaws = [];

  addBox(root, draft, 0.3, 3.45, 0.3, ARM.x, 1.725, ARM.shoulderZ);
  const shoulderJoint = draft.barrel("x", -0.18, 0.18, 0.26, 0.26, {
    radial: 28,
    ring: 0.12,
  });
  shoulderJoint.position.set(ARM.x, ARM.shoulderY, ARM.shoulderZ);
  root.add(shoulderJoint);

  const elbowJoint = draft.barrel("x", -0.16, 0.16, 0.22, 0.22, {
    radial: 28,
    ring: 0.1,
  });
  fore.add(elbowJoint);
  addBox(wrist, draft, 1.08, 0.14, 0.18, 0, 0.64, 0);
  addBox(wrist, draft, 0.24, 0.24, 0.24, 0, 0.72, 0);
  for (const side of [-1, 1]) {
    const jaw = addBox(wrist, draft, 0.1, 1.05, 0.14, 0, 0, 0);
    jaw.userData.side = side;
    jaws.push(jaw);
  }

  root.add(upper, fore, wrist);
  return {
    apply(pose) {
      const joints = solvePolicyArm(pose.y, pose.z);
      upper.position.set(ARM.x, ARM.shoulderY, ARM.shoulderZ);
      upper.rotation.x = joints.shoulder;
      fore.position.set(ARM.x, joints.elbowY, joints.elbowZ);
      fore.rotation.x = joints.shoulder + joints.bend;
      wrist.position.set(ARM.x, pose.y, pose.z);
      const jawX = 0.46 - 0.16 * pose.grip;
      for (const jaw of jaws) jaw.position.x = jaw.userData.side * jawX;
    },
  };
}

function createCubes(root, draft) {
  return Array.from({ length: 4 }, () => {
    const cube = draft.solid(
      new THREE.BoxGeometry(
        POLICY_GEOMETRY.cube,
        POLICY_GEOMETRY.cube,
        POLICY_GEOMETRY.cube,
      ),
    );
    root.add(cube);
    return cube;
  });
}

export function createPolicyMachine({ scene, draft, materials }) {
  const root = new THREE.Group();
  scene.add(root);

  const transport = createTransport(root, draft);
  const trolley = createTrolley(root, draft);
  const gate = createGate(root, draft, materials);
  createTray(root, draft);
  const arm = createArm(root, draft);
  const cubes = createCubes(root, draft);
  const timeline = createPolicyTimeline();

  function update(time) {
    const frame = timeline.describe(time);
    transport.apply(frame.beltShift);
    trolley.apply(frame.cart);
    gate.apply(frame.lamp);
    arm.apply(frame.arm);
    frame.cubes.forEach((cube, index) => {
      cubes[index].visible = cube.visible;
      cubes[index].position.set(cube.x, cube.y, cube.z);
    });
    return frame;
  }

  update(0);
  return {
    loop: timeline.loop,
    still: timeline.still,
    update,
    phases: POLICY_PHASES,
    view: { height: 6.3, target: [0, 1.05, 0.45] },
  };
}
