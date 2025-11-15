import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      // Par exemple si tu veux des alias
      "@": "/src"
    }
  },

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: "dist",
    target: 'esnext',
    minify: 'esbuild'
  }
});
