import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = 'screenshots';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
});
const page = await ctx.newPage();

const routes = [
  ['http://localhost:3000',                  'home'],
  ['http://localhost:3000/dashboard',        'dashboard'],
  ['http://localhost:3000/courses/race-001', 'race_detail'],
  ['http://localhost:3000/pricing',          'pricing'],
  ['http://localhost:3000/login',            'login'],
  ['http://localhost:3000/register',         'register'],
];

for (const [url, name] of routes) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
  }
}

await browser.close();
