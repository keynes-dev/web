# Conveyor SVG comparison

The complete 13.950005467999828-second conveyor loop now has an SVG renderer. The comparison page runs it beside the original Three.js renderer with a shared seek time. This work belongs to [KEY-110](https://linear.app/keynes/issue/KEY-110/replace-the-passive-threejs-hero-loop-with-responsive-svgcss-animation).

The complete loop has passed the Chromium visual checkpoint and now has an initial optimization pass. Geometry uses shared templates and a lossless compact encoding; the renderer caches visibility and skips offscreen and unchanged work. See the [optimization measurements](evidence/optimization.md). The performance gate still fails, so production builds retain Three.js. At the user's request, Astro dev mode temporarily uses SVG on the homepage for inspection.

## Inspect on the homepage

Run `pnpm --filter @keynes/web dev` from this checkout. The development homepage loads `svg-preview.js` with the checked-in `svg-geometry.json`; it needs no ignored capture artifacts or comparison server. It keeps the hero's existing framing, background, description, and custom-element lifecycle. The preview exposes `window.conveyor.controls.seek/start/stop` for inspection.

To restore Three.js in development, replace the conditional renderer import in `conveyor/element.js` with `import("./main.js")`. Production builds already select that renderer. To refresh the checked-in artwork after a geometry change, run the full export and compile commands below, then copy `.artifacts/conveyor/loop-packed.json` to `apps/web/src/components/home/HeroSection/conveyor/svg-geometry.json` and format that file.

## Run the comparison

From the repository root:

```sh
node apps/web/tools/conveyor/export-gate.mjs
node apps/web/tools/conveyor/compile-gate.mjs
node apps/web/tools/conveyor/export-loop.mjs
node apps/web/tools/conveyor/compile-gate.mjs --full
node apps/web/tools/conveyor/serve.mjs
```

Open `http://127.0.0.1:4342/tools/conveyor/index.html?full`. Choose Reference, SVG, or Overlay. Loop time seeks both renderers. Play loop uses one clock to repeat the complete cycle. Capture frame saves the current pose; Capture loop saves 839 synchronized pairs at 60 samples per second, including the loop endpoint. Capture phase boundaries also samples immediately before and after phase transitions.

Add `&dpr=1` or `&dpr=2` to force the rendering pixel ratio for comparisons. This controls the original WebGL buffer, line weights, SVG line weights, and exported PNG resolution. It does not emulate a physical device or change the browser's native pixel ratio. Capture metadata records both values. Without this parameter, the page uses the browser's pixel ratio.

Captures and exported geometry live in ignored `.artifacts/conveyor/`, outside the production bundle. The full comparison loads `loop-packed.json`, which the compiler generates alongside the expanded diagnostic geometry. Use `&seams` for this attempt's `loop-translated` capture prefix, keeping earlier `loop-optimized` and `loop-seams` evidence separate. The local comparison server accepts only flat PNG, SVG, and JSON evidence filenames. All SVG geometry is live vector artwork; the captures are verification evidence, not animation assets.

## What is implemented

The renderer uses the existing `config.js`, `math.js`, and `timeline.js`. It includes the belt's upper and return runs, toothed rollers, all bored boxes, arm joints and gripper, opaque ductwork and fittings, glass tubes, iris blades, nozzle pulse, verdict lamp, stacked shapes, dispensing shapes, and falling refill shapes. The exporter retains the original tessellation and local coordinates instead of redrawing approximate artwork.

Small arithmetic helpers replace Three.js transforms at runtime. They preserve orthographic projection, height-based framing, the placement change at 64rem, joint rotations, axis-angle tumbling, quaternion interpolation back to upright, and sphere outlines. The runtime imports no Three.js; the development exporter and reference comparison do.

Both belt runs are continuous solids. Translated seam strips draw their divisions across the visible top and side faces, with the lower run moving in the opposite direction. Fixed clips hide seams behind the belt housing and machine. The original gaps between boards are deliberately removed at the user's request. Roller teeth remain stationary; only their cross marks rotate at the original speed, without dynamic triangle clipping.

Upright and inverted boxes reuse artwork. Away from the machine, each box moves as an SVG group. A conservative overlap check returns boxes near other parts to the depth-clipped renderer, and the rejected turn keeps its detailed geometry. The near-machine path also reuses each box's self-clipped artwork while its orientation stays fixed. See the [translated belt checkpoint](evidence/translated-belt.md) for measurements and verification limits. The earlier [belt optimization checkpoint](evidence/belt-optimization.md) records the superseded slat-pruning attempts.

Persistent SVG paths hold fills and outlines. Clipping uses projected depth rather than average object depth. Glass renders last with the original tint and opacity, clipped against opaque geometry. Fine line visibility accounts for the original material's depth offset at the current height and rendering pixel ratio. At articulated arm and rotating-box intersections, clipping the full stroke preserves the tapered ends produced by the original depth test. Opaque static fills retain their complete triangle coverage; merging their boundaries had introduced transparent gaps and was removed from the full renderer.

`conveyor.js` supplies seek/start/stop and destroy controls around the SVG drawing. Its clock pauses for offscreen and hidden documents, holds the original mid-drop still for reduced motion, and cancels callbacks and listeners on destruction. The comparison controls explicitly seek the renderer so deterministic captures can inspect every pose.

## Verification

The [full-loop visual checkpoint](evidence/visual-acceptance.md) records 2,722 frame comparisons, the inspected differences, checks, and remaining acceptance limits.

```sh
node --test apps/web/tools/conveyor/projection.test.mjs apps/web/tools/conveyor/playback.test.mjs apps/web/tools/conveyor/optimization.test.mjs
pnpm --filter @keynes/web typecheck
pnpm --filter @keynes/web build
pnpm test:repository
pnpm exec oxlint apps/web/tools/conveyor
pnpm exec oxfmt --check apps/web/tools/conveyor
```

Projection and motion tests compare against Three.js across the full cycle at 60 samples per second. They cover the camera at nine widths and two pixel ratios, all articulated and falling transforms, visibility, indexed geometry, depth crossings, coplanar edges, spatial queries, and deterministic playback transitions. Browser captures provide the separate appearance check.

After captures finish:

```sh
node apps/web/tools/conveyor/visual-report.mjs --optimized
node apps/web/tools/conveyor/measure-transfer.mjs
```

The report identifies dark pixels with no counterpart within one CSS pixel and missing opaque interiors. These metrics locate frames for inspection; they do not automatically establish visual equivalence. Source revision and implementation digest accompany the report.

Reference conveyor source is unchanged between `69917d51d3fcd76aa6abee5d3a209357a158515c` and `b6563991a6170f2da547d5f15be39aa66369bb3a`. The latter includes the user's separate social-image and runtime-tab-copy commit. The modified social image was preserved.

## Earlier performance gate

The earlier rejected-box-only attempt failed performance and asset-size acceptance. Its retained [bundle baseline](evidence/baseline-build.json), [measurement report](evidence/gate-report.json), and [desktop comparison](evidence/midturn-1280.png) describe that attempt only. Subsequent indexed geometry reduced its measured desktop update cost, but it still failed the no-regression requirement. These measurements do not qualify the complete renderer.

Further performance work, homepage integration, a server-rendered SVG still, Three.js dependency removal, and an accepted PR remain outstanding. The standalone transfer measurement excludes the pre-JavaScript still. Cross-browser and physical-device qualification must be recorded separately. No Firefox, Safari, physical iOS/Android, dedicated 60 Hz device, or total browser paint/GPU qualification is claimed by the Chromium development captures.

## Reproduce the SVG performance baseline

The frozen SVG implementation is commit `9a47cf2`. Before changing its shared math helpers, save its renderer and the expanded geometry in the ignored evidence directory. Run these commands only when the baseline files do not already exist:

```sh
mkdir -p .artifacts/conveyor/optimization
git show 9a47cf2:apps/web/tools/conveyor/gate.js > .artifacts/conveyor/optimization/baseline-gate.js
cp .artifacts/conveyor/loop-compiled.json .artifacts/conveyor/optimization/baseline-compiled.json
```

Open the comparison with `?full&baseline&dpr=2` for the frozen SVG renderer, or `?full&dpr=2` for the optimized renderer. Select SVG or Reference, then Measure loop. Each measurement runs one warm-up loop and three measured loops, disables controls, and records update time, animation-frame intervals, page long tasks, and document visibility. Avoid other CPU work during measurement. The frozen renderer uses the shared `projection.js` and `strokes.js` helpers, which are unchanged by this optimization pass; changing those would require freezing them as well. Preserve existing baseline files when continuing another optimization pass.
