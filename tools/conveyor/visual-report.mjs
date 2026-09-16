import { createRequire } from "node:module";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpus } from "node:os";

const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("astro")] }),
);
const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const names = await readdir(directory);
const records = [];
const attempt = process.argv.includes("--optimized")
  ? "loop-optimized"
  : "loop";
const captures = names.filter((name) =>
  new RegExp(`^${attempt}-capture-(cycle|phase-)-\\d+-[12]\\.json$`).test(name),
);
const decode = async (name) =>
  sharp(await readFile(new URL(name, directory)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

for (const manifest of captures) {
  const metadata = JSON.parse(
    await readFile(new URL(manifest, directory), "utf8"),
  );
  const prefix = manifest.includes("phase-") ? "phase-" : "";
  // These two captures span the full cycle; the others sample phase boundaries.
  if (
    !prefix &&
    !(metadata.width === 1280 && metadata.dpr === 2) &&
    !(metadata.width === 390 && metadata.dpr === 1)
  )
    continue;
  const comparisons = [];
  for (let frame = 0; frame < metadata.times.length; frame++) {
    const stem = `${attempt}-${metadata.width}-${metadata.dpr}-${prefix}${String(frame).padStart(3, "0")}`;
    const [reference, candidate] = await Promise.all([
      decode(`${stem}-reference.png`),
      decode(`${stem}-candidate.png`),
    ]);
    const { width, height } = reference.info;
    if (candidate.info.width !== width || candidate.info.height !== height)
      throw new Error(`Dimensions differ: ${stem}`);
    const a = reference.data,
      b = candidate.data;
    const dark = (data) => {
      const mask = new Uint8Array(width * height);
      for (let i = 0; i < mask.length; i++)
        mask[i] =
          (((254 - data[i * 4]) * 0.2126 +
            (239 - data[i * 4 + 1]) * 0.7152 +
            (217 - data[i * 4 + 2]) * 0.0722) *
            data[i * 4 + 3]) /
            255 >
          35
            ? 1
            : 0;
      return mask;
    };
    const ma = dark(a),
      mb = dark(b),
      radius = metadata.dpr;
    const near = (mask, x, y) => {
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (
            nx >= 0 &&
            nx < width &&
            ny >= 0 &&
            ny < height &&
            mask[ny * width + nx]
          )
            return true;
        }
      return false;
    };
    let missingInk = 0,
      extraInk = 0,
      referenceInk = 0,
      candidateInk = 0,
      channelDifference = 0;
    let missingInterior = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x,
          offset = i * 4;
        if (ma[i]) {
          referenceInk++;
          if (!near(mb, x, y)) missingInk++;
        }
        if (mb[i]) {
          candidateInk++;
          if (!near(ma, x, y)) extraInk++;
        }
        for (let channel = 0; channel < 4; channel++)
          channelDifference += Math.abs(
            a[offset + channel] - b[offset + channel],
          );
        if (
          a[offset + 3] === 255 &&
          b[offset + 3] < 128 &&
          x > radius &&
          y > radius &&
          x < width - radius &&
          y < height - radius
        ) {
          let interior = true;
          for (let dy = -radius; dy <= radius && interior; dy++)
            for (let dx = -radius; dx <= radius; dx++)
              if (a[((y + dy) * width + x + dx) * 4 + 3] < 250) {
                interior = false;
                break;
              }
          if (interior) missingInterior++;
        }
      }
    comparisons.push({
      frame,
      time: metadata.times[frame],
      stem,
      referenceInk,
      candidateInk,
      missingInk,
      extraInk,
      missingInterior,
      meanChannelDifference: channelDifference / a.length,
    });
  }
  records.push({ metadata, prefix, frames: comparisons.length, comparisons });
  console.log(
    `${metadata.width}px DPR ${metadata.dpr} ${prefix || "cycle"}: ${comparisons.length} pairs`,
  );
}
const sourceFiles = [
  "gate.js",
  "projection.js",
  "playback.js",
  "conveyor.js",
  "study.js",
  "compile-gate.mjs",
  "export-loop.mjs",
  "strokes.js",
  "geometry-codec.js",
];
const digest = createHash("sha256");
for (const file of sourceFiles)
  digest.update(file).update(await readFile(new URL(file, import.meta.url)));
const report = {
  cpu: cpus()[0].model,
  geometrySha256: createHash("sha256")
    .update(
      await readFile(
        new URL(
          attempt === "loop" ? "loop-compiled.json" : "loop-packed.json",
          directory,
        ),
      ),
    )
    .digest("hex"),
  referenceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  implementationSha256: digest.digest("hex"),
  generatedAt: new Date().toISOString(),
  scope:
    "Chromium visual comparisons. Production replacement is not accepted by this report.",
  interpretation:
    "Ink mismatches have no matching visible stroke pixel within one CSS pixel. A stroke pixel has at least 35 levels of luminance contrast against the comparison background after alpha compositing; this includes subpixel hairlines at DPR 1. This identifies inspection candidates; it is not an automatic visual-fidelity verdict. Missing interior counts opaque reference pixels with no candidate fill away from reference boundaries.",
  records,
};
await writeFile(
  new URL(`${attempt}-visual-report.json`, directory),
  JSON.stringify(report, null, 2),
);
for (const record of records)
  console.log({
    width: record.metadata.width,
    dpr: record.metadata.dpr,
    prefix: record.prefix,
    worst: [...record.comparisons]
      .sort((a, b) => b.missingInk + b.extraInk - (a.missingInk + a.extraInk))
      .slice(0, 3),
    missingInterior: Math.max(
      ...record.comparisons.map((c) => c.missingInterior),
    ),
  });
