/*
  The Budget machine's schedule as plain numbers. Scene code reads this module,
  but this module never reaches into Three.js, the renderer, or the browser.

  A parent gumball globe is funded with two of every Resource kind, drains
  through forked ducting into two child globes, and each child drops one
  Resource into a tray passing underneath on the belt. What the children do not
  spend climbs the return risers back into the parent, which is settlement:
  a non-root Budget returns its complete remainder to its structural parent.
  The depleted Budget then leaves the frame and a fresh one is funded, because
  a Budget is never topped up.
*/
import { clamp01, glide, mod, smooth } from "../conveyor/math.js";
import { SHAPES } from "../conveyor/config.js";

// Resources are drawn a little larger here than on the conveyor: this machine
// holds six of them in a globe rather than a stack of them in a tube, and at
// the conveyor's size the difference between a cube and a tetrahedron is lost.
const SCALE = 1.15;

// Which Resource kind each of the six is, so both children receive one of each.
const KIND_OF = [0, 1, 2, 0, 1, 2];
const LEFT = 0;
const RIGHT = 1;
const sideOf = (shape) => (shape < 3 ? LEFT : RIGHT);
const slotOf = (shape) => shape % 3;
// The one Resource each child spends. Deliberately different kinds, so the
// trays leaving the frame do not read as a fixed toll.
const SPENT = Object.freeze([0, 5]);

export const BUDGET_GEOMETRY = Object.freeze({
  scale: SCALE,
  // Base-to-centroid offset per kind, since a Resource is positioned by the
  // point it stands on and turned about the point it would turn about in air.
  kinds: Object.freeze(
    SHAPES.map((shape) => ({
      name: shape.name,
      height: shape.height * SCALE,
      centre: shape.centre * SCALE,
      radius: shape.radius * SCALE,
      round: shape.name === "sphere",
    })),
  ),
  // A globe's floor plate sits well below its centre, so the glass reads as a
  // sphere holding Resources rather than as a dome on a saucer. `floorRadius`
  // is how far from the axis a Resource may stand: far enough inside the chord
  // the plate cuts that the widest of them still clears the glass.
  big: Object.freeze({
    centreY: 4.1,
    radius: 0.92,
    floorTop: 3.5,
    floorRadius: 0.42,
    mouthY: 2.95,
    rim: 5.02,
    // The fill port on the crown, and the two side ports the vacuum lines
    // return through. Both are holes in the glass, so both are places the
    // scene has to put a fitting and the motion has to pass through.
    neckTop: 5.28,
    portX: 0.68,
    portY: 4.72,
  }),
  small: Object.freeze({
    x: Object.freeze([-1.55, 1.55]),
    centreY: 1.76,
    radius: 0.6,
    floorTop: 1.36,
    floorRadius: 0.26,
    mouthY: 1.0,
    rim: 2.36,
  }),
  tray: Object.freeze({
    floorTop: 0.34,
    halfWidth: 0.5,
    halfDepth: 0.3,
    rimY: 0.68,
  }),
  belt: Object.freeze({ top: 0.28, pitch: 3.1, trays: 3, halfSpan: 3.0 }),
  // The vacuum lines. Each child is drawn on by a blower at its shoulder and
  // the remainder is carried up and over into the parent's crown, which is why
  // the Resources travel upwards at all.
  riser: Object.freeze({
    x: Object.freeze([-2.55, 2.55]),
    intakeY: 1.45,
    volute: 0.28,
    baseY: 1.73,
    topY: 5.25,
    crownX: Object.freeze([-0.68, 0.68]),
  }),
  // Far enough above the frame that a refill is already falling when it first
  // shows, rather than appearing in clear air.
  sky: 8.4,
});

export const BUDGET_PHASES = Object.freeze([
  { label: "Fund", at: 0 },
  { label: "Allocate", at: 1.9 },
  { label: "Spend", at: 4.6 },
  { label: "Settle", at: 7.0 },
  { label: "Complete", at: 10.6 },
  { label: "New budget", at: 13.4 },
]);

