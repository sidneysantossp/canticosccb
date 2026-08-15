import { test, expect } from '@playwright/test';

const baseUrl = process.env.SEO_BASE_URL || 'https://www.canticosccb.com.br';

test('redirect de /hinos entrega a hub CSR com H1', async ({ page }) => {
  await page.goto(`${baseUrl}/hinos`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  await expect(page).toHaveURL(/\/hinos-ccb\/?$/, { timeout: 10000 });
  await expect(page.locator('h1').first()).toContainText(/Hinos/i, { timeout: 15000 });
});
