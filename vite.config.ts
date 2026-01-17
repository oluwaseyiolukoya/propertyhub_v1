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
  optimizeDeps: {
    include: ["html2canvas", "jspdf"],
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
    host: true, // Allow access from network and custom hostnames (e.g., contrezz.local)
    strictPort: false, // Allow port to be changed if 5173 is in use
    proxy: {
      "/api/admin/onboarding": {
        // Admin onboarding lives in main backend on port 5000
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api/admin/verification": {
        // Admin verification lives in main backend on port 5000
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api/admin/email-templates": {
        // Admin email templates live in main backend on port 5000
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api/admin": {
        // Public admin API routes to public-backend on port 5001
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/landing-pages": {
        // Public landing pages API routes to public-backend on port 5001
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/careers": {
        // Public careers API routes to public-backend on port 5001
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/forms": {
        // Public forms API routes to public-backend on port 5001
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
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
