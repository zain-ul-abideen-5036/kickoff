/**
 * Takes full-page screenshots of a running app for visual checks and the README.
 * Usage: node scripts/shot.mjs <baseUrl> <outDir> <path>[@<width>][:dark] ...
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const [base, out, ...targets] = process.argv.slice(2);
if (!base || !out || targets.length === 0) {
  console.error('Usage: node scripts/shot.mjs <baseUrl> <outDir> <path>[@width][:dark] ...');
  process.exit(1);
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch();

// Optional sign-in, so workspace pages can be captured: SHOT_EMAIL and SHOT_PASSWORD.
let storageState;
if (process.env.SHOT_EMAIL && process.env.SHOT_PASSWORD) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${base}/login`);
  await page.getByLabel('Email').fill(process.env.SHOT_EMAIL);
  await page.getByLabel('Password').fill(process.env.SHOT_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/briefs');
  storageState = await ctx.storageState();
  await ctx.close();
}

for (const t of targets) {
  const dark = t.endsWith(':dark');
  const [path, w] = t.replace(/:dark$/, '').split('@');
  const width = Number(w || 1440);
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: dark ? 'dark' : 'light',
    storageState,
  });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const name = `${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}-${width}${dark ? '-dark' : ''}.png`;
  await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.info(`${name}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}`);
  await ctx.close();
}
await browser.close();
