import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-hook-form"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
          ],
          charts: ["recharts"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // In development, always proxy to local backend
        // VITE_API_URL is for production builds, not dev proxy
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
