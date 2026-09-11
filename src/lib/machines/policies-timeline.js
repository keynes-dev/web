/*
  The policy machine's schedule as plain numbers. Scene objects only read this
  description, so controls can seek to any time without replaying earlier
  frames or accumulating motion.
*/

import { glide, mod } from "../conveyor/math.js";

export const POLICY_GEOMETRY = Object.freeze({
  cube: 0.5,
  deckTop: 0.9,
  cartLength: 1.2,
  gateNear: 0,
  gateClearance: 1.5,
  entryX: -5,
  stopX: -0.82,
  exitX: 5.4,
  trayX: -0.82,
  trayZ: 1.55,
});

export const POLICY_TIMES = Object.freeze({
  denied: 2.4,
  revise: 3.35,
  reached: 4.2,
  gripped: 4.55,
  lifted: 5.4,
  transferred: 6.35,
  lowered: 7.25,
  released: 7.6,
  retry: 8.55,
  exited: 11.5,
  finalPause: 13.25,
  hidden: 14.2,
  staged: 14.55,
  loop: 15.3,
});

export const POLICY_PHASES = Object.freeze([
  Object.freeze({ label: "Request", at: 0 }),
  Object.freeze({ label: "Denied", at: POLICY_TIMES.denied }),
  Object.freeze({ label: "Revise", at: POLICY_TIMES.revise }),
  Object.freeze({ label: "Retry", at: POLICY_TIMES.retry }),
  Object.freeze({ label: "New request", at: POLICY_TIMES.finalPause }),
]);

const between = (t, from, to) => glide((t - from) / (to - from));
const mix = (from, to, amount) => from + (to - from) * amount;

const CUBE = POLICY_GEOMETRY.cube;
const CART_CENTRE_Y = POLICY_GEOMETRY.deckTop + CUBE / 2;
const PICKUP = Object.freeze({
  y: POLICY_GEOMETRY.deckTop + 3 * CUBE,
  z: 0,
});
const LIFT = Object.freeze({ y: 3.05, z: 0 });
const DROP = Object.freeze({
  y: 0.54 + CUBE,
  z: POLICY_GEOMETRY.trayZ,
});
const PARK = Object.freeze({ y: 2.85, z: 3.15 });

function cartXAt(t) {
  if (t < POLICY_TIMES.denied) {
    return mix(
      POLICY_GEOMETRY.entryX,
      POLICY_GEOMETRY.stopX,
      between(t, 0, POLICY_TIMES.denied),
    );
  }
  if (t < POLICY_TIMES.retry) return POLICY_GEOMETRY.stopX;
  if (t < POLICY_TIMES.exited)
    return mix(
      POLICY_GEOMETRY.stopX,
      POLICY_GEOMETRY.exitX,
      between(t, POLICY_TIMES.retry, POLICY_TIMES.exited),
    );
  if (t < POLICY_TIMES.finalPause) return POLICY_GEOMETRY.exitX;
  if (t < POLICY_TIMES.hidden) {
    return mix(
      POLICY_GEOMETRY.exitX,
      7.2,
      between(t, POLICY_TIMES.finalPause, POLICY_TIMES.hidden),
    );
  }
  return POLICY_GEOMETRY.entryX;
}

function armAt(t) {
  if (t < POLICY_TIMES.revise) return { ...PARK, grip: 0 };
  if (t < POLICY_TIMES.reached) {
    const p = between(t, POLICY_TIMES.revise, POLICY_TIMES.reached);
    return {
      y: mix(PARK.y, PICKUP.y, p),
      z: mix(PARK.z, PICKUP.z, p),
      grip: 0,
    };
  }
  if (t < POLICY_TIMES.gripped) {
    return {
      ...PICKUP,
      grip: between(t, POLICY_TIMES.reached, POLICY_TIMES.gripped),
    };
  }
  if (t < POLICY_TIMES.lifted) {
    const p = between(t, POLICY_TIMES.gripped, POLICY_TIMES.lifted);
    return {
      y: mix(PICKUP.y, LIFT.y, p),
      z: PICKUP.z,
      grip: 1,
    };
  }
  if (t < POLICY_TIMES.transferred) {
    const p = between(t, POLICY_TIMES.lifted, POLICY_TIMES.transferred);
    return { y: LIFT.y, z: mix(LIFT.z, DROP.z, p), grip: 1 };
  }
  if (t < POLICY_TIMES.lowered) {
    const p = between(t, POLICY_TIMES.transferred, POLICY_TIMES.lowered);
    return { y: mix(LIFT.y, DROP.y, p), z: DROP.z, grip: 1 };
  }
  if (t < POLICY_TIMES.released) {
    return {
      ...DROP,
      grip: 1 - between(t, POLICY_TIMES.lowered, POLICY_TIMES.released),
    };
  }
  if (t < POLICY_TIMES.retry) {
    const p = between(t, POLICY_TIMES.released, POLICY_TIMES.retry);
    return {
      y: mix(DROP.y, PARK.y, p),
      z: mix(DROP.z, PARK.z, p),
      grip: 0,
    };
  }
  return { ...PARK, grip: 0 };
}

