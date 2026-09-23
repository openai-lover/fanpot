import { expect, it } from 'vitest';
import { validateProductionConfig } from '../../packages/shared/config';
it('fails closed for missing production configuration and public secrets', () => {
  expect(validateProductionConfig({}).length).toBeGreaterThan(0);
  expect(validateProductionConfig({ NEXT_PUBLIC_PRIVATE_KEY: 'never-a-real-key', NEXT_PUBLIC_CHAIN_ID: '5042002' })).toContain('Production must use chain 5042');
  expect(validateProductionConfig({ NEXT_PUBLIC_PRIVATE_KEY: 'never-a-real-key' })).toContain('NEXT_PUBLIC_PRIVATE_KEY: secret must not be public');
});
