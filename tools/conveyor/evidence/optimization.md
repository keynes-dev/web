# SVG optimization checkpoint

The SVG renderer is substantially faster and its geometry is smaller, with the full loop and responsive artwork preserved. It still fails the frame-pacing and no-regression gates. The homepage therefore continues to use Three.js. This is a local checkpoint for [KEY-110](https://linear.app/keynes/issue/KEY-110/replace-the-passive-threejs-hero-loop-with-responsive-svgcss-animation), not production acceptance.

## Changes

The geometry compiler shares 16 templates across 106 moving instances. It omits unused static backfaces and redundant diagnostic data from the transfer asset. Sorted coordinate dictionaries, integer deltas, and variable-length integer encoding retain the existing seven-decimal coordinate precision. Decoding reproduces every runtime coordinate, face, edge, static fill path, and timing value exactly.

The renderer rejects offscreen geometry with a stroke margin, caches each group's projected pose and visibility against itself and the fixed scene, and invalidates cached output when nearby moving geometry changes. Unchanged frames only update the lamp when needed. Moving geometry remains live; no animation frames are baked or retained. Instrumentation is opt-in and bounded.

The comparison page keeps the frozen SVG renderer available, separates optimized evidence filenames from the original captures, and measures one warm-up loop followed by three complete loops. Controls are disabled during measurement. It records page long tasks and whether the document became hidden.

## Measured playback

Measurements used Chromium 152 on macOS with an Apple M5, on September 16, 2026. The browser's observed uncapped cadence was approximately 120 Hz. Desktop used 1280 x 416 with rendering DPR 2; mobile used 390 x 224 with rendering DPR 1. Native DPR was 1 in the viewport fixture, and forced rendering DPR is recorded separately. Other CPU-intensive verification jobs were paused during timing. No measurement included a hidden document.

| Renderer      | Viewport | Update median | Update p99 | Frame intervals below 25 ms | Page long tasks |
| ------------- | -------- | ------------- | ---------- | --------------------------- | --------------- |
| Original SVG  | Desktop  | 157.6 ms      | 232.8 ms   | 0%                          | 261             |
| Optimized SVG | Desktop  | 4.8 ms        | 96.1 ms    | 92.6%                       | 131             |
| Three.js      | Desktop  | 0.9 ms        | 2.1 ms     | 100%                        | 0               |
| Optimized SVG | Mobile   | 4.9 ms        | 88.7 ms    | 92.7%                       | 143             |
| Three.js      | Mobile   | 1.1 ms        | 2.6 ms     | 100%                        | 0               |

These are update timings and animation-frame intervals, not an isolated browser paint/GPU profile. Page long tasks were observed during each measurement; a tracing-based attribution was not run. The SVG median benefits from cached poses and pauses. Motion still requires expensive depth clipping, especially through the belt and articulated intersections, so median improvements do not imply uniformly smooth playback.

The required 99% below 25 ms, absence of long tasks, and no main-thread regression are not established. The observed results already fail the first two thresholds and show substantially higher update costs than Three.js. A dedicated 60 Hz device check is NOT RUN.

## Transfer size

| Asset                                           | Gzipped bytes |
| ----------------------------------------------- | ------------- |
| Original expanded SVG geometry                  | 364,330       |
| Compact SVG geometry                            | 67,154        |
| Minified dependency-free controller and decoder | 10,648        |
| Compact geometry plus controller                | 77,802        |
| Original production Three.js animation bundle   | 156,911       |

The standalone geometry and controller are 50.4% smaller than the original animation bundle. This is not final production transfer acceptance: homepage loading and the SVG still rendered before JavaScript initializes are not integrated or counted. The standalone runtime's dependency graph contains only the scene configuration, timeline, math, SVG drawing, playback, and geometry decoder. No Three.js or other animation dependency appears in that bundle.

## Fidelity and checks

Fresh Chromium captures compare 2,722 synchronized frame pairs: 839 full-cycle samples each at desktop DPR 2 and mobile DPR 1, plus 58 phase-boundary poses at all nine reference widths and both rendering DPRs. All comparisons have zero missing opaque interior pixels. The worst frames retain the previous checkpoint's maxima of two missing and ten extra isolated stroke pixels under the one-CSS-pixel neighborhood diagnostic. Every DPR 2 phase-boundary capture has zero unmatched stroke pixels. These metrics locate differences for inspection; they do not by themselves prove fidelity. The rejected turn was also inspected in the browser, and the existing projection and motion tests continue to match the reference.

The first and exact loop-end PNGs are byte-identical at both full-cycle sizes. Focused tests prove packed geometry equality and cache invalidation across forward/reverse seeks, resizing, and DPR changes.

- All 15 conveyor tests pass, including projection, clipping, motion, playback, compact geometry, and cache invalidation.
- `pnpm --filter @keynes/web typecheck` passes with the existing unused `s` hint in `parts/ducting.js`.
- `pnpm --filter @keynes/web build` passes with the existing Three.js chunk-size warning because production is unchanged.
- `pnpm test:repository` passes all 62 tests.
- Conveyor lint, formatting, and `git diff --check` pass.

The [measurement record](optimization-report.json) contains capture metadata, viewport summaries, runtime/geometry hashes, timing summaries, and raw-report hashes. Raw captures and detailed measurements remain in ignored `.artifacts/conveyor/`. The frozen SVG baseline is `9a47cf2`; the Three.js source is unchanged from `b6563991a6170f2da547d5f15be39aa66369bb3a`. The user's modified social image is untouched.

NOT RUN: Firefox, Safari, physical iOS Safari and Android Chrome, dedicated 60 Hz qualification, total paint/GPU profiling, and final production loading/still/custom-element integration. The feature remains In Progress, with no homepage switch, dependency removal, merge, or production acceptance.