function stagedCube(id) {
  return {
    id,
    key: `1:${id}`,
    generation: 1,
    owner: "cart",
    visible: true,
    x: POLICY_GEOMETRY.entryX,
    y: CART_CENTRE_Y + id * CUBE,
    z: 0,
  };
}

function cubeAt(id, t, cartX, arm) {
  if (t >= POLICY_TIMES.hidden) {
    return {
      ...stagedCube(id),
      owner: t < POLICY_TIMES.staged ? "outside" : "cart",
      visible: t >= POLICY_TIMES.staged,
    };
  }

  const reset = between(t, POLICY_TIMES.finalPause, POLICY_TIMES.hidden);
  const visible = reset < 0.78;
  if (id < 2) {
    return {
      id,
      key: `0:${id}`,
      generation: 0,
      owner: reset > 0 ? "outgoing" : "cart",
      visible,
      x: cartX,
      y: CART_CENTRE_Y + id * CUBE,
      z: 0,
    };
  }

  if (t < POLICY_TIMES.gripped) {
    return {
      id,
      key: `0:${id}`,
      generation: 0,
      owner: "cart",
      visible: true,
      x: cartX,
      y: CART_CENTRE_Y + id * CUBE,
      z: 0,
    };
  }

  const pairOffset = (id - 2.5) * CUBE;
  if (t < POLICY_TIMES.released) {
    return {
      id,
      key: `0:${id}`,
      generation: 0,
      owner: "grip",
      visible: true,
      x: POLICY_GEOMETRY.stopX,
      y: arm.y + pairOffset,
      z: arm.z,
    };
  }

  return {
    id,
    key: `0:${id}`,
    generation: 0,
    owner: reset > 0 ? "outgoing" : "tray",
    visible,
    x: POLICY_GEOMETRY.trayX,
    // The collection tray takes the revised-away pair below the deck during
    // the explicit new-request beat. They never drift sideways without a
    // carrier, and the next generation is staged with its cart off frame.
    y: DROP.y + pairOffset - 3 * reset,
    z: POLICY_GEOMETRY.trayZ,
  };
}

export function createPolicyTimeline() {
  function describe(time) {
    const t = mod(time, POLICY_TIMES.loop);
    const cartX = cartXAt(t);
    const arm = armAt(t);
    const travel = cartX - POLICY_GEOMETRY.entryX;
    const reset = between(t, POLICY_TIMES.finalPause, POLICY_TIMES.hidden);
    const normalTravel = POLICY_GEOMETRY.exitX - POLICY_GEOMETRY.entryX;

    return {
      t,
      cart: {
        x: cartX,
        front: cartX + POLICY_GEOMETRY.cartLength / 2,
        wheel: -travel / 0.16,
        visible:
          t < POLICY_TIMES.finalPause ||
          reset < 0.78 ||
          t >= POLICY_TIMES.staged,
      },
      // 10.56 is 33 slat pitches and 11 roller turns. The belt can stop there
      // and meet its opening frame at the loop seam without a visible jump.
      beltShift:
        t < POLICY_TIMES.exited ? travel : mix(normalTravel, 10.56, reset),
      lamp:
        t < POLICY_TIMES.denied
          ? "amber"
          : t < POLICY_TIMES.revise
            ? "red"
            : t < POLICY_TIMES.released
              ? "amber"
              : t < POLICY_TIMES.finalPause
                ? "green"
                : "amber",
      arm,
      cubes: [0, 1, 2, 3].map((id) => cubeAt(id, t, cartX, arm)),
    };
  }

  return {
    describe,
    loop: POLICY_TIMES.loop,
    phases: POLICY_PHASES,
    still: POLICY_TIMES.denied + 0.45,
  };
}
