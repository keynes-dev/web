/*
  A parent gumball globe funded with two of every Resource kind drains through
  forked ducting into two child globes. Each child drops one Resource into a
  tray passing underneath on the belt; what it does not spend climbs the
  outboard riser back into the parent. The depleted Budget then leaves the
  frame and a fresh one takes its place.

  The whole machine hangs on one gantry: two posts carry the children on
  brackets and the parent on a beam between them, which is also what the return
  risers run up. Nothing here is free-standing over the belt.
*/
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { IRIS } from "../conveyor/config.js";
import { createIris } from "../conveyor/parts/iris.js";
import { createShapeItems } from "../conveyor/shapes.js";
import { mod } from "../conveyor/math.js";
import { UP } from "../conveyor/view.js";
import {
  BUDGET_GEOMETRY,
  createBudgetTimeline,
  forkPath,
} from "./budgets-timeline.js";

// Height and target are the projected bounding box of the whole gantry in
// this fixed isometric, not a guess: the belt lies across the view axis, so
// its length spends frame height as freely as the machine's own.
const VIEW = Object.freeze({ height: 8.1, target: [-0.175, 2.6, -0.29] });

const { big: BIG, small: SMALL, tray: TRAY, belt: BELT, riser: RISER } =
  BUDGET_GEOMETRY;

const GANTRY_Z = -0.95;
const DUCT_R = 0.17;
const RISER_R = 0.15;
const BELT_HALF = 2.9;
const BELT_HALF_DEPTH = 0.45;
const SLAT = 0.24;
const SLAT_RISE = 0.06;
const ROLLER_R = 0.16;

const vec = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// The chord the globe cuts at the height its floor plate sits, which is how
// wide that plate can be without standing proud of the glass.
function chord(radius, centreY, atY) {
  return Math.sqrt(Math.max(0, radius * radius - (atY - centreY) ** 2));
}

// The glass globe itself. Drawn as a tinted shell with its outline against the
// fixed camera, since a sphere's silhouette never falls out of edge extraction.
function globe(draft, materials, x, centreY, radius) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 24),
    materials.glass,
  );
  shell.renderOrder = 5;
  shell.position.set(x, centreY, 0);
  group.add(shell);
  group.add(draft.sphereSilhouette(radius, vec(x, centreY, 0)));
  return group;
}

/*
  A machine: the globe, the plate its Resources stand on, the funnel that
  drains it, the spout, and the flap across the spout. The flap is returned on
  its own because it is the only part of the machine that moves.
*/
function machine(
  draft,
  materials,
  { x, centreY, radius, floorTop, mouthY, crown = "cap" },
) {
  const group = new THREE.Group();
  const plateR = chord(radius, centreY, floorTop);
  const throatR = radius * 0.32;
  const spoutR = radius * 0.2;

  group.add(globe(draft, materials, x, centreY, radius));
  // The band the glass seats into, and the plate inside it. The band is kept
  // inside the chord the glass cuts here: standing it proud reads as a saucer
  // the globe is sitting in rather than as a seat inside the globe.
  const collar = draft.barrel(
    "y",
    floorTop - 0.08,
    floorTop + 0.03,
    plateR * 0.96,
  );
  collar.position.x = x;
  group.add(collar);
  const plate = draft.thin(
    draft.barrel("y", floorTop - 0.04, floorTop, plateR * 0.7),
  );
  plate.position.x = x;
  group.add(plate);

  // Funnel down to the spout, then the spout itself.
  const funnel = draft.barrel(
    "y",
    mouthY + 0.16,
    floorTop - 0.07,
    throatR,
    plateR * 0.88,
  );
  funnel.position.x = x;
  group.add(funnel);
  const spout = draft.barrel("y", mouthY, mouthY + 0.18, spoutR, throatR);
  spout.position.x = x;
  group.add(spout);
  group.add(draft.flange(vec(x, mouthY + 0.17), UP, spoutR, { lip: 0.05 }));

  // The crown cap, so the globe reads as a vessel that is filled from above.
  // The parent has a port there instead, so it says so.
  if (crown === "cap") {
    const cap = draft.barrel(
      "y",
      centreY + radius - 0.06,
      centreY + radius + 0.1,
      radius * 0.3,
      radius * 0.22,
    );
    cap.position.x = x;
    group.add(cap);
  }

  const gate = new THREE.Group();
  gate.add(draft.box(spoutR * 2.4, 0.05, spoutR * 2.4, spoutR * 1.2, 0, 0));
  gate.position.set(x - spoutR * 1.2, mouthY - 0.02, 0);
  return { group, gate };
}

