import * as THREE from "three";
import { describe as suite, expect, it } from "vitest";

import { createDraft } from "../conveyor/draft.js";
import * as materials from "../conveyor/materials.js";
import { createSweepsMachine } from "./sweeps.js";
import {
  BOWL_FLOOR_TOP,
  describeSweeps,
  landingFor,
  landsInBowl,
  launch,
  LOOP,
  PHASES,
  projectilePosition,
  projectileStart,
  pouchVelocity,
  releaseTime,
  TARGET,
} from "./sweeps-timeline.js";

const sceneMachine = () => {
  const scene = new THREE.Scene();
  return {
    scene,
    machine: createSweepsMachine({
      scene,
      draft: createDraft(materials),
      materials,
    }),
  };
};

suite("sweeps trebuchet timeline", () => {
  it("releases three separate shots per setting from the animated pouch", () => {
    for (const phase of PHASES) {
      for (let ball = 0; ball < phase.throws.length; ball++) {
        const release = releaseTime(phase, ball);
        const before = describeSweeps(phase.at + release - 1e-7).balls.find(
          (state) =>
            state.phase === PHASES.indexOf(phase) && state.ball === ball,
        );
        const atRelease = projectilePosition(phase, ball, 0);
        const origin = projectileStart(phase, ball);
        expect(before.position.x).toBeCloseTo(origin.x, 5);
        expect(before.position.y).toBeCloseTo(origin.y, 5);
        expect(atRelease).toEqual(origin);
      }
      const releases = phase.throws.map((_, ball) => releaseTime(phase, ball));
      expect(new Set(releases).size).toBe(3);
    }
  });

  it("shows only one loaded or flying ball at a time and holds landed balls during adjustment", () => {
    for (let time = 0; time < LOOP; time += 0.037) {
      const frame = describeSweeps(time);
      const active = frame.balls.filter(
        (ball) => ball.state === "loaded" || ball.state === "flying",
      );
      expect(active.length).toBeLessThanOrEqual(1);
    }
    const adjustment = describeSweeps(PHASES[1].at - 0.3);
    expect(adjustment.adjusting).toBe(true);
    expect(
      adjustment.balls.filter((ball) => ball.state === "landed"),
    ).toHaveLength(3);
  });

  it("keeps the fixed bowl and every trajectory on the runners' forward plane", () => {
    for (let time = 0; time < LOOP; time += 0.037) {
      const frame = describeSweeps(time);
      expect(frame.target).toBe(TARGET);
      expect(frame.pouch.z).toBe(0);
      for (const ball of frame.balls) expect(ball.position.z).toBe(0);
    }
  });

  it("shows short throws, overshoots, then two spaced catches and one near miss", () => {
    const landings = PHASES.map((phase) =>
      phase.throws.map((_, ball) => landingFor(phase, ball)),
    );
    expect(landings[0].every((x) => x < TARGET.x - TARGET.radius)).toBe(true);
    expect(landings[1].every((x) => x > TARGET.x + TARGET.radius)).toBe(true);
    expect(landings[2].filter(landsInBowl)).toHaveLength(2);
    expect(TARGET.x - landings[2][0]).toBeGreaterThan(TARGET.radius);
    const settled = landings.flat().sort((a, b) => a - b);
    for (let index = 1; index < settled.length; index++)
      expect(settled[index] - settled[index - 1]).toBeGreaterThanOrEqual(0.32);
  });

  it("launches forward and upward along the moving pouch tangent", () => {
    for (const phase of PHASES) {
      const tangent = pouchVelocity(phase, phase.releaseAt);
      expect(tangent.x).toBeGreaterThan(0);
      expect(tangent.y).toBeGreaterThan(0);
      for (let ball = 0; ball < phase.throws.length; ball++) {
        const shot = launch(phase, ball);
        expect(shot.vx).toBeGreaterThan(0);
        expect(shot.vy).toBeGreaterThan(0);
        expect(shot.vx / shot.vy).toBeCloseTo(tangent.x / tangent.y, 9);
      }
    }
  });

  it("uses the bowl's actual open top and rests each landed ball on its floor", () => {
    const { scene, machine } = sceneMachine();
    const bowl = scene.getObjectByName("sweeps-bowl-shell");
    expect(bowl.geometry.parameters.radiusTop).toBe(TARGET.radius);
    expect(bowl.material.side).toBe(THREE.DoubleSide);
    machine.update(PHASES[2].at + releaseTime(PHASES[2], 1) + 1.2);
    const landed = scene.getObjectByName("sweeps-ball-7");
    expect(landed.position.y).toBeCloseTo(BOWL_FLOOR_TOP + 0.16, 9);
  });

  it("keeps the gear fixed through every throw and moves controls smoothly between settings", () => {
    const { scene, machine } = sceneMachine();
    const gear = scene.getObjectByName("sweeps-leverage-gear");
    machine.update(PHASES[0].at + 1.1);
    const duringThrow = [gear.position.x, gear.rotation.z];
    machine.update(PHASES[0].at + 1.8);
    expect([gear.position.x, gear.rotation.z]).toEqual(duringThrow);
    machine.update(PHASES[1].at - 0.41);
    const start = [gear.position.x, gear.rotation.z];
    machine.update(PHASES[1].at - 0.2);
    const middle = [gear.position.x, gear.rotation.z];
    machine.update(PHASES[1].at);
    const end = [gear.position.x, gear.rotation.z];
    expect(middle[0]).toBeLessThan(start[0]);
    expect(middle[0]).toBeGreaterThan(end[0]);
    expect(middle[1]).toBeGreaterThan(start[1]);
    expect(middle[1]).toBeLessThan(end[1]);
    machine.update(PHASES[1].at - 0.820001);
    const beforeAdjustment = [gear.position.x, gear.rotation.z];
    machine.update(PHASES[1].at - 0.819999);
    expect(gear.position.x).toBeCloseTo(beforeAdjustment[0], 5);
    expect(gear.rotation.z).toBeCloseTo(beforeAdjustment[1], 5);
  });

  it("changes both lamp states with the throw result and adjustment interval", () => {
    const { machine } = sceneMachine();
    machine.update(PHASES[0].at + PHASES[0].releaseAt);
    expect(materials.lampMat.color.getHex()).toBe(0xe3262e);
    machine.update(PHASES[1].at - 0.3);
    expect(materials.lampMat.color.getHex()).toBe(0xf2b705);
    machine.update(PHASES[2].at + PHASES[2].releaseAt);
    expect(materials.lampMat.color.getHex()).toBe(0x18b85a);
  });
});
