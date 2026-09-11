import { describe, expect, it } from "vitest";

import {
  BUDGET_GEOMETRY,
  BUDGET_LOOP,
  BUDGET_PHASES,
  BUDGET_TIMING,
  createBudgetTimeline,
  trayX,
} from "./budgets-timeline.js";

const timeline = createBudgetTimeline();
const frameAt = (time) => timeline.describe(time);
const at = (label) => BUDGET_PHASES.find((phase) => phase.label === label).at;

describe("Budget resource accounting", () => {
  it("fills the parent globe with two of each Resource kind", () => {
    const held = frameAt(at("Allocate") - 0.1).shapes;
    expect(held.every((shape) => shape.owner === "big")).toBe(true);
    const kinds = held.map((shape) => shape.kind).sort();
    expect(kinds).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it("splits the parent globe evenly between the two child globes", () => {
    const frame = frameAt(at("Spend") - 0.1);
    expect(frame.counts).toMatchObject({ big: 0, left: 3, right: 3, tray: 0 });
  });

  it("gives each child globe one of every Resource kind", () => {
    const frame = frameAt(at("Spend") - 0.1);
    for (const owner of ["left", "right"]) {
      const kinds = frame.shapes
        .filter((shape) => shape.owner === owner)
        .map((shape) => shape.kind)
        .sort();
      expect(kinds, owner).toEqual([0, 1, 2]);
    }
  });

  it("spends one Resource from each child into a passing tray", () => {
    const frame = frameAt(at("Settle") + 0.1);
    expect(frame.counts).toMatchObject({ left: 2, right: 2, tray: 2 });
  });

  it("returns every unspent Resource to the parent globe", () => {
    const frame = frameAt(at("Complete") + 0.2);
    expect(frame.counts).toMatchObject({
      big: 4,
      left: 0,
      right: 0,
      tray: 2,
    });
  });

  it("accounts for exactly six Resources at every instant", () => {
    const bad = [];
    for (let t = 0; t < BUDGET_LOOP; t += 1 / 60) {
      const frame = frameAt(t);
      const owned = Object.entries(frame.counts)
        .filter(([owner]) => owner !== "total")
        .reduce((sum, [, value]) => sum + value, 0);
      if (frame.counts.total !== 6 || owned !== 6) {
        bad.push(`t=${t.toFixed(3)} total=${frame.counts.total} held=${owned}`);
      }
    }
    expect(bad.slice(0, 4)).toEqual([]);
  });

  it("never returns a spent Resource to the parent globe", () => {
    const spent = new Set();
    for (let t = 0; t < at("New budget"); t += 1 / 120) {
      for (const shape of frameAt(t).shapes) {
        if (shape.owner === "tray") spent.add(shape.key);
        if (spent.has(shape.key)) expect(shape.owner).not.toBe("big");
      }
    }
    expect(spent.size).toBe(2);
  });
});

describe("Budget geometry", () => {
  it("rests every held Resource on its container floor", () => {
    for (const [time, owner, floor] of [
      [at("Allocate") - 0.1, "big", BUDGET_GEOMETRY.big.floorTop],
      [at("Spend") - 0.1, "left", BUDGET_GEOMETRY.small.floorTop],
      [at("Spend") - 0.1, "right", BUDGET_GEOMETRY.small.floorTop],
      [at("Settle") + 0.1, "tray", BUDGET_GEOMETRY.tray.floorTop],
    ]) {
      const held = frameAt(time).shapes.filter(
        (shape) => shape.owner === owner,
      );
      expect(held.length, `${owner} holds nothing`).toBeGreaterThan(0);
      for (const shape of held) {
        expect(shape.position[1], `${owner} shape ${shape.key}`).toBeCloseTo(
          floor,
          9,
        );
      }
    }
  });

  it("keeps every held Resource inside its container walls", () => {
    const bounds = {
      big: BUDGET_GEOMETRY.big.floorRadius,
      left: BUDGET_GEOMETRY.small.floorRadius,
      right: BUDGET_GEOMETRY.small.floorRadius,
    };
    const centre = { big: 0, left: BUDGET_GEOMETRY.small.x[0], right: BUDGET_GEOMETRY.small.x[1] };
    const bad = [];
    for (let t = 0; t < BUDGET_LOOP; t += 1 / 60) {
      for (const shape of frameAt(t).shapes) {
        const limit = bounds[shape.owner];
        if (limit === undefined || !shape.visible) continue;
        const reach = Math.hypot(
          shape.position[0] - centre[shape.owner],
          shape.position[2],
        );
        if (reach > limit) {
          bad.push(`${shape.key} reaches ${reach.toFixed(3)} of ${limit}`);
        }
      }
    }
    expect(bad.slice(0, 4)).toEqual([]);
  });
});

describe("Budget motion", () => {
  it("never teleports a Resource while it is visible", () => {
    const jumps = [];
    let before = frameAt(0);
    for (let t = 1 / 120; t < BUDGET_LOOP; t += 1 / 120) {
      const after = frameAt(t);
      for (let index = 0; index < after.shapes.length; index++) {
        const was = before.shapes[index];
        const now = after.shapes[index];
        if (!was.visible || !now.visible || was.key !== now.key) continue;
        const distance = Math.hypot(
          now.position[0] - was.position[0],
          now.position[1] - was.position[1],
          now.position[2] - was.position[2],
        );
        if (distance >= 0.16) {
          jumps.push(`${now.key} moved ${distance.toFixed(3)} at t=${t.toFixed(3)}`);
        }
      }
      before = after;
    }
    expect(jumps.slice(0, 4)).toEqual([]);
  });

  it("closes the loop without a jump at the seam", () => {
    const end = frameAt(BUDGET_LOOP - 1 / 120);
    const start = frameAt(0);
    for (let index = 0; index < start.shapes.length; index++) {
      const was = end.shapes[index];
      const now = start.shapes[index];
      expect(now.visible, `shape ${index} visibility`).toBe(was.visible);
      const distance = Math.hypot(
        now.position[0] - was.position[0],
        now.position[1] - was.position[1],
        now.position[2] - was.position[2],
      );
      expect(distance, `shape ${index} seam jump`).toBeLessThan(0.16);
    }
  });

  it("drops each spent Resource into the tray that is passing beneath it", () => {
    const airborne = frameAt(BUDGET_TIMING.landAt - 1 / 240).shapes.filter(
      (shape) => shape.motion === "spend",
    );
    expect(airborne).toHaveLength(2);
    for (const shape of airborne) {
      const side = shape.id < 3 ? 0 : 1;
      // It is in free fall at its own machine's axis, having been given no
      // sideways push, and about to reach the tray floor.
      expect(shape.position[0]).toBeCloseTo(BUDGET_GEOMETRY.small.x[side], 6);
      expect(shape.position[1]).toBeLessThan(
        BUDGET_GEOMETRY.tray.floorTop + 0.05,
      );
      const under = trayX(side, BUDGET_TIMING.landAt);
      expect(
        Math.abs(shape.position[0] - under),
        `shape ${shape.key} misses its tray`,
      ).toBeLessThan(BUDGET_GEOMETRY.tray.halfWidth);
    }
  });

  it("leads the fall so the tray arrives exactly as the Resource lands", () => {
    for (const side of [0, 1]) {
      const lead =
        BUDGET_GEOMETRY.small.x[side] - trayX(side, BUDGET_TIMING.mouthAt);
      expect(lead, `side ${side} lead`).toBeGreaterThan(0);
      expect(lead).toBeCloseTo(
        BUDGET_TIMING.beltSpeed * BUDGET_TIMING.dropTime,
        6,
      );
    }
  });

  it("only ever climbs on the return riser", () => {
    const drops = [];
    const seen = new Map();
    for (let t = 0; t < BUDGET_LOOP; t += 1 / 240) {
      for (const shape of frameAt(t).shapes) {
        if (shape.motion !== "climb") continue;
        const previous = seen.get(shape.key);
        if (previous !== undefined && shape.position[1] < previous - 1e-9) {
          drops.push(`${shape.key} fell at t=${t.toFixed(3)}`);
        }
        seen.set(shape.key, shape.position[1]);
      }
    }
    expect(drops.slice(0, 4)).toEqual([]);
    expect(seen.size).toBe(4);
  });

  it("carries the remainder above the parent rim before dropping it in", () => {
    const tops = new Map();
    for (let t = 0; t < BUDGET_LOOP; t += 1 / 240) {
      for (const shape of frameAt(t).shapes) {
        if (shape.motion !== "climb") continue;
        tops.set(shape.key, Math.max(tops.get(shape.key) ?? 0, shape.position[1]));
      }
    }
    expect(tops.size).toBe(4);
    for (const [key, top] of tops) {
      expect(top, key).toBeGreaterThan(BUDGET_GEOMETRY.big.rim);
    }
  });

  it("opens each gate only while a Resource is going through it", () => {
    const bigOpen = [];
    const smallOpen = [];
    for (let t = 0; t < BUDGET_LOOP; t += 1 / 120) {
      const frame = frameAt(t);
      if (frame.gates.big > 0.5) bigOpen.push(t);
      if (frame.gates.small > 0.5) smallOpen.push(t);
    }
    expect(Math.min(...bigOpen)).toBeGreaterThan(BUDGET_PHASES[0].at);
    expect(Math.max(...bigOpen)).toBeLessThan(at("Spend"));
    expect(Math.min(...smallOpen)).toBeLessThan(BUDGET_TIMING.releaseAt);
    expect(Math.max(...smallOpen)).toBeLessThan(at("Settle"));
  });

  it("replaces the depleted Budget instead of topping it up", () => {
    const depleted = frameAt(at("Complete") + 1);
    expect(depleted.counts).toMatchObject({ big: 4, tray: 2 });
    expect(depleted.shapes.every((shape) => shape.generation === 0)).toBe(true);

    // The old Budget is wholly gone before the new one exists: at some instant
    // between closing out and refunding, the machine holds nothing at all.
    let empty = null;
    for (let t = at("New budget"); t < BUDGET_LOOP; t += 1 / 60) {
      if (frameAt(t).shapes.every((shape) => !shape.visible)) empty = t;
      if (empty !== null && frameAt(t).shapes.some((shape) => shape.visible)) {
        break;
      }
    }
    expect(empty, "no instant where the machine stands empty").not.toBeNull();
    expect(frameAt(empty).shapes.every((shape) => shape.generation === 0)).toBe(
      true,
    );

    const renewed = frameAt(BUDGET_LOOP - 0.1);
    expect(renewed.counts).toMatchObject({ big: 6, left: 0, right: 0 });
    expect(renewed.shapes.every((shape) => shape.generation === 1)).toBe(true);
  });

  it("takes the root Budget's remainder up and out, never back down", () => {
    const seen = new Map();
    const drops = [];
    for (let t = at("New budget"); t < BUDGET_LOOP; t += 1 / 240) {
      for (const shape of frameAt(t).shapes) {
        if (shape.motion !== "close") continue;
        const previous = seen.get(shape.key);
        if (previous !== undefined && shape.position[1] < previous - 1e-9) {
          drops.push(`${shape.key} fell at t=${t.toFixed(3)}`);
        }
        seen.set(shape.key, shape.position[1]);
      }
    }
    expect(drops.slice(0, 4)).toEqual([]);
    expect(seen.size).toBe(4);
  });

  it("opens the crown for both the remainder leaving and the refill arriving", () => {
    const openWhile = (motion) => {
      for (let t = at("New budget"); t < BUDGET_LOOP; t += 1 / 120) {
        const frame = frameAt(t);
        const passing = frame.shapes.some(
          (shape) =>
            shape.motion === motion &&
            Math.abs(shape.position[1] - BUDGET_GEOMETRY.big.neckTop) < 0.25,
        );
        if (passing && frame.iris < 0.5) return false;
      }
      return true;
    };
    expect(openWhile("close"), "crown shut while remainder leaves").toBe(true);
    expect(openWhile("fund"), "crown shut while refill arrives").toBe(true);
  });

  it("runs the belt a whole number of tray pitches per loop", () => {
    for (let index = 0; index < BUDGET_GEOMETRY.belt.trays; index++) {
      expect(trayX(index, 0)).toBeCloseTo(trayX(index, BUDGET_LOOP), 9);
    }
  });
});