/*
  The forked duct that drains the parent into both children, built along the
  same centreline the allocation follows. The fittings are the conveyor's —
  corrugated elbows, bolted flanges, a welded saddle where the branch leaves
  the trunk — but the straight runs are glazed, because a Resource crossing
  between two glass globes inside opaque metal is a phase with nothing in it.
*/
function forkDucting(draft, side) {
  const group = new THREE.Group();
  const duct = forkPath(side);
  const towards = side === 0 ? -1 : 1;
  const at = (point) => vec(point[0], point[1], point[2]);

  group.add(
    draft.elbow(at(duct.mouth), at(duct.bendOut), at(duct.runStart), DUCT_R, {
      rib: 0.09,
    }),
  );
  group.add(draft.glassPipe(at(duct.runStart), at(duct.runEnd), DUCT_R, true));
  group.add(
    draft.elbow(at(duct.runEnd), at(duct.bendDown), at(duct.inlet), DUCT_R, {
      rib: 0.09,
    }),
  );
  group.add(draft.flange(at(duct.runStart), UP, DUCT_R));
  group.add(draft.flange(at(duct.inlet), UP, DUCT_R));
  group.add(draft.saddleSeam(at(duct.mouth), DUCT_R, -towards));
  return group;
}

/*
  The parent's crown: the neck that stands on the glass, the iris that closes
  it, and the two side ports the vacuum lines come back through. This is the
  only way into a sealed globe — the remainder leaves through it and the next
  Budget's Resources fall in through it.
*/
function crownPort(draft, materials) {
  const group = new THREE.Group();
  group.add(draft.barrel("y", BIG.rim - 0.12, BIG.neckTop, 0.4, 0.45));
  const diaphragm = createIris({ draft, materials })(
    vec(0, BIG.neckTop),
    IRIS.bore + IRIS.clearance,
  );
  group.add(diaphragm.group);

  for (const side of [0, 1]) {
    const x = RISER.crownX[side];
    group.add(draft.barrel("y", BIG.portY - 0.06, BIG.portY + 0.28, RISER_R));
    group.children.at(-1).position.x = x;
    group.add(draft.flange(vec(x, BIG.portY + 0.24), UP, RISER_R));
  }
  return { group, open: diaphragm.open };
}

/*
  The vacuum line: a blower at the child's shoulder draws its remainder
  sideways out of the globe and drives it up and over into the parent's crown.
  The runs are glazed so the Resources can be seen travelling; the volute, the
  elbows and the flanges are the conveyor's opaque sheet metal.
*/
function returnRiser(draft, side) {
  const group = new THREE.Group();
  const riserX = RISER.x[side];
  const crownX = RISER.crownX[side];
  const towards = side === 0 ? -1 : 1;
  const inward = -towards;
  const y = RISER.intakeY;

  // Intake, from the child's flank into the blower.
  group.add(
    draft.glassPipe(
      vec(SMALL.x[side] + towards * 0.4, y),
      vec(riserX - towards * RISER.volute * 0.7, y),
      RISER_R,
      true,
    ),
  );
  group.add(
    draft.flange(
      vec(SMALL.x[side] + towards * 0.52, y),
      new THREE.Vector3(towards, 0, 0),
      RISER_R,
    ),
  );

  // The blower itself: a volute with its impeller face, and the motor behind.
  const volute = draft.barrel("z", -0.16, 0.16, RISER.volute, RISER.volute, {
    ring: RISER.volute * 0.42,
  });
  volute.position.set(riserX, y, 0);
  group.add(volute);
  const motor = draft.thin(draft.barrel("z", -0.44, -0.16, 0.11));
  motor.position.set(riserX, y, 0);
  group.add(motor);

  // Up the line, over the top, and down into the crown port.
  group.add(
    draft.glassPipe(
      vec(riserX, RISER.baseY),
      vec(riserX, RISER.topY - 0.34),
      RISER_R,
      true,
    ),
  );
  group.add(draft.flange(vec(riserX, RISER.baseY + 1.5), UP, RISER_R));
  group.add(
    draft.elbow(
      vec(riserX, RISER.topY - 0.34),
      vec(riserX, RISER.topY),
      vec(riserX + inward * 0.36, RISER.topY),
      RISER_R,
      { rib: 0.09 },
    ),
  );
  group.add(
    draft.glassPipe(
      vec(riserX + inward * 0.36, RISER.topY),
      vec(crownX + towards * 0.34, RISER.topY),
      RISER_R,
      true,
    ),
  );
  group.add(
    draft.elbow(
      vec(crownX + towards * 0.34, RISER.topY),
      vec(crownX, RISER.topY),
      vec(crownX, BIG.portY + 0.24),
      RISER_R,
      { rib: 0.09 },
    ),
  );
  return group;
}

