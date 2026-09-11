import * as THREE from "three";
import { createDraft } from "../conveyor/draft.js";
import { host } from "../conveyor/host.js";
import { createMaterials } from "../conveyor/materials.js";
import { createView } from "../conveyor/view.js";
import { createBudgetMachine } from "./budgets.js";
import { createPolicyMachine } from "./policies.js";
import { createSweepsMachine } from "./sweeps.js";

const builders = new Map([
  ["budgets", createBudgetMachine],
  ["policies", createPolicyMachine],
  ["sweeps", createSweepsMachine],
]);

export function mountMachine(element) {
  const build = builders.get(element.dataset.kind);
  if (!build) throw new Error(`Unknown machine: ${element.dataset.kind}`);
  const viewport = element.querySelector("[data-viewport]");
  const play = element.querySelector("[data-play]");
  const slider = element.querySelector("[data-timeline]");
  const phaseLabel = element.querySelector("[data-phase]");
  const phaseControls = element.querySelector("[data-phases]");
  const materials = createMaterials();
  const draft = createDraft(materials);
  const scene = new THREE.Scene();
  const machine = build({ scene, draft, materials });
  const view = createView(machine.view);
  scene.add(draft.grid(40, 80, materials.gridMat));
  const phases = machine.phases;
  let currentPhase = -1;
  const buttons = phases.map((phase) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = phase.label;
    button.className =
      "border border-transparent px-2 py-1 font-mono text-xs text-muted-foreground aria-pressed:border-primary aria-pressed:text-primary";
    button.setAttribute("aria-pressed", "false");
    phaseControls.appendChild(button);
    return button;
  });
  slider.max = String(machine.loop);
  slider.disabled = false;
  play.disabled = false;
  const controller = host(viewport, {
    scene,
    camera: view.camera,
    loop: machine.loop,
    still: machine.still,
    styling: {
      setTheme: materials.setTheme,
      setResolution(width, height, ratio, weight) {
        materials.setResolution(width, height, ratio, Math.max(0.7, weight));
      },
    },
    onPlaybackChange(running, reducedMotion) {
      play.disabled = reducedMotion;
      play.textContent = reducedMotion
        ? "Motion off"
        : running
          ? "Pause"
          : "Play";
    },
    // Keep the complete machine visible on a narrow phone as well as desktop.
    place: () => ({
      zoom: Math.max(1, 1.25 / (viewport.clientWidth / viewport.clientHeight)),
    }),
    framing: view.frameCamera,
    update(t) {
      machine.update(t);
      slider.value = String(t);
      const phase = phases.findLastIndex((candidate) => t >= candidate.at);
      if (phase !== currentPhase) {
        currentPhase = phase;
        phaseLabel.textContent = phases[phase]?.label ?? phases[0].label;
        buttons.forEach((button, index) =>
          button.setAttribute("aria-pressed", String(index === phase)),
        );
      }
    },
  });
  function seek(t) {
    controller.pause();
    controller.seek(t);
  }
  const events = new AbortController();
  const options = { signal: events.signal };
  play.addEventListener(
    "click",
    () => {
      if (controller.running) {
        controller.pause();
        play.textContent = "Play";
      } else {
        controller.resume();
        play.textContent = controller.running ? "Pause" : "Play";
      }
    },
    options,
  );
  slider.addEventListener("input", () => seek(Number(slider.value)), options);
  buttons.forEach((button, index) =>
    button.addEventListener("click", () => seek(phases[index].at), options),
  );
  return {
    machine,
    scene,
    controller,
    destroy() {
      events.abort();
      controller.destroy();
      const geometries = new Set();
      const sceneMaterials = new Set();
      for (const value of Object.values(materials).flat()) {
        if (value?.isMaterial) sceneMaterials.add(value);
      }
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          for (const material of [object.material].flat())
            sceneMaterials.add(material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of sceneMaterials) material.dispose();
      buttons.forEach((button) => button.remove());
    },
  };
}
