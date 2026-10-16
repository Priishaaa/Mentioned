import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The API runs separately in development (npm run dev at the repo root starts both).
    proxy: { "/api": "http://localhost:8787" },
  },
});
