import { mod } from "../../src/components/home/HeroSection/conveyor/math.js";

export function playback({
  draw,
  loop,
  still,
  clock = {
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
}) {
  let elapsed = 0;
  let last = 0;
  let callback = null;
  let wanted = true;
  let visible = false;
  let hidden = false;
  let reduced = false;
  let destroyed = false;

  function cancel() {
    if (callback !== null) clock.cancel(callback);
    callback = null;
  }
  function tick(now) {
    callback = null;
    elapsed += Math.min(Math.max(now - last, 0), 100) / 1000;
    last = now;
    draw(mod(elapsed, loop));
    callback = clock.request(tick);
  }
  function reconcile() {
    if (destroyed || !wanted || !visible || hidden || reduced) return cancel();
    if (callback !== null) return;
    last = clock.now();
    callback = clock.request(tick);
  }
  draw(elapsed);
  return {
    seek(time) {
      if (!Number.isFinite(time))
        throw new TypeError("Conveyor time must be finite");
      if (destroyed) return;
      wanted = false;
      cancel();
      elapsed = time;
      draw(mod(time, loop));
    },
    start() {
      wanted = true;
      reconcile();
    },
    stop() {
      wanted = false;
      cancel();
    },
    setVisible(value) {
      visible = value;
      reconcile();
    },
    setHidden(value) {
      hidden = value;
      reconcile();
    },
    setReduced(value) {
      if (reduced === value || destroyed) return;
      reduced = value;
      if (value) {
        cancel();
        elapsed = still;
        draw(still);
      }
      reconcile();
    },
    destroy() {
      destroyed = true;
      cancel();
    },
    get time() {
      return mod(elapsed, loop);
    },
    get running() {
      return callback !== null;
    },
  };
}
