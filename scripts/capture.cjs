// Capture screens for review and the README. Usage: node scripts/capture.cjs <base-url> <out-dir> [playwright-module-path]
const path = require('node:path');
const pw = require(process.argv[4] || 'playwright');
const base = process.argv[2];
const out = process.argv[3];
const shots = [
  { name: 'today', hash: '#/today', w: 1440, h: 1000 },
  { name: 'today-fax', hash: '#/today', w: 1440, h: 1000, click: 'Dana Baptiste' },
  { name: 'today-short', hash: '#/today', w: 1440, h: 1000, short: true },
  { name: 'why', hash: '#/why', w: 1440, h: 1000 },
  { name: 'plans', hash: '#/plans', w: 1440, h: 1000 },
  { name: 'pilot', hash: '#/pilot', w: 1440, h: 1000 },
  { name: 'phone-today', hash: '#/today', w: 390, h: 844 },
  { name: 'phone-detail', hash: '#/today', w: 390, h: 844, click: 'Dana Baptiste' },
];
(async () => {
  const browser = await pw.chromium.launch();
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    await page.goto(base + s.hash);
    await page.waitForSelector('main');
    await page.waitForTimeout(300);
    if (s.short) await page.getByRole('radio', { name: 'Short-staffed' }).click();
    if (s.click) await page.getByText(s.click, { exact: true }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, `${s.name}.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const small = await page.evaluate(() => [...document.querySelectorAll('button, a, input, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 && getComputedStyle(e).display !== 'inline'; }).map((e) => (e.textContent || e.tagName).trim().slice(0, 30)));
    console.log(s.name, 'overflow', overflow, 'small targets', small.length ? small.join(' | ') : 'none');
    await page.close();
  }
  await browser.close();
})();
