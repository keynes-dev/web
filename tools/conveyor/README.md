# Conveyor SVG animation

The homepage conveyor is an inline SVG animation with no rendering dependency. The checked-in geometry, responsive static masks, and placeholders are production assets.

`conveyor.js` creates the SVG and exposes deterministic `seek`, `start`, `stop`, and `destroy` controls. `playback.js` owns the animation clock, visibility pausing, reduced-motion behavior, and cleanup. The remaining modules project and draw the belt, boxes, arm, machine, glass, and stationary strokes.

The custom element loads `src/components/home/HeroSection/conveyor/main.js`, which unpacks `svg-geometry.json` and selects the closest precomputed mask for the rendered height and device pixel ratio. Unlisted sizes and later resizes calculate clipping at runtime.

## Generated assets

Regenerate responsive belt masks after changing geometry or projection math:

```sh
node apps/web/tools/conveyor/export-static.mjs
```

The homepage displays responsive WebP placeholders before JavaScript initializes and for reduced motion. To regenerate them, start the local capture server, open the placeholder page, export the captures, then transcode them:

```sh
node apps/web/tools/conveyor/serve.mjs
node apps/web/tools/conveyor/export-placeholder.mjs
```

The capture page is `http://127.0.0.1:4342/tools/conveyor/placeholder.html`. Raw captures remain in the ignored `.artifacts/conveyor` directory.

## Verification

```sh
node --test \\
  apps/web/tools/conveyor/geometry-reuse.test.mjs \\
  apps/web/tools/conveyor/playback.test.mjs \\
  apps/web/tools/conveyor/startup.test.mjs \\
  apps/web/tools/conveyor/static-scene.test.mjs \\
  apps/web/tools/conveyor/stationary-strokes.test.mjs
pnpm --filter @keynes/web typecheck
pnpm --filter @keynes/web build
```