// The gantry the whole machine hangs on.
function gantry(draft) {
  const frame = new THREE.Group();
  for (const x of RISER.x) {
    frame.add(draft.box(0.14, RISER.topY + 0.3, 0.14, x, (RISER.topY + 0.3) / 2, GANTRY_Z));
    frame.add(draft.box(0.5, 0.1, 0.4, x, 0.05, GANTRY_Z));
    // Brackets tying the risers and the children back to the posts.
    frame.add(draft.box(Math.abs(x) * 0.5, 0.09, 0.12, x * 0.75, RISER.baseY + 0.3, GANTRY_Z / 2));
    frame.add(draft.box(0.12, 0.09, Math.abs(GANTRY_Z), x, SMALL.centreY, GANTRY_Z / 2));
  }
  // The beam the parent stands on, and its two brackets forward to the spout.
  const beamY = BIG.mouthY - 0.28;
  frame.add(draft.box(2 * RISER.x[1] + 0.14, 0.13, 0.16, 0, beamY, GANTRY_Z));
  frame.add(draft.box(0.34, 0.1, Math.abs(GANTRY_Z), 0, beamY, GANTRY_Z / 2));
  frame.add(draft.box(0.16, 0.34, 0.16, 0, beamY + 0.2, 0));
  frame.add(
    draft.box(2 * RISER.x[1] + 0.14, 0.11, 0.14, 0, RISER.topY + 0.24, GANTRY_Z),
  );
  return frame;
}

/*
  The belt: slats on turned rollers, running left to right. The chain is
  continuous, so the same run comes back underneath travelling the other way.
*/
function createBelt(draft, materials) {
  const group = new THREE.Group();
  const slatGeos = [];
  for (let x = -BELT_HALF; x <= BELT_HALF; x += SLAT) {
    slatGeos.push(
      new THREE.BoxGeometry(SLAT * 0.82, SLAT_RISE, BELT_HALF_DEPTH * 2).translate(
        x,
        0,
        0,
      ),
    );
  }
  const slatGeo = mergeGeometries(slatGeos);
  const rollerY = BELT.top - SLAT_RISE - ROLLER_R;
  const run = (y) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(slatGeo, materials.white));
    g.add(draft.edgeLines(slatGeo, 1));
    g.position.y = y;
    group.add(g);
    return g;
  };
  const slats = run(BELT.top - SLAT_RISE / 2);
  const returnSlats = run(rollerY - ROLLER_R - SLAT_RISE / 2);

  const rollers = [];
  for (let x = -BELT_HALF + 0.3; x <= BELT_HALF - 0.3; x += 0.84) {
    const roller = draft.thin(
      draft.barrel("z", -BELT_HALF_DEPTH, BELT_HALF_DEPTH, ROLLER_R, ROLLER_R, {
        ring: ROLLER_R * 0.35,
      }),
    );
    roller.position.set(x, rollerY, 0);
    group.add(roller);
    rollers.push(roller);
  }
  // The rails the rollers turn in.
  for (const z of [-BELT_HALF_DEPTH - 0.07, BELT_HALF_DEPTH + 0.07]) {
    group.add(draft.box(2 * BELT_HALF, 0.1, 0.08, 0, rollerY, z));
  }
  for (const x of [-BELT_HALF + 0.2, BELT_HALF - 0.2]) {
    group.add(draft.box(0.1, rollerY, 0.08, x, rollerY / 2, -BELT_HALF_DEPTH - 0.07));
  }

  return {
    group,
    apply(shift) {
      slats.position.x = mod(shift, SLAT);
      returnSlats.position.x = -mod(shift, SLAT);
      for (const roller of rollers) roller.rotation.z = -shift / ROLLER_R;
    },
  };
}

// An open tray: a floor plate and four low walls, sized to the footprint the
// timeline drops Resources into.
function openTray(draft) {
  const tray = new THREE.Group();
  const wall = 0.05;
  const width = (TRAY.halfWidth + wall) * 2;
  const depth = (TRAY.halfDepth + wall) * 2;
  const height = TRAY.rimY - TRAY.floorTop;
  const floor = TRAY.floorTop - (TRAY.floorTop - BELT.top) / 2;
  tray.add(draft.box(width, TRAY.floorTop - BELT.top, depth, 0, floor, 0));
  tray.add(
    draft.box(width, height, wall, 0, TRAY.floorTop + height / 2, -TRAY.halfDepth - wall / 2),
    draft.box(width, height * 0.55, wall, 0, TRAY.floorTop + height * 0.275, TRAY.halfDepth + wall / 2),
    draft.box(wall, height, depth, -TRAY.halfWidth - wall / 2, TRAY.floorTop + height / 2, 0),
    draft.box(wall, height, depth, TRAY.halfWidth + wall / 2, TRAY.floorTop + height / 2, 0),
  );
  return tray;
}

