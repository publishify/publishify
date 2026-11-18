import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    proxy: { "/api": "http://localhost:8787", "/k": "http://localhost:8787" },
  },
  build: { target: "es2022", outDir: "dist", emptyOutDir: true },
});
