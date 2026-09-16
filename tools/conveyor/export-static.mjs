import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { unpackGeometry } from "./geometry-codec.js";
import { stationaryGeometry, prepareStaticScene } from "./static-scene.js";
import { CONFIG } from "../../src/components/home/HeroSection/conveyor/config.js";
import { continuousBelt, clipBeltSurface } from "./belt.js";
const directory = new URL(
  "../../src/components/home/HeroSection/conveyor/",
  import.meta.url,
);
const data = unpackGeometry(
  JSON.parse(await readFile(new URL("svg-geometry.json", directory))),
);
const fixed = stationaryGeometry(data);
await mkdir(new URL("static/", directory), { recursive: true });
for (const height of [224, 256, 416])
  for (const ratio of [1, 2]) {
    const depthPixel = (2 * CONFIG.frustum) / (height * ratio);
    const { query } = prepareStaticScene(data, fixed, depthPixel);
    const cache = {
      depthPixel,
      masks: continuousBelt(data.groups).surfaces.map(({ points }) =>
        clipBeltSurface(points, query),
      ),
    };
    const json = JSON.stringify(cache);
    await writeFile(new URL(`static/${height}-${ratio}.json`, directory), json);
    console.log(
      `${height}-${ratio}: ${json.length} bytes, ${gzipSync(json).length} gzip`,
    );
  }
