// @ts-check
import { fileURLToPath } from "node:url";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

function ssrSourceReload() {
  return {
    name: "ssr-source-reload",
    enforce: "post",
    /** @param {{ file: string; server: { ws: { send: (payload: { type: string }) => void } } }} param0 */
    handleHotUpdate({ file, server }) {
      if (!/\.tsx?$/.test(file)) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}

export default defineConfig({
  integrations: [react()],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Sans",
      cssVariable: "--font-ibm-plex-sans",
      styles: ["normal"],
      weights: ["100 700"],
      subsets: ["latin"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      styles: ["normal"],
      weights: [400, 500],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],
  vite: {
    plugins: [tailwindcss(), ssrSourceReload()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
