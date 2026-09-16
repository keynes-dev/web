# Belt optimization checkpoint

The SVG preview keeps roller teeth stationary and rotates only their face marks. The fixed bodies join the static occlusion geometry. Individual slats keep their original geometry and movement, with separate visibility bounds. Stationary and moving outlines use separate SVG paths; unchanged paths skip DOM writes.

This deliberately changes gear motion. The earlier WebGL equivalence captures do not establish equivalence for this revision. The arm, box rotation, and timeline are unchanged. Production still selects the WebGL renderer.

## Moving-frame CPU probe

Measured on macOS 26.5.2 arm64, Node.js 25.9.0. The baseline contains the slat split already present when this work began, with the original rotating rollers. Before and after ran sequentially after the builds and tests completed. Each viewport had one warm-up pass followed by 72 measured frames, sampled every third frame from the 216 belt-moving frames in the 60 Hz timeline. Pauses are excluded.

| Viewport and rendering DPR | Before median | After median | Before p99 | After p99 |
| -------------------------- | ------------- | ------------ | ---------- | --------- |
| 1280 x 416, DPR 2          | 93.94 ms      | 48.43 ms     | 111.30 ms  | 62.01 ms  |
| 390 x 224, DPR 1           | 88.86 ms      | 44.39 ms     | 104.04 ms  | 51.63 ms  |

The SVG sink runs geometry and path generation without browser painting. These are CPU update measurements, not frame rates. With 72 observations, the reported p99 is the largest sample. They show roughly half the update cost, but still fail a 16.7 ms frame budget. Desktop geometry preparation and spatial indexing average 34.21 ms; clipping outlines averages 12.10 ms. A dedicated translated belt layer with masks is not implemented in this checkpoint.

The probe and raw results are retained locally under `.artifacts/conveyor/belt-optimization/`: `measure.mjs`, `before-gate.mjs`, `before-controlled.json`, and `after-controlled.json`. Earlier exploratory measurements in that directory overlapped and are excluded from this table.

## Browser playback

Chromium 152 at 1280 x 416, native and rendering DPR 1, completed one warm-up loop and three measured loops with no hidden-document interval. Across 3,496 measured frames, median update cost was 4.0 ms, p99 was 55.2 ms, and 92.16% of frame intervals were below 25 ms. Long tasks remained. The full-loop median includes pauses and must not be used as the belt-motion cost. Raw results are retained at `.artifacts/conveyor/belt-optimization/browser-desktop.json`.

The 99% below 25 ms and no-long-task requirements still fail. This attempt improves belt-motion CPU cost; it does not qualify the SVG renderer for production. Paced mobile playback was not measured in this attempt.

## Verification

- `node --test apps/web/tools/conveyor/projection.test.mjs apps/web/tools/conveyor/playback.test.mjs apps/web/tools/conveyor/optimization.test.mjs`: 16 passed. Includes fixed-body versus rotating-mark behavior, reverse seeks, resizing, DPR changes, and existing arm/box transform coverage.
- `pnpm --filter @keynes/web typecheck`: passed, with the existing unused `s` hint in `parts/ducting.js`.
- `pnpm --filter @keynes/web build`: passed, with the existing large-chunk warning for the production WebGL bundle.
- `pnpm exec oxlint apps/web/tools/conveyor`: passed.
- Targeted `pnpm exec oxfmt --check` and `git diff --check`: passed.
- Browser inspection: desktop 1280 and mobile 390 CSS pixels, during belt motion. No console errors were reported. Full-cycle visual comparison, Safari, Firefox, and physical-device verification: NOT RUN for this change.

Measured source is the uncommitted worktree based on `082ed52bc9aa7c3664d3280ea905dd76de3b9d1a`. SHA-256 identifiers for the rendering implementation:

```text
bc98d67f2fb6e22f2fb0bbf9cb5969b5fb1727e70e941be40ba6bfde7a79412a  belt.js
5e35bc7e6497c6aee75ed38f61359f5684dfcf52e745612dd8f15c730098b8b1  gate.js
6983c36617ec1e99d5467a73bee1dccdff6f399186b4bd368d5f53de2ef1ceed  projection.js
```

## Hidden-surface follow-up

The next pass removes permanently hidden slat geometry during scene preparation. Across 120 slats, input triangles fall from 1,440 to 720, outline edges from 1,440 to 1,080, and vertices from 960 to 840. The remaining edges belong to visible faces of a convex box, so their repeated self-occlusion checks are skipped. Scene occlusion remains active. This optimization relies on the existing fixed camera direction and translation-only slat movement.

The lower return run is not deleted. A geometry probe at loop times 0, 2.13, 5.3, 7.6, and 10.8 seconds found visible edge fragments on lower slats. Removing the run wholesale would change the picture. The new preparation also removes tiny hidden-edge endpoint fragments that the old depth epsilon allowed through.

The same 72-frame CPU probe ran sequentially before and after, with builds, tests, and browser activity finished. The baseline here is the fixed-gear renderer from the preceding checkpoint, not the original rotating-gear renderer.

| Viewport and rendering DPR | Before median | After median | Before p99 | After p99 |
| -------------------------- | ------------- | ------------ | ---------- | --------- |
| 1280 x 416, DPR 2          | 45.96 ms      | 45.48 ms     | 56.17 ms   | 52.66 ms  |
| 390 x 224, DPR 1           | 42.41 ms      | 41.80 ms     | 53.96 ms   | 49.02 ms  |

The median difference is small, about 0.5–0.6 ms, and does not establish a material playback improvement. The old renderer already rejected back-facing triangles after vertex projection, so this pass mostly saves earlier projection work and hidden-edge handling. Moving-scene preparation and clipping remain expensive. Paced browser timing was NOT RUN again for this pass.

All 17 conveyor tests pass, including exact equality of projected slat faces across seven belt shifts and wraparound, and equality of visible outlines after excluding depth-epsilon endpoint fragments shorter than 0.001 scene units. A 14-frame comparison across desktop and mobile leaves every SVG path unchanged except the moving regular-weight outline path. Desktop DPR 2 and mobile DPR 1 frames were inspected in Chromium, with no console errors. Full-cycle raster equivalence is NOT RUN. Web typecheck, production build, and conveyor lint pass, retaining the previously noted hint and bundle warning.

The probe, baseline renderer, comparison script, and raw results are retained locally under `.artifacts/conveyor/hidden-surfaces/`. The final timing files are `before-final.json` and `after-final.json`; earlier exploratory timing files are excluded from this table. The source remains based on `082ed52bc9aa7c3664d3280ea905dd76de3b9d1a`, with these updated SHA-256 identifiers:

```text
fd84bf809cafb1fc6b668853b71096357063cf9c4f30f3c66e64708f6840b89e  belt.js
13c1a96e8e275034cf8448df1a172b6681418bcd76904dc9ca135bfb5529f078  gate.js
```
