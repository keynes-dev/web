# Conveyor SVG animation

The homepage conveyor is an inline SVG animation with no rendering dependency. The checked-in geometry, responsive static masks, and placeholders are production assets.

`conveyor.js` creates the SVG and exposes deterministic `seek`, `start`, `stop`, and `destroy` controls. `playback.js` owns the animation clock, visibility pausing, reduced-motion behavior, and cleanup. The remaining modules project and draw the belt, boxes, arm, machine, glass, and stationary strokes.

The custom element loads `src/components/home/HeroSection/conveyor/main.js`, which unpacks `svg-geometry.json` and selects the closest precomputed mask for the rendered height and device pixel ratio. Unlisted sizes and later resizes calculate clipping at runtime.

## Generated assets

Regenerate responsive belt masks after changing geometry or projection math:

```sh
node tools/conveyor/export-static.mjs
```

The homepage displays responsive WebP placeholders before JavaScript initializes and for reduced motion. To regenerate them, start the local capture server, open the placeholder page, export the captures, then transcode them:

```sh
node tools/conveyor/serve.mjs
node tools/conveyor/export-placeholder.mjs
```

The capture page is `http://127.0.0.1:4342/tools/conveyor/placeholder.html`. Raw captures remain in the ignored `.artifacts/conveyor` directory.

## Verification

```sh
node --test \\
  tools/conveyor/geometry-reuse.test.mjs \\
  tools/conveyor/playback.test.mjs \\
  tools/conveyor/startup.test.mjs \\
  tools/conveyor/static-scene.test.mjs \\
  tools/conveyor/stationary-strokes.test.mjs
pnpm typecheck
pnpm build
```
