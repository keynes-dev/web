import assert from "node:assert/strict";
import test from "node:test";
import { playback } from "./playback.js";

function fixture() {
  let now = 0,
    id = 0;
  const callbacks = new Map(),
    frames = [];
  const control = playback({
    loop: 10,
    still: 3,
    draw: (time) => frames.push(time),
    clock: {
      now: () => now,
      request: (fn) => {
        callbacks.set(++id, fn);
        return id;
      },
      cancel: (key) => callbacks.delete(key),
    },
  });
  return {
    control,
    frames,
    callbacks,
    advance(ms) {
      now += ms;
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const fn of pending) fn(now);
    },
  };
}

test("seeking is deterministic, wraps negative times, and stops the clock", () => {
  const { control, frames, callbacks, advance } = fixture();
  assert.deepEqual(frames, [3]);
  control.setVisible(true);
  advance(16);
  control.seek(-1);
  assert.equal(frames.at(-1), 9);
  assert.equal(callbacks.size, 0);
  advance(1000);
  assert.equal(frames.at(-1), 9);
  control.start();
  advance(16);
  assert.ok(Math.abs(frames.at(-1) - 9.016) < 1e-10);
  assert.throws(() => control.seek(NaN), TypeError);
});

test("offscreen and hidden pauses resume without including suspended wall time", () => {
  const { control, frames, advance } = fixture();
  control.setVisible(true);
  advance(16);
  control.setVisible(false);
  advance(20000);
  control.setVisible(true);
  advance(16);
  assert.equal(frames.at(-1), 0.032);
  control.setHidden(true);
  advance(20000);
  control.setHidden(false);
  advance(16);
  assert.equal(frames.at(-1), 0.048);
  advance(1000);
  assert.ok(Math.abs(frames.at(-1) - 0.148) < 1e-10);
});

test("reduced motion holds the designated still and removal cancels every callback", () => {
  const { control, frames, callbacks, advance } = fixture();
  control.setVisible(true);
  advance(16);
  control.setReduced(true);
  advance(1000);
  assert.equal(frames.at(-1), 3);
  assert.equal(callbacks.size, 0);
  control.setReduced(false);
  advance(16);
  assert.equal(frames.at(-1), 3.016);
  control.stop();
  control.setHidden(true);
  control.setHidden(false);
  assert.equal(callbacks.size, 0);
  control.start();
  control.destroy();
  control.start();
  control.setVisible(true);
  advance(1000);
  assert.equal(callbacks.size, 0);
  assert.equal(frames.at(-1), 3.016);
});
