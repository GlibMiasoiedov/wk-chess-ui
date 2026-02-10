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
        format: 'iife',
        name: 'WKChessUIApp',
        inlineDynamicImports: true,
        entryFileNames: "assets/wk-ui.[hash].js",
        chunkFileNames: "assets/wk-ui.[hash].js",
        assetFileNames: "assets/wk-ui.[hash].[ext]",
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'wp': 'wp',
          '@wordpress/i18n': 'wp.i18n',
          '@wordpress/element': 'wp.element'
        }
      },
      external: [
        'jquery',
        'react',
        'react-dom',
        'wp',
        '@wordpress/i18n',
        '@wordpress/element'
      ],
    },
  },
});
