import { describe, expect, it } from "vitest";
import { createDraft } from "./draft.js";
import { createMaterials, lineMat } from "./materials.js";
import { camera, createView } from "./view.js";
import { mod } from "./math.js";

describe("independent mechanical drawings", () => {
  it("keeps fractional phase boundaries exact when seeking", () => {
    expect(mod(20.24, 29.54)).toBe(20.24);
    expect(mod(-0.5, 10)).toBe(9.5);
    expect(mod(10, 10)).toBe(0);
  });
  it("keeps another drawing's colors and line widths unchanged", () => {
    const first = createMaterials();
    const second = createMaterials();
    const original = lineMat.color.getHex();
    const secondInk = second.lineMat.color.getHex();
    first.setTheme(0xffffff, 0x123456, 0xeeeeee);
    first.setResolution(900, 600, 1, 0.6);
    expect(second.lineMat.color.getHex()).toBe(secondInk);
    expect(lineMat.color.getHex()).toBe(original);
    expect(second.lineMat.linewidth).not.toBe(first.lineMat.linewidth);
    const drawing = createDraft(first).box(1, 1, 1, 0, 0, 0);
    expect(drawing.children[0].material).toBe(first.white);
    expect(drawing.children[1].material).toBe(first.lineMat);
  });

  it("frames a small scene without moving the hero camera", () => {
    const heroProjection = camera.projectionMatrix.clone();
    const first = createView({ height: 8, target: [0, 2, 0] });
    const second = createView({ height: 6, target: [2, 1, 0] });
    const secondProjection = second.camera.projectionMatrix.clone();
    first.frameCamera(0.75, { zoom: 1.2 });
    expect(camera.projectionMatrix.equals(heroProjection)).toBe(true);
    expect(second.camera.projectionMatrix.equals(secondProjection)).toBe(true);
    expect(first.camera).not.toBe(second.camera);
  });
});