export const BUDGET_LOOP = 16.8;
export const BUDGET_STILL = 5.8;

const GRAVITY = 24;
const { big: BIG, small: SMALL, tray: TRAY, belt: BELT, riser: RISER } =
  BUDGET_GEOMETRY;

// The belt advances a whole number of tray pitches per loop, so the run is
// seamless at the seam and a tray never jumps.
const WRAP = BELT.pitch * BELT.trays;
const BELT_SPEED = (BELT.pitch * 3) / BUDGET_LOOP;

const FUND_DURATION = 0.68;
// Wide enough that the six fall through the one crown port in single file
// rather than overlapping inside it.
const FUND_STAGGER = 0.15;

const ALLOCATE_DURATION = 0.95;
const ALLOCATE_STAGGER = 0.28;

// A Resource leaves the child's mouth with no sideways push, so it falls
// straight and the belt brings the tray to meet it. Leaving the mouth
// therefore leads the tray by exactly the time of the fall — not by the time
// of the whole release, since the draw down the throat is guided and the fall
// after it is not.
const DROP_HEIGHT = SMALL.mouthY - TRAY.floorTop;
const DROP_TIME = Math.sqrt((2 * DROP_HEIGHT) / GRAVITY);
const DRAW_TIME = 0.34;
const LAND_AT = 5.4;
const MOUTH_AT = LAND_AT - DROP_TIME;
const RELEASE_AT = MOUTH_AT - DRAW_TIME;
// Phase the belt so that at the landing instant one tray is under each child.
const TRAY_PHASE = mod(BELT.pitch - BELT_SPEED * LAND_AT, WRAP);

const RETURN_START = 7.2;
const RETURN_DURATION = 1.9;
const RETURN_STAGGER = 0.35;

// Closing out the root Budget: its remainder is drawn back up through the
// crown and away. A root has no structural parent to return to, so what is
// left simply leaves, and the globe stands empty before the next is funded.
const CLOSE_START = 13.5;
const CLOSE_DURATION = 1.0;
const CLOSE_STAGGER = 0.14;
const REFUND_START = 15.1;

const mix = (a, b, t) => a + (b - a) * t;
const mixPoint = (a, b, t) => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
const move = (t, start, duration) => glide((t - start) / duration);

function pulse(t, start, openDuration, closeAt, closeDuration) {
  return (
    smooth((t - start) / openDuration) - smooth((t - closeAt) / closeDuration)
  );
}

// Where a Resource stands when the parent holds it: a ring on the globe's
// floor plate, turned off the axes so no two read as one from this camera.
function bigRest(shape) {
  const angle = (shape * Math.PI) / 3 + 0.42;
  const r = BIG.floorRadius - 0.04;
  return [r * Math.cos(angle), BIG.floorTop, r * Math.sin(angle)];
}

function smallRest(shape) {
  const angle = (slotOf(shape) * 2 * Math.PI) / 3 + 0.7;
  const r = SMALL.floorRadius - 0.04;
  return [
    SMALL.x[sideOf(shape)] + r * Math.cos(angle),
    SMALL.floorTop,
    r * Math.sin(angle),
  ];
}

export function trayX(index, t) {
  return mod(BELT_SPEED * t + index * BELT.pitch + TRAY_PHASE, WRAP) - WRAP / 2;
}

// Which tray is under which child at the landing instant, and therefore which
// tray each spent Resource rides out on.
const TRAY_OF = Object.freeze([0, 1]);
const trayForSide = (side) => TRAY_OF[side];

// The instant a tray has carried its load clear of the frame, after which the
// Resource on it is gone for good rather than coming round again on the wrap.
function trayExit(index) {
  const distance = mod(
    BELT.halfSpan + WRAP / 2 - (index * BELT.pitch + TRAY_PHASE),
    WRAP,
  );
  return distance / BELT_SPEED;
}

