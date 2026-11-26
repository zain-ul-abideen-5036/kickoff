/**
 * Walks the first-run flow against a running app with an empty store:
 * setup → lands on briefs → sign out → wrong password is refused → sign in works.
 * Usage: node scripts/smoke-auth.mjs <baseUrl>
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const browser = await chromium.launch();
const page = await browser.newPage();
const step = (s) => console.info(`✓ ${s}`);

await page.goto(`${base}/briefs`);
await page.waitForURL('**/setup');
step('signed-out visit to /briefs goes to setup');

await page.getByLabel('Password').fill('short');
await page.getByRole('button', { name: 'Create studio' }).click();
await page.getByText('Use at least 10 characters.').waitFor();
step('weak password is explained');

await page.getByLabel('Your name').fill('Amira Clarke');
await page.getByLabel('Email').fill('amira@studionorth.co.uk');
await page.getByLabel('Password').fill('a sensible passphrase');
await page.getByRole('button', { name: 'Create studio' }).click();
await page.waitForURL('**/briefs');
step('setup signs the owner in');

await page.getByRole('button', { name: 'Sign out' }).click();
await page.waitForURL('**/login');
step('sign out returns to login');

await page.getByLabel('Email').fill('amira@studionorth.co.uk');
await page.getByLabel('Password').fill('not the password');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByText('don’t match').waitFor();
step('wrong password is refused');

await page.getByLabel('Password').fill('a sensible passphrase');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/briefs');
step('correct password signs in');

await browser.close();
