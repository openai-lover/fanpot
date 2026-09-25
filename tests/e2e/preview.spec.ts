import { expect, test } from '@playwright/test';
import deployment from '../../apps/web/data/arc-mainnet-deployment.json';

test('public home explains the project and labels generated campaigns', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Fund fan ideas with clear rules.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Arc Mainnet' })).toBeVisible();
  await expect(page.getByText('AI-GENERATED CONCEPT').first()).toBeVisible();
  await expect(page.getByText('CONCEPT ONLY · NO FUNDING')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
});

test('preview campaign cannot silently take funds', async ({ page }, info) => {
  await page.goto('/c/lumi-birthday-lights-demo');
  await expect(page.getByText('This is a local product preview.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Support this project' })).toBeDisabled();
  await page.getByText('Funds & spending', { exact: true }).click();
  await expect(page.getByText('No deployment or transaction records exist for this preview.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name.startsWith('mobile')) {
    const poster = await page.locator('.detail-grid .poster').boundingBox();
    expect(poster?.width).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) - 40);
  }
});

test('mainnet route does not invent deployment proof', async ({ page }) => {
  await page.goto('/mainnet');
  if (deployment.factory && deployment.campaign) {
    await expect(page.getByRole('heading', { name: 'LUMI birthday screen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Campaign contract' })).toHaveAttribute('href', `https://explorer.arc.io/address/${deployment.campaign}`);
  } else {
    await expect(page.getByRole('heading', { name: 'Mainnet campaign is being prepared' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Support on Mainnet' })).toHaveCount(0);
  }
  await page.goto('/launch');
  await expect(page.getByText('Fictional LUMI birthday screen · 2 USDC goal', { exact: false })).toBeVisible();
  await expect(page.getByText('No ad placement or merchandise is being sold.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing project and keyboard navigation are usable', async ({ page, request }) => {
  await page.goto('/c/nonexistent');
  await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible();
  const health = await request.get('/api/health');
  expect(await health.json()).toMatchObject({ status: 'degraded' });
  expect(health.headers()['cache-control']).toBe('no-store');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});
