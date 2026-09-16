# Stationary stroke batches

Recorded 2026-09-16 against the local renderer after the startup improvements. Both comparison versions include precomputed belt masks. The current checkout is based on c709cd96cfac6b19e1b3ebde3d4af8d83d3bbbd1; these changes are uncommitted.

Stationary fine and structural strokes now occupy persistent groups of up to 128 adjacent source segments. A batch checks overlapping moving-group revisions once and skips its members when those revisions are unchanged. Changed batches retain the existing per-segment visibility calculation and write their path only when its output differs. Resizing discards old batches and recalculates viewport membership. Source order, fill paths, translucent glass, moving-part geometry, and line widths remain unchanged.

## CPU comparison

Apple M5, Darwin 25.5.0, Node v26.5.0, SVG sink. Each version ran one warm-up loop followed by one sampled loop at 60 timeline samples per second, 838 frames per size. Browser frame pacing and painting are not measured. Comparing hashes between draws can affect garbage collection; these are indicative single-run measurements, not a statistically established speedup.

| CSS viewport | DPR | Median before | Median after | p99 before | p99 after |
| --- | --- | --- | --- | --- | --- |
| 1280 x 416 | 2 | 5.97 ms | 5.71 ms | 29.71 ms | 29.36 ms |
| 390 x 224 | 2 | 5.67 ms | 5.16 ms | 28.33 ms | 28.59 ms |

A separate desktop loop counted SVG path writes after warmup:

| Metric | Before | After |
| --- | --- | --- |
| Path characters written | 150,916,074 | 129,127,767 |
| Path attribute writes | 10,548 | 10,720 |
| SVG nodes | 116 | 151 |

Path text fell 14.4%; write count rose 1.6%. The added nodes allow smaller independent updates. Browser repaint savings remain NOT RUN. The slowest frames did not improve consistently; detailed projection and clipping during the rejected-box turn remain expensive. The original frame-pacing acceptance gate is not established by this work.

## Fidelity and verification

The baseline and changed renderer produced the same path geometry and presentation attributes for all 838 frames at each size. Comparison concatenated each new stationary batch group into its previous combined path, sorted attribute keys, and normalized instance-specific clip IDs. All other SVG attributes and structure were compared without alteration. This proves path equivalence, not raster pixel equivalence at intersections between separate paths.

A focused test verifies that unchanged batches skip visibility queries, unrelated batches remain unchanged when an occluder enters, removed occlusion restores the original strokes, and rebuilding clears old nodes. Startup and playback tests cover resize, DPR, clock, visibility, and removal. Generated-mask tests exercise six layout/DPR variants and five poses each with the new renderer.

The homepage at localhost:4321 completes SVG startup with the updated groups. Browser raster comparisons and refreshed browser frame-pacing measurements: NOT RUN. Production still selects Three.js.

Comparison source and the prior local renderer are retained outside the production bundle in `.artifacts/conveyor/stationary-batches/`. To rerun those scripts, copy their hidden `.mjs` files back into `apps/web/tools/conveyor/` so their relative imports resolve, then remove those temporary copies after running.