/*
  The centreline of the fork duct on one side, as the points the sheet metal is
  built from. The scene draws its fittings along exactly these points and the
  allocation follows them, so a Resource can never travel outside its own duct.
*/
export function forkPath(side) {
  const direction = side === LEFT ? -1 : 1;
  const reach = Math.abs(SMALL.x[side]);
  return {
    mouth: [0, BIG.mouthY - 0.06, 0],
    bendOut: [direction * 0.38, 2.82, 0],
    runStart: [direction * 0.66, 2.74, 0],
    runEnd: [direction * (reach - 0.22), 2.54, 0],
    bendDown: [direction * reach, 2.5, 0],
    inlet: [direction * reach, SMALL.rim + 0.02, 0],
  };
}

// Out of the parent's mouth, into the fork, along the branch and down into the
// child globe.
function allocationPath(shape, p) {
  const side = sideOf(shape);
  const duct = forkPath(side);
  const rest = bigRest(shape);
  const drain = [0, BIG.floorTop, 0];
  const target = smallRest(shape);

  if (p < 0.16) return mixPoint(rest, drain, glide(p / 0.16));
  if (p < 0.3) return mixPoint(drain, duct.mouth, glide((p - 0.16) / 0.14));
  if (p < 0.44) return mixPoint(duct.mouth, duct.runStart, smooth((p - 0.3) / 0.14));
  if (p < 0.7) return mixPoint(duct.runStart, duct.runEnd, smooth((p - 0.44) / 0.26));
  if (p < 0.82) return mixPoint(duct.runEnd, duct.inlet, smooth((p - 0.7) / 0.12));
  return mixPoint(duct.inlet, target, glide((p - 0.82) / 0.18));
}

function allocation(shape, t) {
  const start = BUDGET_PHASES[1].at + slotOf(shape) * ALLOCATE_STAGGER;
  if (t < start) return { owner: "big", position: bigRest(shape) };
  if (t >= start + ALLOCATE_DURATION) {
    return {
      owner: sideOf(shape) === LEFT ? "left" : "right",
      position: smallRest(shape),
    };
  }
  const p = clamp01((t - start) / ALLOCATE_DURATION);
  return {
    owner: "transit",
    motion: "allocate",
    position: allocationPath(shape, p),
    spin: smooth(p) * Math.PI * (1.3 + slotOf(shape) * 0.2),
  };
}

// A spent Resource: held until the release, then straight down at the child's
// own x while the belt brings its tray underneath, then riding that tray out.
function spending(shape, t) {
  const side = sideOf(shape);
  const index = trayForSide(side);
  const rest = smallRest(shape);
  const mouthX = SMALL.x[side];

  if (t < RELEASE_AT) {
    return { owner: side === LEFT ? "left" : "right", position: rest };
  }
  // Drawn down the throat to the mouth, guided the whole way.
  if (t < MOUTH_AT) {
    const p = move(t, RELEASE_AT, DRAW_TIME);
    return {
      owner: "transit",
      motion: "draw",
      position: mixPoint(rest, [mouthX, SMALL.mouthY, 0], p),
      spin: p * Math.PI * (side === LEFT ? -0.5 : 0.5),
    };
  }
  // Free fall from the mouth, which is what the lead is timed against.
  if (t < LAND_AT) {
    const fall = t - MOUTH_AT;
    return {
      owner: "transit",
      motion: "spend",
      position: [mouthX, SMALL.mouthY - 0.5 * GRAVITY * fall * fall, 0],
      spin:
        (0.5 + fall / DROP_TIME) * Math.PI * (side === LEFT ? -1.2 : 1.2),
    };
  }
  return {
    owner: "tray",
    tray: index,
    position: [trayX(index, t), TRAY.floorTop, 0],
    visible: t < trayExit(index),
  };
}

