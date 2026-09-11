/*
  A sparse, single-plane trebuchet for the sweeps figure. The page owns its
  renderer, camera, time controls, and materials; this file only adds objects
  to the supplied scene and seeks them to a pure timeline frame.
*/
import * as THREE from "three";

import {
  BALL_RADIUS,
  BOWL_FLOOR_TOP,
  describeSweeps,
  LOOP,
  PHASES,
  SWEEPS_DIMENSIONS,
  TARGET,
} from "./sweeps-timeline.js";

function outlineSphere(draft, materials) {
  const ball = new THREE.Group();
  ball.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 24, 16),
      materials.white,
    ),
  );
  ball.add(draft.sphereSilhouette(BALL_RADIUS, new THREE.Vector3()));
  return ball;
}

function gear(draft, materials) {
  const group = new THREE.Group();
  group.add(
    draft.barrel("z", -0.18, 0.18, 0.27, 0.27, {
      radial: 20,
      material: materials.white,
    }),
  );
  const spokes = [];
  for (let tooth = 0; tooth < 10; tooth++) {
    const angle = (tooth / 10) * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    spokes.push(0, 0, -0.185, x * 0.35, y * 0.35, -0.185);
  }
  group.add(draft.segments(spokes, materials.fineMat));
  return group;
}

function openBowl(draft, materials) {
  const bowl = new THREE.Group();
  const geometry = new THREE.CylinderGeometry(
    TARGET.radius,
    0.44,
    0.22,
    32,
    1,
    true,
  );
  const shell = new THREE.Mesh(geometry, materials.shell);
  shell.name = "sweeps-bowl-shell";
  shell.position.set(TARGET.x, 0.11, 0);
  const shellEdges = draft.edgeLines(geometry);
  shellEdges.position.copy(shell.position);
  bowl.add(shell, shellEdges);

  const base = new THREE.CylinderGeometry(0.44, 0.44, BOWL_FLOOR_TOP, 24);
  const floor = new THREE.Mesh(base, materials.white);
  floor.position.set(TARGET.x, BOWL_FLOOR_TOP / 2, 0);
  const floorEdges = draft.edgeLines(base);
  floorEdges.material = materials.fineMat;
  floorEdges.position.copy(floor.position);
  bowl.add(floor, floorEdges);
  return bowl;
}

function slingSegments(draft, materials) {
  return draft.segments(
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    materials.lineMat,
  );
}

function smallLamp(draft, materials) {
  const lamp = new THREE.Group();
  lamp.add(
    draft.barrel("z", -0.08, 0.08, 0.08, 0.08, {
      radial: 18,
      material: materials.white,
    }),
  );
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 20, 14),
    materials.lampMat,
  );
  bulb.position.y = 0.11;
  lamp.add(bulb, draft.sphereSilhouette(0.1, new THREE.Vector3(0, 0.11, 0)));
  return lamp;
}

function beamBetween(draft, from, to, z) {
  const beam = new THREE.Group();
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  beam.add(draft.box(length, 0.15, 0.15, length / 2, 0, 0));
  beam.position.set(from.x, from.y, z);
  beam.rotation.z = Math.atan2(to.y - from.y, to.x - from.x);
  return beam;
}

