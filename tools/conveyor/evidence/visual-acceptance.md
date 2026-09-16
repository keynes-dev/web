# Full-loop SVG visual checkpoint

The full conveyor loop is implemented in the SVG comparison renderer. This checkpoint covers geometry, motion poses, colors, transparency, occlusion, and responsive framing in Chromium. It does not accept production performance or replace the homepage.

The user changed the execution order after the rejected-box prototype: finish the full loop and visual fidelity before returning to optimization. The earlier performance failure remains historical evidence, not a reason to stop the full-scene implementation.

## Compared output

- Reference source: `b6563991a6170f2da547d5f15be39aa66369bb3a`. Conveyor source is unchanged from the initial `69917d51d3fcd76aa6abee5d3a209357a158515c` baseline. The user's social image is preserved.
- Browser: Codex Chromium 152, macOS, Apple M5. The [machine-readable report](loop-visual-report.json) records user agent, viewport, height, native pixel ratio, forced rendering ratio, dates, implementation digest, and geometry digest.
- Full cycles: 839 frame pairs each at 1280 x 416 with rendering DPR 2 and 390 x 224 with rendering DPR 1. Samples are 1/60 second apart, with the exact loop endpoint included.
- Phase matrix: 58 poses each at widths 320, 390, 640, 768, 1023, 1024, 1280, 1440, and 1920, at rendering DPR 1 and 2. Samples include immediately before and after phase boundaries and the exact reduced-motion still.
- Total: 2,722 synchronized reference/SVG frame pairs across 20 capture sets.
- Forced DPR changes rendering resolution and stroke widths. It is not physical-device emulation. Native DPR is recorded separately.

The frame audit found no missing opaque interior pixels in any of the 2,722 comparisons. At DPR 2, every phase-matrix frame has a matching visible stroke pixel within one CSS pixel of every reference stroke pixel, and vice versa. Full-cycle and DPR 1 captures have a few isolated flagged pixels, with maxima of two missing and ten extra stroke pixels in a frame. Enlarged comparisons show raster coverage differences at thin lines, curved joints, overlaps, and viewport boundaries. These are not whole missing details or shifted components.

Those pixel metrics locate inspection candidates rather than establish acceptance alone. Direct comparisons covered refill and bounce, belt travel, rejection, the complete arm motion, dispensing, depletion, and loop wrap. Geometry is exported from the original scene, preserving the original curve tessellation. Numeric tests compare projection and every moving group against Three.js across the full cycle. Joint and item transforms agree to the tested 1e-9 tolerance; indexed export vertices agree within 2e-7 world units. This is well below the 0.5 CSS-pixel landmark criterion at the tested scales.

Transparent tube interiors were also compared numerically. At the sampled 4.2-second desktop frame, 10,743 glass-only pixels have identical reference and SVG RGBA values. The start and exact loop-end SVG PNGs are byte-identical. The final pre-wrap frame was compared separately; its small raster differences are also present in the original loop.

Resizing a paused 7.6-second pose across 1023 to 1024 pixels and then to 390 pixels preserves the selected time. Height-based scale and the placement change at 64rem use the original configuration.

## Corrections made during comparison

1. Kept the full opaque static coverage. Merging coincident outline edges had introduced transparent gaps in overlapping solids.
2. Matched the source material's polygon depth offset at the current height and rendering DPR. Without it, SVG clipping incorrectly removed nozzle flutes and parts of the duct ribs.
3. Clipped the full width of strokes at articulated-arm and rotating-box intersections. Center-line clipping alone left rounded endpoints where the reference has a tapered visible fragment.
4. Kept glass separate from opaque occlusion and composited it after the line work, with the source tint and opacity.

## Visual evidence

The desktop sheets crop the same region from both renderers. The raw full-frame SVG and PNG pairs remain in ignored `.artifacts/conveyor/`, outside the production bundle.

- [Refill and dispensing, Three.js beside SVG](full-loop-refill-dispense.png).
- [Arm motion and depletion, Three.js beside SVG](full-loop-turn-depletion.png).
- [Mobile comparison](full-loop-mobile.png).
- [All numeric comparisons and capture metadata](loop-visual-report.json).

## Checks

- `node --test apps/web/tools/conveyor/projection.test.mjs apps/web/tools/conveyor/playback.test.mjs`: 13 tests pass. Includes full-cycle motion/visibility, indexed geometry, clipping, opaque coverage, tapered stroke intersections, deterministic seek, offscreen/tab pause, reduced motion, and callback cleanup.
- `pnpm --filter @keynes/web typecheck`: passes. Existing unused `s` hint in the original `parts/ducting.js` remains.
- `pnpm --filter @keynes/web build`: passes. Existing Three.js large-chunk warning remains because the homepage has not switched.
- `pnpm test:repository`: 62 tests pass.
- `pnpm exec oxlint apps/web/tools/conveyor`: passes.
- `pnpm exec oxfmt --check apps/web/tools/conveyor`: passes.

## Not accepted or not run

Optimization is deferred. The complete renderer is visibly below the intended frame rate and its exported geometry is not an optimized delivery format. No transfer-size, frame-pacing, long-task, or total main-thread-cost acceptance is claimed.

NOT RUN: Firefox, Safari, physical iOS Safari, physical Android Chrome, dedicated 60 Hz playback qualification, total browser paint/GPU profiling, browser-level reduced-motion preference changes and removal/reconnection of a production custom element. Playback state transitions are covered by deterministic tests; those do not replace device or production integration checks.

The production homepage still uses Three.js. Production loading, the pre-JavaScript SVG still, dependency removal, and final PR acceptance remain for the later delivery pass. This checkpoint and its evidence are local to the KEY-110 implementation branch; they are not a merged or published feature.
