import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const url = 'http://127.0.0.1:5173/hinario/hino-1-ccb-cristo-meu-mestre';
await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
await page.waitForSelector('h1', { timeout: 15000 });
await page.waitForTimeout(3000);
const title = await page.locator('h1').first().textContent().catch(() => '');
const bodyText = await page.locator('body').innerText();
const screenshot = 'validation-hymn-detail-1440.png';
await page.screenshot({ path: screenshot, fullPage: true });
const forbiddenVisibleBlocks = ['Elias Brandão', 'Escutar ou estudar este hino', 'Ouvir este hino', 'Cifras de Hinos'];
const result = {
  url,
  title: title?.trim() || '',
  hasLightCard: await page.locator('article.bg-gray-200').count() > 0,
  forbiddenVisibleBlocks: forbiddenVisibleBlocks.filter((item) => bodyText.includes(item)),
  hasLyrics: bodyText.length > 0 && bodyText.includes('Cristo'),
  screenshot,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.hasLightCard || result.forbiddenVisibleBlocks.length > 0) process.exit(1);