export function createSweepsMachine({ scene, draft, materials }) {
  const { pivot, armLength } = SWEEPS_DIMENSIONS;
  const machine = new THREE.Group();
  const arm = new THREE.Group();
  arm.position.set(pivot.x, pivot.y, 0);
  machine.add(arm);

  // Fore and aft runners are the only depth in the construction. Every moving
  // component and every projectile stays on their centre plane at z = 0.
  for (const z of [-0.5, 0.5])
    machine.add(draft.box(5.2, 0.16, 0.16, 0.25, 0.14, z));
  for (const z of [-0.42, 0.42]) {
    machine.add(beamBetween(draft, { x: -0.9, y: 0.3 }, pivot, z));
    machine.add(beamBetween(draft, { x: 0.9, y: 0.3 }, pivot, z));
  }
  machine.add(draft.box(1.15, 0.14, 0.88, 0, 2.18, 0));
  const axle = draft.barrel("z", -0.62, 0.62, 0.13, 0.13, {
    radial: 24,
    ring: 0.07,
    material: materials.white,
  });
  axle.position.set(pivot.x, pivot.y, 0);
  machine.add(axle);
  for (const z of [-0.52, 0.52]) {
    const lamp = smallLamp(draft, materials);
    lamp.position.set(-0.48, 2.35, z);
    machine.add(lamp);
  }

  arm.add(draft.box(armLength, 0.15, 0.2, armLength / 2, 0, 0));
  arm.add(draft.box(0.92, 0.18, 0.24, -0.46, 0, 0));
  const counterweight = new THREE.Group();
  counterweight.add(draft.box(0.5, 0.58, 0.44, 0, -0.28, 0));
  counterweight.add(
    draft.barrel("z", -0.3, 0.3, 0.12, 0.12, {
      radial: 20,
      material: materials.white,
    }),
  );
  counterweight.children[1].position.set(0, -0.28, 0);
  arm.add(counterweight);
  const leverageGear = gear(draft, materials);
  leverageGear.name = "sweeps-leverage-gear";
  arm.add(leverageGear);

  const releaseLever = new THREE.Group();
  releaseLever.position.set(-0.1, 2.34, -0.48);
  releaseLever.add(draft.box(0.62, 0.09, 0.11, 0.31, 0, 0));
  releaseLever.add(
    draft.barrel("z", -0.08, 0.08, 0.11, 0.11, {
      radial: 18,
      material: materials.white,
    }),
  );
  const notches = [];
  for (let x = 0.32; x <= 0.55; x += 0.115)
    notches.push(x, -0.1, -0.065, x, 0.1, -0.065);
  releaseLever.add(draft.segments(notches, materials.fineMat));
  machine.add(releaseLever);

  const sling = slingSegments(draft, materials);
  machine.add(sling);
  const target = openBowl(draft, materials);
  machine.add(target);

  const balls = PHASES.flatMap((phase, phaseIndex) =>
    phase.throws.map((_, ballIndex) => {
      const ball = outlineSphere(draft, materials);
      ball.name = `sweeps-ball-${phaseIndex * phase.throws.length + ballIndex}`;
      machine.add(ball);
      return ball;
    }),
  );
  scene.add(machine);

  function update(time) {
    const frame = describeSweeps(time);
    arm.rotation.z = frame.angle;
    counterweight.position.x = -frame.leverage;
    leverageGear.position.set(-frame.leverage, -0.04, -0.31);
    leverageGear.rotation.z = frame.gearAngle;
    releaseLever.rotation.z = frame.releaseNotch;
    materials.lampMat.color.setHex(
      frame.adjusting ? 0xf2b705 : frame.phase === 2 ? 0x18b85a : 0xe3262e,
    );

    const open = frame.adjusting
      ? 0
      : Math.min(1, Math.max(0, (frame.shotTime - frame.releaseAt) / 0.22));
    const tip = frame.tip;
    const pouch = frame.pouch;
    const openEnd = {
      x: pouch.x + open * 0.36,
      y: pouch.y - open * 0.22,
      z: 0,
    };
    sling.geometry.setPositions([
      tip.x,
      tip.y,
      0,
      pouch.x,
      pouch.y,
      0,
      tip.x,
      tip.y,
      0,
      openEnd.x,
      openEnd.y,
      0,
    ]);

    frame.balls.forEach((state, index) => {
      const ball = balls[index];
      ball.visible = state.state !== "waiting";
      ball.position.set(state.position.x, state.position.y, state.position.z);
    });
  }

  update(0);
  return {
    loop: LOOP,
    still: PHASES[2].at + PHASES[2].releaseAt + 0.7,
    update,
    phases: PHASES.map(({ label, at }) => ({ label, at })),
    view: { height: 9.4, target: [4.4, 1.9, 0] },
  };
}
