// Screenshot a page from the running dev server.
//   node scripts/screenshot.mjs <path> <out.png> [width]
// e.g. node scripts/screenshot.mjs /dev/charts /tmp/charts.png 1100
// Needs `npm run dev` running and Chromium installed
// (`npx playwright install --with-deps chromium`, once per container rebuild).
import { chromium } from 'playwright';

const [path = '/', out = 'screenshot.png', width = '1100'] = process.argv.slice(2);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 800 }, deviceScaleFactor: 1 });
  await page.goto(new URL(path, 'http://localhost:4321').href, { waitUntil: 'networkidle' });
  // Astro's floating dev toolbar would cover content in a full-page shot.
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  await page.screenshot({ path: out, fullPage: true });
  console.log(out);
} finally {
  await browser.close();
}
