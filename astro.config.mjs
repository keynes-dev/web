// @ts-check
import { fileURLToPath } from "node:url";

import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://keynes.dev",
  integrations: [icon({ iconDir: "src/assets" })],

  env: {
    schema: {
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },

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
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },

  adapter: cloudflare(),
});
