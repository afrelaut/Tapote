import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    // .claude/worktrees contient des copies complètes du dépôt sur d'anciennes
    // branches, sans node_modules propre : sans cette exclusion, vitest y
    // relance des suites périmées qui échouent sur des dépendances mal résolues.
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/worktrees/**", "livrables/**"],
  },
});