// Settlement: the remainder climbs the outboard riser and drops back into the
// parent globe through its crown.
function returnPath(shape, p) {
  const side = sideOf(shape);
  const riserX = RISER.x[side];
  const crownX = RISER.crownX[side];
  const rest = smallRest(shape);
  const intake = [riserX, RISER.intakeY, 0];
  const base = [riserX, RISER.baseY, 0];
  const top = [riserX, RISER.topY, 0];
  const crown = [crownX, RISER.topY, 0];
  const port = [crownX, BIG.portY, 0];
  const target = bigRest(shape);

  // Drawn sideways out of the child, through the blower, and up the line.
  if (p < 0.14) {
    return { point: mixPoint(rest, intake, smooth(p / 0.14)), motion: "climb" };
  }
  if (p < 0.24) {
    return {
      point: mixPoint(intake, base, glide((p - 0.14) / 0.1)),
      motion: "climb",
    };
  }
  if (p < 0.7) {
    return {
      point: mixPoint(base, top, smooth((p - 0.24) / 0.46)),
      motion: "climb",
    };
  }
  if (p < 0.82) {
    return {
      point: mixPoint(top, crown, glide((p - 0.7) / 0.12)),
      motion: "climb",
    };
  }
  // Down the crown port and into the parent, which is the only descent.
  if (p < 0.9) {
    return {
      point: mixPoint(crown, port, glide((p - 0.82) / 0.08)),
      motion: "refill",
    };
  }
  return {
    point: mixPoint(port, target, glide((p - 0.9) / 0.1)),
    motion: "refill",
  };
}

function returning(shape, t) {
  const side = sideOf(shape);
  const order = slotOf(shape) === 1 ? 0 : 1;
  const start = RETURN_START + order * RETURN_STAGGER;
  if (t < start) {
    return { owner: side === LEFT ? "left" : "right", position: smallRest(shape) };
  }
  if (t >= start + RETURN_DURATION) {
    return { owner: "big", position: bigRest(shape) };
  }
  const p = clamp01((t - start) / RETURN_DURATION);
  const leg = returnPath(shape, p);
  return {
    owner: "transit",
    motion: leg.motion,
    position: leg.point,
    spin: smooth(p) * Math.PI * (side === LEFT ? -1.1 : 1.1),
  };
}

/*
  The whole machine drops out of frame and a fresh one rises, so the depleted
  Budget is replaced rather than refilled. Its Resources fall in from above the
  frame and through the crown port — the same opening the vacuum lines return
  through, and the only way into a sealed glass globe.
*/
function replacement(shape, t) {
  const rest = bigRest(shape);
  const sky = [0, BUDGET_GEOMETRY.sky, 0];
  const port = [0, BIG.neckTop, 0];
  const start = REFUND_START + shape * FUND_STAGGER;
  if (t < start) {
    return {
      owner: "outside",
      position: sky,
      visible: false,
      generation: 1,
    };
  }
  if (t >= start + FUND_DURATION) {
    return { owner: "big", position: rest, generation: 1 };
  }
  const p = clamp01((t - start) / FUND_DURATION);
  // Falling, so the drop accelerates into the port and the landing eases out.
  const fall = (p / 0.62) ** 2;
  const position =
    p < 0.62
      ? mixPoint(sky, port, fall)
      : mixPoint(port, rest, glide((p - 0.62) / 0.38));
  return {
    owner: "transit",
    motion: "fund",
    position,
    spin: smooth(p) * Math.PI * 1.4,
    generation: 1,
  };
}

// The crown iris, open while anything is passing through it in either
// direction: the remainder leaving, and the next Budget's Resources arriving.
function crownIris(t) {
  return Math.max(
    pulse(t, CLOSE_START + 0.28, 0.18, CLOSE_START + 1.35, 0.22),
    pulse(t, REFUND_START + 0.2, 0.18, REFUND_START + 1.3, 0.22),
  );
}

function settled(shape, t) {
  return SPENT.includes(shape) ? spending(shape, t) : returning(shape, t);
}

// The order the remainder leaves in, among the four the parent holds.
const closeOrder = (shape) => [1, 3, 2, 4].indexOf(shape);

