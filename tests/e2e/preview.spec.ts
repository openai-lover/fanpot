import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const deployment = JSON.parse(readFileSync('apps/web/data/arc-mainnet-deployment.json', 'utf8')) as { factory: string | null; campaign: string | null; transactions: Record<string, string> };

test('public home explains the project and labels generated campaigns', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Made of fan love.' })).toBeVisible();
  await expect(page.getByText('Claims require a separate transaction.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Funds & spending' })).toBeVisible();
  await expect(page.locator('.campaign-disclosure')).toContainText('AI-generated imagery');
  await expect(page.locator('.campaign-teaser-image').getByText('Testnet', { exact: true })).toHaveCount(4);
  await expect(page.locator('header')).not.toContainText(/Development preview|Testnet demo|prototype/i);
  await expect(page.locator('footer')).not.toContainText(/Development preview|Testnet demo|prototype/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
});

test('billboard preserves its shape, lands continuously and rewinds', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const stage = page.locator('.story-stage');
  const board = page.locator('.story-board');
  const image = board.locator('img');
  await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const source = await image.getAttribute('src');
  const track = page.locator('.story-track');
  const geometry = await track.evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, height: el.clientHeight }));
  const scrub = async (p: number) => {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), geometry.top + (geometry.height - page.viewportSize()!.height) * p);
    await expect.poll(async () => Math.abs(Number(await stage.getAttribute('data-progress')) - p)).toBeLessThan(.001);
  };
  const uniformScale = async () => {
    const axes = await board.evaluate(el => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return [Math.hypot(m.m11,m.m12,m.m13), Math.hypot(m.m21,m.m22,m.m23), Math.hypot(m.m31,m.m32,m.m33)];
    });
    expect(Math.max(...axes) - Math.min(...axes)).toBeLessThan(.0001);
  };
  await scrub(0);
  const initial = await board.boundingBox();
  const intro = await page.locator('.story-intro').boundingBox();
  expect(initial!.y).toBeGreaterThan(intro!.y + intro!.height);
  await uniformScale();
  await page.screenshot({ path: `test-results/${info.project.name}-story-start.png` });
  await scrub(.48);
  await expect(stage).toHaveAttribute('data-scene', 'together');
  await uniformScale();
  const before = await board.boundingBox();
  await scrub(.49);
  const after = await board.boundingBox();
  expect(Math.abs(after!.width - before!.width)).toBeLessThan(8);
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(8);
  await page.screenshot({ path: `test-results/${info.project.name}-story-middle.png` });
  await scrub(.97);
  await uniformScale();
  await expect(stage).toHaveAttribute('data-scene', 'city');
  await expect(page.locator('.story-finish')).toHaveCSS('opacity', '1');
  await expect(board).toBeVisible();
  await expect(image).toHaveAttribute('src', source!);
  const alignment = await page.evaluate(() => {
    const a = document.querySelector('.story-board')!.getBoundingClientRect();
    const b = document.querySelector(innerWidth <= 700 ? '.story-city-mobile .story-mount-target' : '.story-city-desktop .story-mount-target')!.getBoundingClientRect();
    return Math.max(Math.abs(a.left-b.left),Math.abs(a.top-b.top),Math.abs(a.width-b.width),Math.abs(a.height-b.height));
  });
  expect(alignment).toBeLessThan(2);
  const end = await board.boundingBox();
  expect(end!.width).toBeGreaterThan(initial!.width);
  await page.screenshot({ path: `test-results/${info.project.name}-story-finish.png` });
  await scrub(0);
  const rewound = await board.boundingBox();
  expect(Math.abs(rewound!.width-initial!.width)).toBeLessThan(2);
  expect(Math.abs(rewound!.x-initial!.x)).toBeLessThan(2);
  await expect(page.locator('.story-city')).toHaveCSS('opacity','0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('preview campaign cannot silently take funds', async ({ page }, info) => {
  await page.goto('/c/lumi-birthday-lights-demo');
  await expect(page.getByText('Funding is not open for this campaign.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Support this project' })).toBeDisabled();
  await page.locator('#funds summary').click();
  await expect(page.getByText('No contract or transaction records exist for this campaign.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name.startsWith('mobile')) {
    const poster = await page.locator('.detail-grid .poster').boundingBox();
    expect(poster?.width).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) - 40);
  }
});

test('mainnet route does not invent deployment proof', async ({ page }, info) => {
  await page.goto('/mainnet');
  if (deployment.factory && deployment.campaign) {
    await expect(page.getByRole('heading', { name: 'LUMI birthday screen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Campaign contract' })).toHaveAttribute('href', `https://explorer.arc.io/address/${deployment.campaign}`);
    await expect(page.getByText('Fictional campaign. No ad placement is booked.')).toBeVisible();
    await expect(page.getByText('Real USDC on Arc Mainnet. Network fees apply.')).toBeVisible();
    await expect(page.locator('#activity')).not.toHaveAttribute('open');
    await page.screenshot({ path: `test-results/${info.project.name}-campaign.png`, fullPage: true });
    await page.getByText('Transaction history', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Contribution received View receipt' })).toHaveAttribute('href', `https://explorer.arc.io/tx/${deployment.transactions['contribute-campaign']}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } else {
    await expect(page.getByRole('heading', { name: 'Campaign temporarily unavailable' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contribute' })).toHaveCount(0);
  }
  await page.goto('/launch');
  await expect(page.getByText('Fictional LUMI birthday screen · 2 USDC goal', { exact: false })).toBeVisible();
  await expect(page.getByText('No ad placement or merchandise is being sold.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transactions temporarily paused' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect MetaMask' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Allow organizer' })).toBeEnabled();
  if (deployment.transactions['activate-campaign']) {
    await expect(page.getByRole('button', { name: 'Campaign already activated' })).toBeDisabled();
  }
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
