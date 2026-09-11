/*
  The throwing schedule has no Three.js dependency. The renderer and the tests
  both ask this module where the pouch and every ball are at a given instant,
  which keeps a scrubbed frame identical to a frame reached by playing.
*/
import { glide, mod, smooth } from "../conveyor/math.js";

export const BALL_RADIUS = 0.16;
export const BOWL_FLOOR_TOP = 0.03;
export const GRAVITY = 9.8;
export const TARGET = Object.freeze({
  x: 8,
  y: BOWL_FLOOR_TOP + BALL_RADIUS,
  z: 0,
  radius: 0.7,
});

const PIVOT = Object.freeze({ x: 0, y: 2.7, z: 0 });
const ARM_LENGTH = 2.12;
const SLING_LENGTH = 0.92;
const LOAD_ANGLE = -0.78;
const SWING_START = 0.46;
const SWING_TOP = 2.08;
const THROW_LENGTH = 3.1;
const THROWS_PER_SETTING = 3;
const STAGE_LENGTH = THROW_LENGTH * THROWS_PER_SETTING;
const INTERPHASE_LENGTH = 0.82;

export const PHASES = Object.freeze([
  {
    label: "Initial throws fall short",
    at: 0,
    leverage: 0.74,
    gearAngle: 0,
    releaseAt: 1.15,
    releaseNotch: -0.16,
    whip: 0.9,
    velocityScale: 1.4,
    throws: [0.84, 0.92, 1],
  },
  {
    label: "Counterweight gear overshoots",
    at: STAGE_LENGTH + INTERPHASE_LENGTH,
    leverage: 1.04,
    gearAngle: 0.7,
    releaseAt: 1.15,
    releaseNotch: -0.16,
    whip: 0.9,
    velocityScale: 1.9,
    throws: [0.94, 1, 1.06],
  },
  {
    label: "Release notch catches the bowl",
    at: (STAGE_LENGTH + INTERPHASE_LENGTH) * 2,
    leverage: 1.04,
    gearAngle: 0.7,
    releaseAt: 1.01,
    releaseNotch: 0.31,
    whip: 0.9,
    velocityScale: 1.9,
    throws: [0.94, 1, 1.06],
  },
]);

export const LOOP = PHASES[PHASES.length - 1].at + STAGE_LENGTH;

export const SWEEPS_DIMENSIONS = Object.freeze({
  pivot: PIVOT,
  armLength: ARM_LENGTH,
  loadAngle: LOAD_ANGLE,
});

export function phaseAt(time) {
  const t = mod(time, LOOP);
  let index = PHASES.length - 1;
  for (let candidate = 1; candidate < PHASES.length; candidate++) {
    if (t < PHASES[candidate].at) {
      index = candidate - 1;
      break;
    }
  }
  const phase = PHASES[index];
  const phaseTime = t - phase.at;
  const next = PHASES[index + 1];
  const adjusting = Boolean(next && phaseTime >= STAGE_LENGTH);
  return {
    index,
    phase,
    time: Math.min(phaseTime, STAGE_LENGTH),
    adjusting,
    adjustment: adjusting
      ? glide((phaseTime - STAGE_LENGTH) / INTERPHASE_LENGTH)
      : 0,
    next,
  };
}

// The arm accelerates through release, clears the top of its swing, then is
// winched back to the loaded pose while the ball sits where it landed.
export function armAngle(_phase, time) {
  if (time <= SWING_START) return LOAD_ANGLE;
  if (time < SWING_TOP) {
    const u = Math.min(1, (time - SWING_START) / (SWING_TOP - SWING_START));
    // Release happens partway through this sweep, where the arm still has
    // angular speed. A zero-speed ease at the release would make the ball's
    // forward launch a visible teleport.
    return LOAD_ANGLE + ((0.92 - LOAD_ANGLE) * (1 - Math.cos(Math.PI * u))) / 2;
  }
  if (time < 2.8) {
    const u = glide((time - SWING_TOP) / (2.8 - SWING_TOP));
    return 0.92 + (LOAD_ANGLE - 0.92) * u;
  }
  return LOAD_ANGLE;
}

export function armTip(phase, time) {
  const angle = armAngle(phase, time);
  return {
    x: PIVOT.x + ARM_LENGTH * Math.cos(angle),
    y: PIVOT.y + ARM_LENGTH * Math.sin(angle),
    z: 0,
  };
}

// The pouch trails below the arm until it opens. Its coordinates at each ball's
// release instant become that ball's ballistic origin.
export function pouchPosition(phase, time) {
  const angle = armAngle(phase, time);
  const swing = smooth((time - SWING_START) / (SWING_TOP - SWING_START));
  const slingAngle = angle - 1.48 + phase.whip * swing * swing;
  const tip = armTip(phase, time);
  return {
    x: tip.x + SLING_LENGTH * Math.cos(slingAngle),
    y: tip.y + SLING_LENGTH * Math.sin(slingAngle),
    z: 0,
  };
}

