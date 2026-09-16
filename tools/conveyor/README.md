# Conveyor SVG comparison

The complete 13.950005467999828-second conveyor loop now has an SVG renderer. The comparison page runs it beside the original Three.js renderer with a shared seek time. This work belongs to [KEY-110](https://linear.app/keynes/issue/KEY-110/replace-the-passive-threejs-hero-loop-with-responsive-svgcss-animation).

The current task is visual fidelity. Optimization and homepage replacement are deferred at the user's request. The production homepage and its Three.js dependencies remain unchanged. The full SVG renderer is a development implementation, not an accepted production replacement.

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

Captures and exported geometry live in ignored `.artifacts/conveyor/`, outside the production bundle. The local comparison server accepts only flat PNG, SVG, and JSON evidence filenames. All SVG geometry is live vector artwork; the captures are verification evidence, not animation assets.

## What is implemented

The renderer uses the existing `config.js`, `math.js`, and `timeline.js`. It includes the belt's upper and return runs, toothed rollers, all bored boxes, arm joints and gripper, opaque ductwork and fittings, glass tubes, iris blades, nozzle pulse, verdict lamp, stacked shapes, dispensing shapes, and falling refill shapes. The exporter retains the original tessellation and local coordinates instead of redrawing approximate artwork.

Small arithmetic helpers replace Three.js transforms at runtime. They preserve orthographic projection, height-based framing, the placement change at 64rem, joint rotations, axis-angle tumbling, quaternion interpolation back to upright, and sphere outlines. The runtime imports no Three.js; the development exporter and reference comparison do.

Persistent SVG paths hold fills and outlines. Clipping uses projected depth rather than average object depth. Glass renders last with the original tint and opacity, clipped against opaque geometry. Fine line visibility accounts for the original material's depth offset at the current height and rendering pixel ratio. At articulated arm and rotating-box intersections, clipping the full stroke preserves the tapered ends produced by the original depth test. Opaque static fills retain their complete triangle coverage; merging their boundaries had introduced transparent gaps and was removed from the full renderer.

`conveyor.js` supplies seek/start/stop and destroy controls around the SVG drawing. Its clock pauses for offscreen and hidden documents, holds the original mid-drop still for reduced motion, and cancels callbacks and listeners on destruction. The comparison controls explicitly seek the renderer so deterministic captures can inspect every pose.

## Verification

The [full-loop visual checkpoint](evidence/visual-acceptance.md) records 2,722 frame comparisons, the inspected differences, checks, and remaining acceptance limits.

```sh
node --test apps/web/tools/conveyor/projection.test.mjs apps/web/tools/conveyor/playback.test.mjs
pnpm --filter @keynes/web typecheck
pnpm --filter @keynes/web build
pnpm test:repository
pnpm exec oxlint apps/web/tools/conveyor
pnpm exec oxfmt --check apps/web/tools/conveyor
```

Projection and motion tests compare against Three.js across the full cycle at 60 samples per second. They cover the camera at nine widths and two pixel ratios, all articulated and falling transforms, visibility, indexed geometry, depth crossings, coplanar edges, spatial queries, and deterministic playback transitions. Browser captures provide the separate appearance check.

After captures finish:

```sh
node apps/web/tools/conveyor/visual-report.mjs
```

The report identifies dark pixels with no counterpart within one CSS pixel and missing opaque interiors. These metrics locate frames for inspection; they do not automatically establish visual equivalence. Source revision and implementation digest accompany the report.

Reference conveyor source is unchanged between `69917d51d3fcd76aa6abee5d3a209357a158515c` and `b6563991a6170f2da547d5f15be39aa66369bb3a`. The latter includes the user's separate social-image and runtime-tab-copy commit. The modified social image was preserved.

## Earlier performance gate

The earlier rejected-box-only attempt failed performance and asset-size acceptance. Its retained [bundle baseline](evidence/baseline-build.json), [measurement report](evidence/gate-report.json), and [desktop comparison](evidence/midturn-1280.png) describe that attempt only. Subsequent indexed geometry reduced its measured desktop update cost, but it still failed the no-regression requirement. These measurements do not qualify the complete renderer.

Performance tuning, production asset compression, homepage integration, a server-rendered SVG still, Three.js dependency removal, and an accepted PR remain outstanding. Cross-browser and physical-device qualification must be recorded separately. No Firefox, Safari, physical iOS/Android, dedicated 60 Hz device, or total browser paint/GPU qualification is claimed by the Chromium development captures.
