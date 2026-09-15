/*
  The drafting toolkit, with nothing in it that knows what a conveyor belt is.
  Solids are white and unshaded and carry their own outlines, because the
  drawing is line work.

  Edge extraction gives creases and rim circles. It cannot give a silhouette,
  which depends on the viewpoint too, and a turned part is nothing but
  silhouette — so those are drawn against the fixed camera, which is also why
  lines on a curved surface are culled to its near half: drawn all the way
  round they show through the far wall.
*/
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import * as defaultMaterials from "./materials.js";
import { UP, VIEW } from "./view.js";

// Drafting defaults for sheet-metal fittings: rib pitch through a bend, and
// the collar a flange adds beyond the bore it joins. A caller with its own
// proportions passes them in.
const DUCT = Object.freeze({
  rib: 0.1,
  flangeR: 0.038,
  flangeW: 0.1,
  bolts: 6,
  boltR: 0.03,
});

export function createDraft({
  fineMat,
  glass,
  lineMat,
  white,
} = defaultMaterials) {
  function segments(positions, material = lineMat) {
    const geometry = new LineSegmentsGeometry().setPositions(positions);
    return new LineSegments2(geometry, material);
  }
  // Redraw an object's outlines at hairline weight.
  function thin(object) {
    object.traverse((o) => {
      if (o.isLineSegments2) o.material = fineMat;
    });
    return object;
  }
  function edgeLines(geometry, threshold = 1) {
    const edges = new THREE.EdgesGeometry(geometry, threshold);
    const lines = segments(edges.attributes.position.array);
    edges.dispose();
    return lines;
  }
  function solid(geometry, material = white, threshold = 1) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));
    group.add(edgeLines(geometry, threshold));
    return group;
  }
  // Silhouette lines of a (truncated) cylinder between two points, for the fixed camera.
  function silhouette(p0, r0, p1, r1) {
    const axis = p1.clone().sub(p0).normalize();
    const side = new THREE.Vector3().crossVectors(axis, VIEW).normalize();
    const a0 = p0.clone().addScaledVector(side, r0),
      a1 = p1.clone().addScaledVector(side, r1);
    const b0 = p0.clone().addScaledVector(side, -r0),
      b1 = p1.clone().addScaledVector(side, -r1);
    return segments([
      a0.x,
      a0.y,
      a0.z,
      a1.x,
      a1.y,
      a1.z,
      b0.x,
      b0.y,
      b0.z,
      b1.x,
      b1.y,
      b1.z,
    ]);
  }
  // Outline circle of a sphere as seen by the fixed camera.
  function sphereSilhouette(r, center) {
    const u = new THREE.Vector3().crossVectors(VIEW, UP).normalize();
    const v = new THREE.Vector3().crossVectors(VIEW, u).normalize();
    const n = 36,
      pts = [];
    for (let i = 0; i < n; i++) {
      for (const a of [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2]) {
        const p = center
          .clone()
          .addScaledVector(u, r * Math.cos(a))
          .addScaledVector(v, r * Math.sin(a));
        pts.push(p.x, p.y, p.z);
      }
    }
    return segments(pts);
  }
  function box(sx, sy, sz, x, y, z) {
    const g = solid(new THREE.BoxGeometry(sx, sy, sz));
    g.position.set(x, y, z);
    return g;
  }

  function addRun(pts, run) {
    for (let i = 0; i < run.length - 1; i++)
      pts.push(
        run[i].x,
        run[i].y,
        run[i].z,
        run[i + 1].x,
        run[i + 1].y,
        run[i + 1].z,
      );
  }
  // A ring drawn on a curved surface, kept to the half of it that faces the
  // camera, so a rib never shows through the far wall.
  function frontRing(pts, centre, axis, r, steps = 32) {
    const u = new THREE.Vector3().crossVectors(axis, VIEW).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u).normalize();
    let run = [];
    for (let j = 0; j <= steps; j++) {
      const a = (j / steps) * Math.PI * 2;
      const n = u
        .clone()
        .multiplyScalar(Math.cos(a))
        .addScaledVector(v, Math.sin(a));
      if (n.dot(VIEW) > 0) {
        addRun(pts, run);
        run = [];
        continue;
      }
      run.push(centre.clone().addScaledVector(n, r));
    }
    addRun(pts, run);
  }
  // A ring on a flat face, where the whole circle shows: culling this one to the
  // camera-facing half leaves an arc ending in mid-air.
  function fullRing(pts, centre, axis, r, steps = 12) {
    const u = new THREE.Vector3().crossVectors(axis, VIEW).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u).normalize();
    const run = [];
    for (let j = 0; j <= steps; j++) {
      const a = (j / steps) * Math.PI * 2;
      run.push(
        centre
          .clone()
          .addScaledVector(u, r * Math.cos(a))
          .addScaledVector(v, r * Math.sin(a)),
      );
    }
    addRun(pts, run);
  }

  const AXIS = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1),
  };
  /*
  A turned part: a cylinder or frustum along one axis, outlined by its rim
  circles and by the silhouette extraction never yields — without which it is a
  pair of loose arcs. `ring` adds the bolt circle a joint face carries.

  The wrapper's transform is the caller's to set: the part inside carries its
  own offset along the axis, and positioning the part directly overwrites it.
*/
  function barrel(
    axis,
    from,
    to,
    r0,
    r1 = r0,
    { radial = 32, ring = 0, threshold = 30, material = white } = {},
  ) {
    const dir = AXIS[axis];
    const geometry = new THREE.CylinderGeometry(r1, r0, to - from, radial);
    if (axis === "x") geometry.rotateZ(-Math.PI / 2);
    else if (axis === "z") geometry.rotateX(Math.PI / 2);

    const g = new THREE.Group();
    const part = solid(geometry, material, threshold);
    part.position.copy(dir).multiplyScalar((from + to) / 2);
    g.add(part);
    g.add(
      silhouette(
        dir.clone().multiplyScalar(from),
        r0,
        dir.clone().multiplyScalar(to),
        r1,
      ),
    );
    if (ring) {
      const face = [];
      fullRing(face, dir.clone().multiplyScalar(to + 0.002), dir, ring, 32);
      g.add(segments(face, fineMat));
    }
    return g;
  }

  // Glass pipe between two world points: tinted body, end rims, silhouette lines.
  function glassPipe(p0, p1, r, open = false) {
    const g = new THREE.Group();
    const dir = p1.clone().sub(p0);
    const len = dir.length();
    dir.normalize();
    const geo = new THREE.CylinderGeometry(r, r, len, 32, 1, open);
    const mesh = new THREE.Mesh(geo, glass);
    mesh.renderOrder = 5;
    const rims = edgeLines(geo, 30);
    for (const o of [mesh, rims]) {
      o.position.copy(p0).lerp(p1, 0.5);
      o.quaternion.setFromUnitVectors(UP, dir);
      g.add(o);
    }
    g.add(silhouette(p0, r, p1, r));
    return g;
  }

  // Opaque sheet-metal fittings. Swept solids are outlined by their silhouette
  // against the fixed camera, since edge extraction on a swept tube yields
  // unusable clutter.

  // A straight length of duct between two points.
  function straightDuct(p0, p1, r) {
    const g = new THREE.Group();
    const dir = p1.clone().sub(p0).normalize();
    const len = p0.distanceTo(p1);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, len, 32),
      white,
    );
    mesh.position.copy(p0).lerp(p1, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir);
    g.add(mesh);
    g.add(silhouette(p0, r, p1, r));
    return g;
  }
  // A corrugated elbow: smooth collars at both ends, ribbed through the bend.
  function elbow(from, corner, to, r, { rib = DUCT.rib } = {}) {
    const curve = new THREE.QuadraticBezierCurve3(from, corner, to);
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 24, false), white),
    );
    const samples = 48,
      left = [],
      right = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const side = new THREE.Vector3()
        .crossVectors(curve.getTangentAt(t), VIEW)
        .normalize()
        .multiplyScalar(r);
      left.push(curve.getPointAt(t).add(side));
      right.push(curve.getPointAt(t).sub(side));
    }
    const outline = [];
    addRun(outline, left);
    addRun(outline, right);
    g.add(segments(outline));
    const span = 0.86 - 0.14;
    const count = Math.max(2, Math.round((curve.getLength() * span) / rib));
    const ribs = [];
    for (let k = 0; k <= count; k++) {
      const t = 0.14 + span * (k / count);
      frontRing(ribs, curve.getPointAt(t), curve.getTangentAt(t), r);
    }
    g.add(segments(ribs, fineMat));
    return g;
  }
  // A bolted flange: the collar that joins two fittings, ringed with bolt heads.
  function flange(centre, axis, r, options = {}) {
    const {
      lip = DUCT.flangeR,
      width = DUCT.flangeW,
      bolts = DUCT.bolts,
      boltR = DUCT.boltR,
    } = options;
    const g = new THREE.Group();
    const rf = r + lip;
    const body = solid(
      new THREE.CylinderGeometry(rf, rf, width, 32),
      white,
      30,
    );
    body.position.copy(centre);
    body.quaternion.setFromUnitVectors(UP, axis);
    g.add(body);
    const u = new THREE.Vector3().crossVectors(axis, VIEW).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u).normalize();
    const pts = [];
    for (let b = 0; b < bolts; b++) {
      const a = (b / bolts) * Math.PI * 2;
      const n = u
        .clone()
        .multiplyScalar(Math.cos(a))
        .addScaledVector(v, Math.sin(a));
      if (n.dot(VIEW) > 0) continue;
      fullRing(pts, centre.clone().addScaledVector(n, rf * 1.01), n, boltR, 18);
    }
    g.add(segments(pts, fineMat));
    return g;
  }
  // The welded saddle where a branch meets the trunk. Equal radii make the seam
  // a pair of arcs meeting in a V, exactly as on a sheet-metal tee.
  function saddleSeam(trunkCentre, r, towards) {
    const pts = [];
    for (const sign of [1, -1]) {
      const run = [];
      for (let j = 0; j <= 40; j++) {
        const x = -r + (2 * r * j) / 40;
        const h = Math.sqrt(Math.max(0, r * r - x * x));
        const point = trunkCentre
          .clone()
          .add(new THREE.Vector3(x, sign * h, towards * h));
        if (new THREE.Vector3(x, 0, towards * h).dot(VIEW) > 0) {
          addRun(pts, run.splice(0));
          continue;
        }
        run.push(point);
      }
      addRun(pts, run);
    }
    return segments(pts);
  }

  return {
    segments,
    thin,
    edgeLines,
    solid,
    silhouette,
    sphereSilhouette,
    box,
    addRun,
    frontRing,
    fullRing,
    barrel,
    glassPipe,
    straightDuct,
    elbow,
    flange,
    saddleSeam,
  };
}

export const {
  segments,
  thin,
  edgeLines,
  solid,
  silhouette,
  sphereSilhouette,
  box,
  addRun,
  frontRing,
  fullRing,
  barrel,
  glassPipe,
  straightDuct,
  elbow,
  flange,
  saddleSeam,
} = createDraft();
