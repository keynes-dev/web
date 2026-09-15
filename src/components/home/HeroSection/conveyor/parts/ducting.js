/*
  The upright storage tubes and the opaque sheet-metal fittings that drain them.
  The outer two turn through corrugated elbows and run inward to a tee; the
  middle one drops straight into it. The tee's trunk carries every shape down
  into the machine.

  Swept solids are outlined by their silhouette against the fixed camera, since
  edge extraction on a swept tube yields unusable clutter.
*/
import * as THREE from "three";

import { IRIS, MACHINE, PLATE_BORE } from "../config.js";
import { elbow, flange, glassPipe, saddleSeam, straightDuct } from "../draft.js";
import { TUBES } from "../timeline.js";
import { UP } from "../view.js";
import { iris } from "./iris.js";

export { elbow, flange, saddleSeam, straightDuct };

export function createDucting(scene) {
  const R = MACHINE.ductR;
  const trunkTop = MACHINE.elbowY;
  const trunkBottom = MACHINE.manifold.y + MACHINE.manifoldH / 2;
  const trunkAxis = new THREE.Vector3(0, 0, 1);
  const irises = [];

  TUBES.forEach((tube, s) => {
    const bottom = new THREE.Vector3(0, tube.bottomY, tube.z);
    const top = bottom.clone().setY(tube.topY);
    scene.add(glassPipe(bottom, top, MACHINE.tubeR, true));

    const diaphragm = iris(bottom.clone(), PLATE_BORE + IRIS.clearance);
    scene.add(diaphragm.group);
    irises.push(diaphragm);

    const spigot = new THREE.Vector3(0, MACHINE.elbowY, tube.z);
    if (tube.z === 0) {
      scene.add(straightDuct(spigot, new THREE.Vector3(0, trunkTop, 0), R));
    } else {
      const towards = Math.sign(-tube.z);
      const armEnd = new THREE.Vector3(
        0,
        MACHINE.armY,
        tube.z + towards * MACHINE.elbowR,
      );
      scene.add(
        elbow(spigot, new THREE.Vector3(0, MACHINE.armY, tube.z), armEnd, R),
      );
      scene.add(
        straightDuct(
          armEnd,
          new THREE.Vector3(0, MACHINE.armY, towards * 0.04),
          R,
        ),
      );
      scene.add(
        flange(armEnd.clone().setZ(armEnd.z + towards * 0.09), trunkAxis, R),
      );
      scene.add(saddleSeam(new THREE.Vector3(0, MACHINE.armY, 0), R, -towards));
    }
    // Collar joining the iris frame to the ducting below it.
    scene.add(
      flange(new THREE.Vector3(0, MACHINE.elbowY + 0.05, tube.z), UP, R),
    );
  });

  // The tee itself, and its bolted connection into the machine.
  scene.add(
    straightDuct(
      new THREE.Vector3(0, trunkBottom, 0),
      new THREE.Vector3(0, trunkTop, 0),
      R,
    ),
  );
  scene.add(flange(new THREE.Vector3(0, trunkBottom + 0.07, 0), UP, R));

  return {
    apply({ iris: openings }) {
      for (let s = 0; s < irises.length; s++) irises[s].open(openings[s]);
    },
  };
}
