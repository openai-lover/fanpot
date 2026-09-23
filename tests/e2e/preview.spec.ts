import { expect, test } from '@playwright/test';
test('browse without login, preview honestly, never request funds', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little love. A shared celebration.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our first projects are on their way' })).toBeVisible();
  await expect(page.getByText('Connect Wallet', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Preview a project' }).click();
  await expect(page.getByText('This is a local product preview.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Support this project' })).toBeDisabled();
  await page.getByText('Funds & spending', { exact: true }).click();
  await expect(page.getByText('No deployment or transaction records exist for this preview.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  if (info.project.name.startsWith('mobile')) {
    const poster = await page.locator('.detail-grid .poster').boundingBox();
    expect(poster?.width).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) - 40);
  }
  await page.screenshot({ path: `test-results/${info.project.name}-detail.png`, fullPage: true });
});
test('language switches, persists and updates document language', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '한국어로 변경' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { name: '첫 프로젝트를 준비하고 있어요' })).toBeVisible();
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await page.getByRole('link', { name: '프로젝트 미리보기' }).click();
  await expect(page.getByRole('heading', { name: '서울에서 함께 빛나는 생일' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('no invented proof or zero balances when data is unavailable', async ({ page, request }) => {
  await page.goto('/proof'); await expect(page.getByText('Not deployed.', { exact: false })).toBeVisible();
  await page.goto('/c/nonexistent'); await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible();
  const health = await request.get('/api/health'); expect(await health.json()).toMatchObject({ status: 'degraded' });
  expect(health.headers()['cache-control']).toBe('no-store');
});
test('keyboard skip link and responsive screenshot', async ({ page }, info) => {
  await page.goto('/');
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});
