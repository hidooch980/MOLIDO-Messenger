import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // WebRTC (planned voice/video) already requires a modern browser, and the
  // i18n bootstrap uses a top-level await — no legacy-browser target needed.
  build: { target: "esnext" },
});
