# Box and arm geometry reuse

Recorded 2026-09-16, Apple M5, Darwin 25.5.0, Node v26.5.0. The checkout is based on c709cd96cfac6b19e1b3ebde3d4af8d83d3bbbd1 with local startup and stationary-stroke changes. Both comparison versions include those earlier improvements.

The detailed renderer now shares its four-point projected pose between change detection and indexed projection, compares numeric coordinates instead of string signatures, reuses one vertex buffer per moving group, and computes each group's bounds at most once per frame. Bounds scans no longer allocate four temporary coordinate arrays. Vertex arithmetic retains its previous operation order. Triangle visibility, hole geometry, articulated stroke clipping, and surface intersections retain their existing rules. Internal visibility caching and new pairwise intersection pruning were not implemented in this pass.

## Measurements

The SVG sink measured three full loops after warmup, alternating the order of the baseline and changed renderer. No test or build ran concurrently with this measurement. Each loop samples the same 838 timeline times at 60 samples per second; this does not measure browser frame intervals. The baseline freezes the prior gate and projection implementations; shared helper modules use the current bounds helper in both modes, so the comparison does not isolate every allocation improvement.

| Viewport, DPR 2 | Full-loop median before / after | Full-loop p99 before / after | Turn median before / after | Turn p99 before / after |
| --- | --- | --- | --- | --- |
| 1280 x 416 | 5.39 / 5.22 ms | 27.90 / 25.83 ms | 25.08 / 21.62 ms | 45.26 / 30.40 ms |
| 390 x 224 | 4.98 / 4.96 ms | 25.48 / 24.95 ms | 19.17 / 22.76 ms | 29.89 / 27.74 ms |

The turn interval is 7.3 through 8.0 seconds. The mobile median regressed in this full-loop run, so a second experiment isolated that interval and compared reuse against fresh vertex allocation. It rotated three candidate orders, discarded two warmup passes, and recorded five 42-frame passes per candidate:

| Viewport | Baseline median / p99 | Reused vertices median / p99 | Fresh vertices median / p99 |
| --- | --- | --- | --- |
| 390 x 224 | 21.37 / 29.19 ms | 20.63 / 27.60 ms | 20.95 / 34.03 ms |
| 1280 x 416 | 21.22 / 35.95 ms | 22.06 / 32.93 ms | 21.69 / 35.67 ms |

Reuse lowered p99 in both experiments, but median changes vary by workload and run. This is a modest allocation improvement, not evidence of a consistent large speedup or of the original frame-pacing acceptance gate. Network transfer, browser paint, physical-device performance, and garbage-collection duration were not measured.

## Geometry verification

A separate full-loop comparison matched SVG attributes and paths at all 838 sampled times on both desktop and mobile. It normalized only instance-specific clip IDs and the previously introduced stationary-path grouping. No geometry tolerance was required for the generated SVG paths.

The checked-in `geometry-reuse.test.mjs` verifies all arm, jaw, and box vertex projections through a full cycle against independent point transforms, with a 1e-10 tolerance for the different arithmetic route. Reusing a buffer also exactly matches a fresh indexed projection. Bounds tests retain empty, signed-zero, and nonfinite behavior.

Final checks passed: 14 focused conveyor tests, 62 repository tests, targeted lint and formatting, web typecheck, and production build. The existing unused-variable hint and large-chunk warning remain. The development homepage initializes successfully after reload. Browser raster comparisons and browser frame-pacing measurements for this pass remain NOT RUN; production still selects Three.js.

Comparison scripts and the frozen local gate/projection sources are retained under `.artifacts/conveyor/geometry-reuse/`. Copy the hidden scripts into `apps/web/tools/conveyor/` to rerun their relative imports, and remove the temporary copies afterward. Raw geometry references remain outside the production bundle.
