import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const { build } = await import(
  require.resolve("esbuild", { paths: [require.resolve("astro")] })
);
const result = await build({
  stdin: {
    contents:
      'export { createConveyor } from "./conveyor.js"; export { unpackGeometry } from "./geometry-codec.js";',
    resolveDir: fileURLToPath(new URL(".", import.meta.url)),
    sourcefile: "conveyor-runtime.js",
  },
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  write: false,
  metafile: true,
});
const directory = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const runtime = result.outputFiles[0].contents;
const geometry = await readFile(new URL("loop-packed.json", directory));
const bytes = (buffer) => ({
  raw: buffer.length,
  gzip: gzipSync(buffer).length,
  sha256: createHash("sha256").update(buffer).digest("hex"),
});
const prior = JSON.parse(
  await readFile(new URL("evidence/baseline-build.json", import.meta.url)),
);
const original = prior.assets.find((a) => a.name.startsWith("main."));
const report = {
  generatedAt: new Date().toISOString(),
  runtime: bytes(runtime),
  geometry: bytes(geometry),
  original,
  combinedGzip: gzipSync(runtime).length + gzipSync(geometry).length,
  scope:
    "Standalone minified runtime and geometry, not the final production delivery. The pre-JavaScript SVG still and homepage integration are not included.",
  inputs: Object.keys(result.metafile.inputs),
};
report.reduction = 1 - report.combinedGzip / original.gzip;
if (
  report.inputs.some(
    (p) => p.includes("node_modules") || p.endsWith("/main.js"),
  )
)
  throw new Error("Unexpected conveyor runtime dependency");
await writeFile(new URL("optimization/runtime.js", directory), runtime);
await writeFile(
  new URL("optimization/transfer.json", directory),
  JSON.stringify(report, null, 2),
);
console.log(report);
