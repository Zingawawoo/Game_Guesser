// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:9000", // or whatever port your Go server uses
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
