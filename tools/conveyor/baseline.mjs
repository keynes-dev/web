import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { gzipSync } from "node:zlib";

const directory = new URL("../../dist/client/_astro/", import.meta.url);
const output = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const assets = [];
for (const name of (await readdir(directory)).filter((name) =>
  name.endsWith(".js"),
)) {
  const contents = await readFile(new URL(name, directory));
  assets.push({
    name,
    bytes: contents.length,
    gzip: gzipSync(contents).length,
  });
}
const record = {
  revision: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0].model,
  node: process.version,
  assets,
};
await mkdir(output, { recursive: true });
await writeFile(
  new URL("baseline-build.json", output),
  JSON.stringify(record, null, 2),
);
console.log(JSON.stringify(record, null, 2));
