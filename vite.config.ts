import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      // Par exemple si tu veux des alias
      "@": "/src"
    }
  },
  build: {
    outDir: "dist"
  }
});
