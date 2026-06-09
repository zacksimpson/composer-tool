import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist",
    // vite-plugin-singlefile inlines everything; this ensures fonts/images inline too
    assetsInlineLimit: 100_000_000,
  },
});
