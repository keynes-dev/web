import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

// Capture in placeholder.html first. Only transcode browser PNGs here: librsvg
// rasterizes the conveyor's clipped apertures and gripper differently.
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("astro")] }),
);
for (const height of [224, 256, 416]) {
  for (const ratio of [1, 2]) {
    for (const pose of ["first", "reduced"]) {
      const source = await readFile(
        new URL(
          `../../../../.artifacts/conveyor/placeholder-browser-${pose}-${height}-${ratio}.png`,
          import.meta.url,
        ),
      );
      const image = await sharp(source).webp({ lossless: true }).toBuffer();
      const decoded = await sharp(image).ensureAlpha().raw().toBuffer();
      const original = await sharp(source).ensureAlpha().raw().toBuffer();
      // RGB under fully transparent pixels is immaterial; every painted pixel
      // must survive transcoding unchanged.
      for (let i = 0; i < original.length; i += 4) {
        if (
          original[i + 3] !== decoded[i + 3] ||
          (original[i + 3] &&
            !original.subarray(i, i + 3).equals(decoded.subarray(i, i + 3)))
        )
          throw new Error(
            `Lossless transcode differs: ${pose}, ${height}, DPR ${ratio}`,
          );
      }
      const name = `conveyor-${pose}-${height}-${ratio}x.webp`;
      await writeFile(new URL(`../../public/${name}`, import.meta.url), image);
      console.log(`${name}: ${image.length} bytes`);
    }
  }
}
