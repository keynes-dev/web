# Continuous belt and translated boxes

Both belt runs now use fixed continuous solids. Four seam strips move across their visible top and side faces, clipped once on initialization and resize. The return run moves opposite to the upper run. This intentionally removes the physical gaps between boards, as requested. The lower run supersedes the stationary lower slats in the preceding attempt.

Roller bodies remain fixed. Their cross marks update four projected endpoints each, using the original angular speed and fine stroke width. They no longer project meshes or run per-frame triangle clipping. Fixed clips handle their occlusion.

Boxes reuse self-clipped artwork for upright and inverted poses. Clear of the machine and other moving parts, they translate as SVG groups. Conservative bounds, including stroke clearance, select the detailed renderer near overlaps. The rejected turn retains the original articulated geometry and stroke clipping. All movement still comes from the original timeline.

## Measurements

Chromium 152 on Apple M5, macOS 26.5.2. Each browser run used one warm-up loop and three measured loops without a hidden-document interval. No build or CPU probe ran during the browser measurements. Rendering DPR was forced by the comparison page; this is not physical-device emulation. Playback was uncapped, not a dedicated 60 Hz test.

| Viewport, rendering DPR | Frames | Update median | Update p99 | Intervals below 25 ms | Page long tasks |
| ----------------------- | -----: | ------------: | ---------: | --------------------: | --------------: |
| 1280 x 416, DPR 2       |   3971 |        5.6 ms |    30.1 ms |                96.50% |      One, 56 ms |
| 390 x 224, DPR 1        |   4028 |        6.3 ms |    26.4 ms |                96.90% |            Zero |

The mobile run preceded the final correction from structural to fine width on roller cross marks. Its geometry and playback controller match the final implementation. The desktop run includes that correction. Native DPR was 1 on desktop and 2 on mobile, independently of the forced rendering DPR.

A separate Node.js SVG-sink probe sampled 72 belt-moving frames after a warm-up pass, excluding pauses and browser paint. Median update cost was 9.68 ms on desktop and 10.32 ms on mobile, with p99 of 18.57 ms and 23.37 ms. The earlier slat-pruning checkpoint recorded roughly 45 ms and 42 ms medians. These separate probes demonstrate a substantial CPU reduction but do not establish browser frame rate or production acceptance.

The 99% frame-pacing target and no-long-task requirement still fail. No main-thread parity with Three.js is claimed. Initial clip preparation is visibly slow and remains unqualified. Final compressed transfer size, server-rendered still cost, Firefox, Safari, physical iOS/Android, and a dedicated 60 Hz device: NOT RUN for this revision. Production retains Three.js; the development homepage uses this SVG preview.

## Appearance and checks

Desktop DPR 2 and mobile DPR 1 captures cover 58 phase-boundary poses each. Within projected box silhouettes, dark-pixel comparison against synchronized Three.js frames, allowing one CSS pixel of rasterization tolerance, found zero missing pixels at either size. The largest extra count was zero on desktop and one pixel on mobile. This checks cached box appearance through the turn and phase transitions; it does not establish full-scene equivalence. Belt and gear motion deliberately differ from the original. The complete 839-frame raster comparison is NOT RUN for this revision.

The desktop and mobile conveyor were inspected during travel, and the rejected turn was inspected on desktop. Focused tests cover opposite seam directions without path regeneration, cached box translation, rotation fallback, reverse seeking, resize and DPR invalidation, existing projection and clipping behavior, and playback cleanup.

- Conveyor tests: 18 passed.
- Repository tests: 62 passed.
- Web typecheck and build: passed, with the existing unused `s` hint and production Three.js chunk warning.
- Conveyor lint, formatting, and `git diff --check`: passed.

Raw browser results use `.artifacts/conveyor/loop-translated-performance-svg-{1280,390}.json`. Phase captures use the `loop-translated` prefix. The box comparison, isolated CPU probe, and command logs live in `.artifacts/conveyor/translated-belt/`. Earlier `seams-only.json`, `boxes.json`, and `marks.json` are intermediate geometry variants. Only `isolated-cpu.json` supplies the final CPU figures; `final-controlled.json` overlapped a capture and is excluded.

This checkpoint is based on `082ed52bc9aa7c3664d3280ea905dd76de3b9d1a`, with the renderer changes recorded in the accompanying commit. The earlier visual and performance checkpoints remain historical evidence, not acceptance for this revision.
