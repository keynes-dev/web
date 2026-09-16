# Belt-mask startup preparation

The SVG homepage preview loads one generated belt-mask asset before constructing the scene. The four mask paths are identical to runtime clipping at the selected depth. Static machine clipping, moving intersections, stroke widths, and animation timing retain their existing calculations. Other clipping depths use runtime preparation.

## Measurements

Recorded 2026-09-16 on Apple M5, Darwin 25.5.0, Node v26.5.0. Checkout base: c709cd96cfac6b19e1b3ebde3d4af8d83d3bbbd1, with local startup changes. `node apps/web/tools/conveyor/measure-startup.mjs` alternates runtime and generated-mask preparation, discards the first run of each, and records three subsequent runs. Both modes skip duplicate initialization. Generated-mask timings include JSON parsing.

| CSS viewport | DPR | Runtime runs, ms | Generated runs, ms | Median change | Selected asset, gzip |
| --- | --- | --- | --- | --- | --- |
| 1280 x 416 | 2 | 1327, 1102, 1032 | 230, 156, 133 | 1102 to 156 ms | 35,213 bytes |
| 390 x 224 | 2 | 1045, 942, 991 | 134, 160, 145 | 991 to 145 ms | 32,912 bytes |

This is the Node SVG sink, which measures geometry preparation and SVG writes. It excludes network transfer, geometry unpacking before scene creation, browser parsing of modules, and painting. Do not interpret the roughly 86% reduction as a measured reduction in browser page load time. The six assets range from 32,912 to 40,719 gzip bytes; only the matching variant is requested at startup.

## Verification

- `node --test apps/web/tools/conveyor/static-scene.test.mjs apps/web/tools/conveyor/startup.test.mjs apps/web/tools/conveyor/playback.test.mjs`: 11 passed.
- Generated masks match runtime clipping exactly at heights 224, 256, and 416 with DPR 1 and 2. Complete SVG attributes and paths match at times 0, 3.85, 7.6, 9, and immediately before loop wrap, normalizing only instance-specific clip IDs. A mismatched cache depth exercises runtime fallback.
- The extracted static preparation produced the same initial SVG as the previous renderer in a separate comparison.
- Homepage at localhost:4321, 224px drawing height: SVG present and initialization ready after reload.
- Targeted lint, web typecheck, and production build passed. Existing unused-variable hint and large-chunk build warning remain.
- Browser cold-load timing, network throttling, and cross-browser visual captures: NOT RUN.
- Broader projection and optimization suites remain unavailable without the ignored generated reference files described in the README.

Production continues to select Three.js. These measurements apply to the development SVG preview and do not qualify the original production replacement gates.
