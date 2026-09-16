import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { createServer } = await import(
  require.resolve("vite", { paths: [require.resolve("astro")] })
);
const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = new URL("../../../../.artifacts/conveyor/", import.meta.url);
const server = await createServer({
  configFile: false,
  root,
  server: { host: "127.0.0.1", port: 4342, strictPort: true },
  plugins: [
    {
      name: "conveyor-local-evidence",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (
            [
              "/gate-geometry.json",
              "/gate-compiled.json",
              "/loop-compiled.json",
              "/loop-packed.json",
              "/baseline-compiled.json",
            ].includes(req.url)
          ) {
            res.setHeader("Content-Type", "application/json");
            const file =
              req.url === "/baseline-compiled.json"
                ? "optimization/baseline-compiled.json"
                : req.url.slice(1);
            res.end(await readFile(new URL(file, evidence)));
            return;
          }
          if (req.url?.split("?")[0] === "/baseline-gate.js") {
            const source = await readFile(
              new URL("optimization/baseline-gate.js", evidence),
              "utf8",
            );
            res.setHeader("Content-Type", "text/javascript");
            res.end(
              source.replace(
                /from "([.][^"]+)"/g,
                (_, path) =>
                  `from "${new URL(path, "http://localhost/tools/conveyor/gate.js").pathname}"`,
              ),
            );
            return;
          }
          if (!req.url?.startsWith("/evidence/")) return next();
          const name = req.url.slice("/evidence/".length);
          if (
            req.method !== "POST" ||
            !/^[a-zA-Z0-9_-]+\.(png|json|svg)$/.test(name)
          ) {
            res.statusCode = 400;
            res.end("Invalid evidence request");
            return;
          }
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 16 * 1024 * 1024) {
              res.statusCode = 413;
              res.end();
              return;
            }
            chunks.push(chunk);
          }
          await mkdir(evidence, { recursive: true });
          await writeFile(new URL(name, evidence), Buffer.concat(chunks));
          res.end("saved");
        });
      },
    },
  ],
});
await server.listen();
console.log(
  "Conveyor comparison: http://127.0.0.1:4342/tools/conveyor/index.html",
);
