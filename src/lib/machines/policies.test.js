import { describe, expect, it } from "vitest";

import {
  createPolicyTimeline,
  POLICY_GEOMETRY,
  POLICY_TIMES,
} from "./policies-timeline.js";
import { POLICY_ARM_GEOMETRY, solvePolicyArm } from "./policies.js";

const timeline = createPolicyTimeline();
const frameAt = (time) => timeline.describe(time);

describe("policy height gate", () => {
  it("clears exactly three cube heights above the trolley deck", () => {
    expect(POLICY_GEOMETRY.gateClearance).toBe(3 * POLICY_GEOMETRY.cube);
  });

  it("stops the four-cube request before the gate", () => {
    const denied = frameAt(POLICY_TIMES.denied + 0.2);
    expect(denied.lamp).toBe("red");
    expect(denied.cart.front).toBeLessThan(POLICY_GEOMETRY.gateNear);
    expect(denied.cubes.every((cube) => cube.owner === "cart")).toBe(true);
  });
});

describe("policy revision", () => {
  it("keeps the same four cubes throughout the revision", () => {
    for (let time = 0; time < timeline.loop; time += 1 / 60) {
      const cubes = frameAt(time).cubes;
      expect(cubes).toHaveLength(4);
      expect(new Set(cubes.map((cube) => cube.id)).size).toBe(4);
    }

    expect(
      frameAt(POLICY_TIMES.lifted).cubes.map((cube) => cube.owner),
    ).toEqual(["cart", "cart", "grip", "grip"]);
    expect(
      frameAt(POLICY_TIMES.released + 0.1).cubes.map((cube) => cube.owner),
    ).toEqual(["cart", "cart", "tray", "tray"]);
  });

  it("moves the revised two-cube request forward through the same gate", () => {
    for (let time = 0; time < POLICY_TIMES.retry; time += 1 / 120) {
      expect(frameAt(time).cart.front).toBeLessThan(POLICY_GEOMETRY.gateNear);
    }

    let previousX = frameAt(POLICY_TIMES.retry).cart.x;
    for (
      let time = POLICY_TIMES.retry;
      time <= POLICY_TIMES.exited;
      time += 1 / 120
    ) {
      const frame = frameAt(time);
      expect(frame.cart.x).toBeGreaterThanOrEqual(previousX - 1e-10);
      expect(frame.cubes.filter((cube) => cube.owner === "cart")).toHaveLength(
        2,
      );
      previousX = frame.cart.x;
    }
    expect(frameAt(POLICY_TIMES.exited - 1e-6).cart.front).toBeGreaterThan(
      POLICY_GEOMETRY.gateNear,
    );
  });

  it("joins both arm links to the wrist block at every working pose", () => {
    for (
      let time = POLICY_TIMES.revise;
      time <= POLICY_TIMES.retry;
      time += 1 / 60
    ) {
      const pose = frameAt(time).arm;
      const solved = solvePolicyArm(pose.y, pose.z);
      const endY =
        POLICY_ARM_GEOMETRY.shoulderY -
        Math.sin(solved.shoulder) * POLICY_ARM_GEOMETRY.upper -
        Math.sin(solved.shoulder + solved.bend) * POLICY_ARM_GEOMETRY.fore;
      const endZ =
        POLICY_ARM_GEOMETRY.shoulderZ +
        Math.cos(solved.shoulder) * POLICY_ARM_GEOMETRY.upper +
        Math.cos(solved.shoulder + solved.bend) * POLICY_ARM_GEOMETRY.fore;
      expect(endY).toBeCloseTo(solved.wristY, 8);
      expect(endZ).toBeCloseTo(solved.wristZ, 8);
    }
  });

  it("keeps the arm pedestal outside the tray", () => {
    expect(
      POLICY_ARM_GEOMETRY.shoulderZ - POLICY_ARM_GEOMETRY.pedestalHalfDepth,
    ).toBeGreaterThan(POLICY_ARM_GEOMETRY.trayFarZ);
  });
});
