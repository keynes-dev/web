import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { cpus, release } from "node:os";
import { createGate } from "./gate.js";
import { unpackGeometry } from "./geometry-codec.js";
import { Element, installSvgSink } from "./svg-sink.mjs";
const directory = new URL(
  "../../src/components/home/HeroSection/conveyor/",
  import.meta.url,
);
const data = unpackGeometry(
  JSON.parse(await readFile(new URL("svg-geometry.json", directory))),
);
console.log({ node: process.version, cpu: cpus()[0].model, os: release() });
for (const [width, height, ratio] of [
  [1280, 416, 2],
  [390, 224, 2],
]) {
  const json = await readFile(
    new URL(`static/${height}-${ratio}.json`, directory),
    "utf8",
  );
  const results = { runtime: [], precomputed: [] };
  for (let run = 0; run < 4; run++)
    for (const mode of Object.keys(results)) {
      installSvgSink();
      globalThis.devicePixelRatio = ratio;
      const host = new Element();
      host.clientWidth = width;
      host.clientHeight = height;
      const start = performance.now();
      const staticCache = mode === "precomputed" ? JSON.parse(json) : undefined;
      const gate = createGate(host, data, {
        place: { x: width >= 1024 ? 0.46 : 0.12 },
        staticCache,
      });
      const elapsed = performance.now() - start;
      if (run) results[mode].push(Math.round(elapsed));
      gate.destroy();
    }
  console.log({
    width,
    height,
    ratio,
    gzipBytes: gzipSync(json).length,
    runsMs: results,
  });
}
