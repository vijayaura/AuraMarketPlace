import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // Temporarily disabled due to NAPI compatibility issues
    // mode === 'development' &&
    // componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
  },
  esbuild: {
    target: 'es2020',
  },
  build: {
    target: 'es2020',
  },
}));
