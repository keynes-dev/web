import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { createServer } = await import(
  require.resolve("vite", { paths: [require.resolve("astro")] })
);
const root = fileURLToPath(new URL("../../", import.meta.url));
const evidence = new URL("../../.artifacts/conveyor/", import.meta.url);
const port = Number(process.env.CONVEYOR_PORT ?? 4342);
const server = await createServer({
  configFile: false,
  root,
  cacheDir: fileURLToPath(new URL(`vite-${port}/`, evidence)),
  server: { host: "127.0.0.1", port, strictPort: true },
  plugins: [
    {
      name: "conveyor-local-evidence",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
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
  `Conveyor placeholder tools: http://127.0.0.1:${port}/tools/conveyor/placeholder.html`,
);