export function releaseTime(phase, ball) {
  return ball * THROW_LENGTH + phase.releaseAt;
}

export function projectileStart(phase, _ball) {
  return pouchPosition(phase, phase.releaseAt);
}

export function pouchVelocity(phase, time) {
  const delta = 1e-4;
  const before = pouchPosition(phase, time - delta);
  const after = pouchPosition(phase, time + delta);
  return {
    x: (after.x - before.x) / (2 * delta),
    y: (after.y - before.y) / (2 * delta),
    z: 0,
  };
}

// Every throw has a little spread, but the chosen ground position is solved
// from the same ballistic equation used to draw the ball in flight.
export function launch(phase, ball) {
  const start = projectileStart(phase, ball);
  const tangent = pouchVelocity(phase, phase.releaseAt);
  // The gear changes how much of the sling's measured release velocity reaches
  // the ball. It never invents a new launch direction, so a rendered ball and
  // its pouch leave along the same forward, upward tangent.
  const scale = phase.velocityScale * phase.throws[ball];
  const vx = tangent.x * scale;
  const vy = tangent.y * scale;
  const flight =
    (vy + Math.sqrt(vy * vy + 2 * GRAVITY * (start.y - TARGET.y))) / GRAVITY;
  const landingX = start.x + vx * flight;
  return {
    start,
    flight,
    landingX,
    vx,
    vy,
    tangent,
  };
}

export function projectilePosition(phase, ball, elapsed) {
  const shot = launch(phase, ball);
  if (elapsed <= 0) return { ...shot.start };
  if (elapsed >= shot.flight) return { x: shot.landingX, y: TARGET.y, z: 0 };
  return {
    x: shot.start.x + shot.vx * elapsed,
    y: shot.start.y + shot.vy * elapsed - 0.5 * GRAVITY * elapsed * elapsed,
    z: 0,
  };
}

export function landsInBowl(landingX) {
  return Math.abs(landingX - TARGET.x) <= TARGET.radius - BALL_RADIUS;
}

export function landingFor(phase, ball) {
  return launch(phase, ball).landingX;
}

function settledBall(phase, ball) {
  return {
    phase: PHASES.indexOf(phase),
    ball,
    release: releaseTime(phase, ball),
    landingX: landingFor(phase, ball),
    hit: landsInBowl(landingFor(phase, ball)),
    state: "landed",
    position: { x: landingFor(phase, ball), y: TARGET.y, z: 0 },
  };
}

export function describeSweeps(time) {
  const at = phaseAt(time);
  const phase = at.phase;
  const shot = Math.min(
    THROWS_PER_SETTING - 1,
    Math.floor(at.time / THROW_LENGTH),
  );
  const shotTime = at.time - shot * THROW_LENGTH;
  const adjustment = at.adjustment;
  const next = at.next ?? phase;
  const leverage =
    phase.leverage + (next.leverage - phase.leverage) * adjustment;
  const gearAngle =
    phase.gearAngle + (next.gearAngle - phase.gearAngle) * adjustment;
  const releaseNotch =
    phase.releaseNotch + (next.releaseNotch - phase.releaseNotch) * adjustment;
  const tip = armTip(phase, shotTime);
  const pouch = pouchPosition(phase, shotTime);
  const balls = [];

  PHASES.forEach((candidate, phaseIndex) => {
    candidate.throws.forEach((_, ball) => {
      const landingX = landingFor(candidate, ball);
      if (
        phaseIndex < at.index ||
        (at.adjusting && phaseIndex === at.index) ||
        (phaseIndex === at.index && ball < shot)
      ) {
        balls.push(settledBall(candidate, ball));
        return;
      }
      if (phaseIndex > at.index || ball > shot) {
        balls.push({
          phase: phaseIndex,
          ball,
          release: releaseTime(candidate, ball),
          landingX,
          hit: landsInBowl(landingX),
          state: "waiting",
          position: { x: 0, y: 0, z: 0 },
        });
        return;
      }

      const release = releaseTime(phase, ball);
      const elapsed = shotTime - phase.releaseAt;
      const launchSpec = launch(phase, ball);
      const launched = elapsed >= 0;
      const landed = elapsed >= launchSpec.flight;
      balls.push({
        phase: phaseIndex,
        ball,
        release,
        landingX,
        hit: landsInBowl(landingX),
        state: !launched ? "loaded" : landed ? "landed" : "flying",
        position: !launched ? pouch : projectilePosition(phase, ball, elapsed),
      });
    });
  });

  return {
    phase: at.index,
    phaseTime: at.time,
    shot,
    shotTime,
    adjusting: at.adjusting,
    adjustment,
    angle: armAngle(phase, shotTime),
    tip,
    pouch,
    target: TARGET,
    leverage,
    gearAngle,
    releaseAt: phase.releaseAt,
    releaseNotch,
    balls,
  };
}
