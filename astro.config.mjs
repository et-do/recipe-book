// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    // Listen on all interfaces so the devcontainer's forwarded port works
    // (same as passing --host).
    host: true,
  },
  vite: {
    server: {
      // The workspace is a Windows bind mount; file-change events do not
      // reach the container, so poll instead.
      watch: { usePolling: true },
    },
  },
});