function closeOut(shape, t) {
  const rest = bigRest(shape);
  const neck = [0, BIG.neckTop, 0];
  const away = [0, BUDGET_GEOMETRY.sky, 0];
  const start = CLOSE_START + closeOrder(shape) * CLOSE_STAGGER;
  if (t < start) return { owner: "big", position: rest };
  if (t >= start + CLOSE_DURATION) {
    return { owner: "outside", position: away, visible: false };
  }
  const p = clamp01((t - start) / CLOSE_DURATION);
  return {
    owner: "transit",
    motion: "close",
    position:
      p < 0.55
        ? mixPoint(rest, neck, glide(p / 0.55))
        : mixPoint(neck, away, smooth((p - 0.55) / 0.45)),
    spin: smooth(p) * Math.PI * 1.2,
  };
}

function closing(shape, t) {
  return SPENT.includes(shape) ? spending(shape, t) : closeOut(shape, t);
}

// The Fund phase is the funded parent held still: the Resources standing in
// the globe at the top of the loop are the ones the previous pass's refund put
// there, which is what makes the loop close without a jump.
function stateOf(shape, t) {
  if (t < BUDGET_PHASES[2].at) return allocation(shape, t);
  if (t < CLOSE_START) return settled(shape, t);
  if (t < REFUND_START) return closing(shape, t);
  return replacement(shape, t);
}

function shapeAt(shape, t) {
  const state = stateOf(shape, t);
  const generation = state.generation ?? 0;
  const spin = state.spin ?? 0;
  return {
    id: shape,
    kind: KIND_OF[shape],
    key: `${generation}:${shape}`,
    generation,
    owner: state.owner,
    motion: state.motion ?? null,
    tray: state.tray ?? null,
    visible: state.visible ?? true,
    position: state.position,
    rotation: [spin, spin * 0.7, spin * 0.4],
  };
}

function count(shapes) {
  const counts = {
    big: 0,
    left: 0,
    right: 0,
    tray: 0,
    transit: 0,
    outside: 0,
    total: shapes.length,
  };
  for (const shape of shapes) counts[shape.owner]++;
  return counts;
}

function bigGate(t) {
  let opening = 0;
  for (let slot = 0; slot < 3; slot++) {
    const start = BUDGET_PHASES[1].at + slot * ALLOCATE_STAGGER - 0.14;
    opening = Math.max(opening, pulse(t, start, 0.16, start + 0.5, 0.18));
  }
  return opening;
}

function smallGate(t) {
  return pulse(t, RELEASE_AT - 0.16, 0.16, RELEASE_AT + 0.22, 0.18);
}

export function createBudgetTimeline() {
  function describe(time) {
    const t = mod(time, BUDGET_LOOP);
    const shapes = Array.from({ length: 6 }, (_, shape) => shapeAt(shape, t));
    const trays = Array.from({ length: BELT.trays }, (_, index) => {
      const x = trayX(index, t);
      return { index, x, visible: Math.abs(x) <= BELT.halfSpan };
    });
    const spending = t >= RELEASE_AT && t < LAND_AT + 0.2;
    const complete = t >= BUDGET_PHASES[4].at && t < BUDGET_PHASES[5].at;
    const funded =
      t < BUDGET_PHASES[1].at ||
      t >= REFUND_START + 5 * FUND_STAGGER + FUND_DURATION;
    return {
      t,
      shapes,
      counts: count(shapes),
      trays,
      belt: { shift: BELT_SPEED * t },
      gates: { big: bigGate(t), small: smallGate(t) },
      iris: crownIris(t),
      lamp: complete || funded ? 0x18b85a : spending ? 0xf2b705 : 0x0d99ff,
    };
  }

  return {
    describe,
    loop: BUDGET_LOOP,
    still: BUDGET_STILL,
    phases: BUDGET_PHASES,
  };
}

export const BUDGET_TIMING = Object.freeze({
  releaseAt: RELEASE_AT,
  mouthAt: MOUTH_AT,
  landAt: LAND_AT,
  dropTime: DROP_TIME,
  beltSpeed: BELT_SPEED,
  wrap: WRAP,
});
