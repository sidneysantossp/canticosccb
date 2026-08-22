import { chromium, devices } from '@playwright/test';

const url = 'https://www.canticosccb.com.br/cifras?responsive_check=1';
const targets = [
  { name: 'mobile-390', device: devices['iPhone 12'] },
  { name: 'mobile-375', device: devices['iPhone SE'] },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 }, isMobile: true },
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 } },
];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const target of targets) {
  const context = await browser.newContext(target.device ?? target);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    const body = document.body;
    const doc = document.documentElement;
    const firstCard = document.querySelector('a[aria-label^="Abrir cifra"], a[href^="/cifra/"]')?.closest('[class*="rounded"], article, li, div');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: doc.scrollWidth,
      bodyWidth: body.scrollWidth,
      horizontalOverflow: doc.scrollWidth > window.innerWidth + 1,
      title: document.querySelector('h1')?.textContent?.trim() ?? null,
      hero: rect('section'),
      heroImage: rect('section img'),
      search: rect('input[placeholder*="Buscar cifra"]'),
      instrumentFilter: rect('select'),
      firstCard: firstCard ? (() => { const r = firstCard.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) }; })() : null,
      bodyBackground: getComputedStyle(body).backgroundColor,
    };
  });
  await page.screenshot({ path: `/tmp/cifras-${target.name}.png`, fullPage: false });
  results.push({ name: target.name, ...result });
  await context.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
