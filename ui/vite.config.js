import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./src/main.jsx",
      output: {
        entryFileNames: "assets/wk-ui.[hash].js",
        chunkFileNames: "assets/wk-ui.[hash].js",
        assetFileNames: "assets/wk-ui.[hash].[ext]",
      },
    },
  },
});
