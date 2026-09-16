import { createRequire } from "node:module";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { cpus } from "node:os";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("astro")] }),
);
const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const files = await readdir(directory);
const attempt = process.argv[2] ?? "gate";
if (!["gate", "indexed", "loop"].includes(attempt))
  throw new Error("Expected gate, indexed, or loop attempt");
const comparisons = [];
for (const name of files.filter((name) =>
  new RegExp(`^${attempt}-\\d+-\\d+-\\d+-reference\\.png$`).test(name),
)) {
  const candidate = name.replace("reference", "candidate");
  if (!files.includes(candidate)) continue;
  const [a, b] = await Promise.all(
    [name, candidate].map(async (file) =>
      sharp(await readFile(new URL(file, directory)))
        .flatten({ background: "#ffedd5" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
    ),
  );
  if (a.info.width !== b.info.width || a.info.height !== b.info.height)
    throw new Error(`Mismatched dimensions: ${name}`);
  let sum = 0,
    changed = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    let maximum = 0;
    for (let j = 0; j < 3; j++) {
      const delta = Math.abs(a.data[i + j] - b.data[i + j]);
      sum += delta;
      maximum = Math.max(maximum, delta);
    }
    if (maximum > 20) changed++;
  }
  comparisons.push({
    name,
    meanAbsoluteChannelDifference: sum / a.data.length,
    pixelsAbove20: changed,
    pixelCount: a.info.width * a.info.height,
  });
}
const performance = [];
for (const name of files.filter(
  (name) =>
    name.startsWith(`${attempt}-performance-`) && name.endsWith(".json"),
)) {
  const record = JSON.parse(await readFile(new URL(name, directory), "utf8"));
  performance.push({ ...record, intervals: undefined, updates: undefined });
}
const geometry = await readFile(
  new URL(
    attempt === "gate"
      ? "gate-geometry.json"
      : attempt === "loop"
        ? "loop-compiled.json"
        : "gate-compiled.json",
    directory,
  ),
);
const baseline = JSON.parse(
  await readFile(new URL("baseline-build.json", directory), "utf8"),
);
const referenceBundle = baseline.assets.find((asset) =>
  asset.name.startsWith("main."),
);
const regressions = performance
  .filter((record) => record.mode === "svg")
  .map((record) => {
    const reference = performance.find(
      (other) =>
        other.mode === "reference" &&
        other.width === record.width &&
        other.dpr === record.dpr,
    );
    if (!reference)
      throw new Error(
        `Missing matching reference for ${record.width}px at DPR ${record.dpr}`,
      );
    return {
      width: record.width,
      dpr: record.dpr,
      medianCostRatio: record.updateP50 / reference.updateP50,
      p99CostRatio: record.updateP99 / reference.updateP99,
      frameIntervalGate: record.under25ms >= 0.99,
    };
  });
const report = {
  attempt,
  revision: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  cpu: cpus()[0].model,
  generatedAt: new Date().toISOString(),
  gate: regressions.some(
    (record) =>
      record.medianCostRatio > 1 ||
      record.p99CostRatio > 1 ||
      !record.frameIntervalGate,
  )
    ? "FAIL: performance gate; homepage remains unchanged"
    : "UNQUALIFIED: requires complete visual, asset, lifecycle and browser acceptance",
  regressions,
  geometry: { bytes: geometry.length, gzip: gzipSync(geometry).length },
  referenceMainBundle: referenceBundle,
  captures: {
    fullReferenceFrames: files.filter((n) => /^baseline-.*\.png$/.test(n))
      .length,
    pairedGateFrames: comparisons.length,
  },
  performance,
  comparisonNote:
    "Pixel differences include antialiasing and do not establish visual equivalence. Inspect paired frames and overlays.",
  comparisons,
};
await writeFile(
  new URL(`${attempt}-report.json`, directory),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    { ...report, comparisons: `${comparisons.length} frame pairs` },
    null,
    2,
  ),
);