function statusLamp(draft, materials) {
  const lamp = new THREE.Group();
  lamp.add(draft.thin(draft.barrel("x", -0.42, 0.04, 0.05)));
  const globeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 14),
    materials.lampMat,
  );
  globeMesh.position.x = 0.16;
  lamp.add(globeMesh);
  lamp.add(draft.sphereSilhouette(0.16, vec(0.16, 0, 0)));
  lamp.position.set(RISER.x[1] + 0.42, RISER.topY - 0.7, GANTRY_Z);
  return lamp;
}

export function createBudgetMachine({ scene, draft, materials }) {
  const timeline = createBudgetTimeline();
  const root = new THREE.Group();
  scene.add(root);

  root.add(gantry(draft));

  const belt = createBelt(draft, materials);
  root.add(belt.group);

  const parent = machine(draft, materials, {
    x: 0,
    centreY: BIG.centreY,
    radius: BIG.radius,
    floorTop: BIG.floorTop,
    mouthY: BIG.mouthY,
    crown: "port",
  });
  const crown = crownPort(draft, materials);
  root.add(parent.group, parent.gate, crown.group);

  const children = SMALL.x.map((x) =>
    machine(draft, materials, {
      x,
      centreY: SMALL.centreY,
      radius: SMALL.radius,
      floorTop: SMALL.floorTop,
      mouthY: SMALL.mouthY,
    }),
  );
  for (const child of children) root.add(child.group, child.gate);

  for (const side of [0, 1]) {
    root.add(forkDucting(draft, side), returnRiser(draft, side));
  }
  root.add(statusLamp(draft, materials));

  const trays = Array.from({ length: BELT.trays }, () => {
    const tray = openTray(draft);
    root.add(tray);
    return tray;
  });

  // Resources are built from this machine's own drafting toolkit and material
  // set, so their ink inverts with the page like the rest of the drawing.
  const buildItem = createShapeItems({ draft, materials });
  const lever = new THREE.Vector3();
  const turn = new THREE.Euler();
  const spin = new THREE.Quaternion();
  const items = Array.from({ length: 6 }, (_, index) => {
    const kind = [0, 1, 2, 0, 1, 2][index];
    const item = buildItem(kind);
    item.scale.setScalar(BUDGET_GEOMETRY.scale);
    root.add(item);
    return { item, kind };
  });

  function update(t) {
    const frame = timeline.describe(t);
    belt.apply(frame.belt.shift);

    for (let index = 0; index < trays.length; index++) {
      trays[index].position.x = frame.trays[index].x;
      trays[index].visible = frame.trays[index].visible;
    }

    parent.gate.rotation.z = frame.gates.big * 1.15;
    crown.open(frame.iris);
    for (let side = 0; side < children.length; side++) {
      children[side].gate.rotation.z =
        frame.gates.small * (side === 0 ? -1.15 : 1.15);
    }

    for (let index = 0; index < items.length; index++) {
      const state = frame.shapes[index];
      const { item, kind } = items[index];
      item.visible = state.visible;
      if (!state.visible) continue;
      // A sphere is drawn by its outline, and that outline reads as a circle
      // only while it faces the camera, so a round Resource never turns.
      if (BUDGET_GEOMETRY.kinds[kind].round) {
        spin.identity();
      } else {
        turn.set(...state.rotation);
        spin.setFromEuler(turn);
      }
      item.quaternion.copy(spin);
      // Turn about the centroid but stand on the point the timeline gives, so
      // a Resource at rest sits exactly on its container floor.
      lever.set(0, BUDGET_GEOMETRY.kinds[kind].centre, 0);
      const swung = lever.clone().applyQuaternion(spin);
      item.position.set(
        state.position[0] + lever.x - swung.x,
        state.position[1] + lever.y - swung.y,
        state.position[2] + lever.z - swung.z,
      );
    }
    materials.lampMat.color.setHex(frame.lamp);
  }

  update(0);
  return {
    loop: timeline.loop,
    still: timeline.still,
    update,
    phases: timeline.phases,
    view: VIEW,
  };
}
