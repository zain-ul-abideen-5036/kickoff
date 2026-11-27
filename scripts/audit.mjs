/**
 * Accessibility and responsive audit against a running app.
 *
 * For every path: runs axe (WCAG 2.0–2.2 A and AA) in light and dark themes, and checks that
 * nothing scrolls horizontally at 360, 768, 1024, 1280 and 1440 pixels wide.
 *
 * Usage: node scripts/audit.mjs <baseUrl> <path> [<path> ...]
 * Optional: SHOT_EMAIL and SHOT_PASSWORD to audit signed-in workspace pages.
 * Exits non-zero if anything fails.
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error('Usage: node scripts/audit.mjs <baseUrl> <path> [...]');
  process.exit(1);
}
const WIDTHS = [360, 768, 1024, 1280, 1440];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const browser = await chromium.launch();
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

let failures = 0;
for (const path of paths) {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: scheme,
      storageState,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const v of result.violations) {
      failures++;
      console.error(`✗ ${path} [${scheme}] ${v.id} (${v.impact}): ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) console.error(`    ${n.target.join(' ')}`);
    }
    if (result.violations.length === 0) console.info(`✓ ${path} [${scheme}] axe: no violations`);
    await ctx.close();
  }
  const overflow = [];
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, storageState });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (extra > 0) overflow.push(`${width}px (+${extra})`);
    await ctx.close();
  }
  if (overflow.length) {
    failures++;
    console.error(`✗ ${path} horizontal scroll at ${overflow.join(', ')}`);
  } else console.info(`✓ ${path} no horizontal scroll at ${WIDTHS.join(', ')}`);
}
await browser.close();
if (failures) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.info('\nAll checks passed.');
