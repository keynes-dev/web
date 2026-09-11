/*
  The scene modules are geometry, not schedule, so they are not asserted frame
  by frame. What is worth holding is that each one still builds: every machine
  reaches across into the conveyor's drafting toolkit and parts, and a rename
  there is otherwise only discovered in the browser.
*/
import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { createDraft } from "../conveyor/draft.js";
import { createMaterials } from "../conveyor/materials.js";
import { createBudgetMachine } from "./budgets.js";
import { createPolicyMachine } from "./policies.js";
import { createSweepsMachine } from "./sweeps.js";

const machines = [
  ["budgets", createBudgetMachine],
  ["policies", createPolicyMachine],
  ["sweeps", createSweepsMachine],
];

describe.each(machines)("%s machine", (name, build) => {
  const materials = createMaterials();
  const draft = createDraft(materials);
  const scene = new THREE.Scene();
  const machine = build({ scene, draft, materials });

  it("builds a scene with a loop, a still and phases", () => {
    expect(machine.loop).toBeGreaterThan(0);
    expect(machine.still).toBeGreaterThanOrEqual(0);
    expect(machine.still).toBeLessThan(machine.loop);
    expect(machine.phases.length).toBeGreaterThan(0);
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it("draws every frame of its loop without throwing", () => {
    for (let t = 0; t < machine.loop; t += machine.loop / 240) {
      expect(() => machine.update(t), `${name} at t=${t.toFixed(2)}`).not.toThrow();
    }
  });

  it("leaves no Resource at a position it cannot draw", () => {
    const bad = [];
    for (let t = 0; t < machine.loop; t += machine.loop / 240) {
      machine.update(t);
      scene.traverse((object) => {
        const { x, y, z } = object.position;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          bad.push(`${object.type} at t=${t.toFixed(2)}`);
        }
      });
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });
});
