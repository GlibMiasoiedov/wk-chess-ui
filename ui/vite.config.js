import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "react-chessboard": path.resolve(__dirname, "./src/lib/react-chessboard"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
      external: ['jquery'],
    },
  },
});
