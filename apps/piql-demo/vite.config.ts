import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: [
      {
        find: /^echarts$/,
        replacement: fileURLToPath(
          new URL("./echarts-shim.ts", import.meta.url),
        ),
      },
    ],
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/echarts-solid/")) {
            return "vendor-echarts-solid";
          }
          if (id.includes("/echarts/") || id.includes("/zrender/")) {
            return "vendor-echarts-core";
          }
          if (
            id.includes("/@codemirror/") ||
            id.includes("/codemirror/") ||
            id.includes("/@lezer/")
          ) {
            return "vendor-codemirror";
          }
          if (id.includes("/apache-arrow/")) {
            return "vendor-arrow";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
