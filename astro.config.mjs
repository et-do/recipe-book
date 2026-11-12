// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://recipes.ethan-domokos.ca',
  // Two content files with the same slug (or two pages with the same route)
  // fail the build instead of one silently winning.
  prerenderConflictBehavior: 'error',
  integrations: [
    {
      // Dev-only pages (fixture previews); never part of the built site.
      name: 'dev-pages',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'dev') {
            injectRoute({ pattern: '/dev/charts', entrypoint: './src/dev/charts.astro' });
          }
        },
      },
    },
  ],
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
