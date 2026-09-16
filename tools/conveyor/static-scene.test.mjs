import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { unpackGeometry } from "./geometry-codec.js";
import { stationaryGeometry, prepareStaticScene } from "./static-scene.js";
import { createGate } from "./gate.js";
import { Element, installSvgSink } from "./svg-sink.mjs";
import { continuousBelt, clipBeltSurface } from "./belt.js";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";
const directory = new URL(
  "../../src/components/home/HeroSection/conveyor/",
  import.meta.url,
);
const data = unpackGeometry(
  JSON.parse(await readFile(new URL("svg-geometry.json", directory))),
);
const fixed = stationaryGeometry(data);
function snapshot(node) {
  const ids = new Map();
  const visit = (node) => [[...node.attributes], node.children.map(visit)];
  return JSON.stringify(visit(node)).replace(
    /conveyor-(?:seams|marks)-\d+/g,
    (id) => {
      if (!ids.has(id)) ids.set(id, `clip-${ids.size}`);
      return ids.get(id);
    },
  );
}

for (const height of [224, 256, 416])
  for (const ratio of [1, 2]) {
    test(`generated static clipping matches runtime at ${height}px DPR ${ratio}`, async () => {
      const cached = JSON.parse(
        await readFile(new URL(`static/${height}-${ratio}.json`, directory)),
      );
      const depth = (2 * CONFIG.frustum) / (height * ratio);
      const { query } = prepareStaticScene(data, fixed, depth);
      assert.deepEqual(cached, {
        depthPixel: depth,
        masks: continuousBelt(data.groups).surfaces.map(({ points }) =>
          clipBeltSurface(points, query),
        ),
      });
      const make = (staticCache) => {
        installSvgSink();
        globalThis.devicePixelRatio = ratio;
        const host = new Element();
        host.clientWidth = height * 3;
        host.clientHeight = height;
        return createGate(host, data, { place: { x: 0.46 }, staticCache });
      };
      const runtime = make(undefined),
        baked = make(cached);
      for (const time of [0, 3.85, 7.6, 9, data.loop - 0.001]) {
        runtime.draw(time);
        baked.draw(time);
        assert.deepEqual(snapshot(baked.svg), snapshot(runtime.svg));
      }
      runtime.destroy();
      baked.destroy();
      if (height === 224 && ratio === 1) {
        const fallback = make({ ...cached, depthPixel: depth * 0.9 });
        const reference = make(undefined);
        assert.equal(snapshot(fallback.svg), snapshot(reference.svg));
        fallback.destroy();
        reference.destroy();
      }
    });
  }
