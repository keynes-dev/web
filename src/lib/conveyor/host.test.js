import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { host } from "./host.js";

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      setClearColor() {}
      setPixelRatio() {}
      setSize() {}
      render() {}
      dispose() {}
      forceContextLoss() {}
    },
  };
});

let intersection;
let motion;
let frames;
let nextFrame;
let resize;
let drawing;

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  motion = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => motion);
  vi.stubGlobal("requestAnimationFrame", (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id) => frames.delete(id));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback) {
        resize = callback;
      }
      observe() {
        resize();
      }
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback) {
        intersection = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect() {},
    fillRect() {},
    getImageData() {
      return { data: [255, 255, 255, 255] };
    },
  });
});

afterEach(() => {
  drawing?.destroy();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mount() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const update = vi.fn();
  drawing = host(element, {
    scene: new THREE.Scene(),
    camera: new THREE.OrthographicCamera(),
    update,
    loop: 10,
    still: 4,
    styling: { setTheme() {}, setResolution() {} },
    framing() {},
  });
  return update;
}

describe("animation playback lifecycle", () => {
  it("preserves an explicit pause when the drawing scrolls back into view", () => {
    mount();
    intersection([{ isIntersecting: true }]);
    expect(frames.size).toBe(1);
    drawing.pause();
    intersection([{ isIntersecting: false }]);
    intersection([{ isIntersecting: true }]);
    expect(drawing.running).toBe(false);
    expect(frames.size).toBe(0);
    drawing.resume();
    expect(frames.size).toBe(1);
  });

  it("cancels the queued frame before starting a replacement loop", () => {
    mount();
    intersection([{ isIntersecting: true }]);
    drawing.stop();
    drawing.start();
    expect(frames.size).toBe(1);
    drawing.destroy();
    expect(frames.size).toBe(0);
    drawing = undefined;
  });

  it("holds a meaningful reduced-motion frame and permits manual inspection", () => {
    motion.matches = true;
    const update = mount();
    expect(update).toHaveBeenLastCalledWith(4);
    expect(frames.size).toBe(0);
    drawing.seek(7);
    resize();
    expect(update).toHaveBeenLastCalledWith(7);
    drawing.resume();
    expect(frames.size).toBe(0);
  });
});
