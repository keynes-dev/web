import {
  CONFIG,
  choosePlace,
} from "../../src/components/home/HeroSection/conveyor/config.js";
import { createGate } from "./gate.js";
import { playback } from "./playback.js";

// The comparison page supplies the exported artwork. Production loading stays
// separate until the SVG renderer passes its visual and performance checks.
export function createConveyor(
  container,
  { data, place = choosePlace, record = false },
) {
  const drawing = createGate(container, data, { place, record });
  const first = drawing.timeline.cycles.find((cycle) => cycle.entry);
  const still = first.start + first.dropStart + 0.7;
  const clock = playback({
    draw: drawing.draw,
    loop: drawing.timeline.loop,
    still,
  });
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const followMotion = () => clock.setReduced(motion.matches);
  const followVisibility = () => clock.setHidden(document.hidden);
  const observer = new IntersectionObserver((entries) => {
    clock.setVisible(entries.some((entry) => entry.isIntersecting));
  });
  followMotion();
  followVisibility();
  observer.observe(container);
  motion.addEventListener("change", followMotion);
  document.addEventListener("visibilitychange", followVisibility);
  return {
    config: CONFIG,
    timeline: drawing.timeline,
    controls: { seek: clock.seek, start: clock.start, stop: clock.stop },
    svg: drawing.svg,
    samples: drawing.samples,
    costs: drawing.costs,
    destroy() {
      clock.destroy();
      observer.disconnect();
      motion.removeEventListener("change", followMotion);
      document.removeEventListener("visibilitychange", followVisibility);
      drawing.destroy();
    },
  };
}
