import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true,
  use: { baseURL: `http://127.0.0.1:${process.env.FANPOT_E2E_PORT || '3000'}`, locale: 'en-US', reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1100 } } },
    ...[360, 390, 430].map(width => ({ name: `mobile-${width}`, use: { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } }))
  ]
});
