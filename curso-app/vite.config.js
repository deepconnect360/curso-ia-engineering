import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" hace que el build use rutas relativas, necesario para embeber
// los archivos dentro de una subcarpeta de WordPress.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets"
  }
});
