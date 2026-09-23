import { describe, expect, it } from 'vitest';
import { parseUSDC, formatUSDC, contributionError, proportionalRefund, requiredNativeBalance } from '../../packages/shared/amounts';
import { preferenceSchema, publicSupporter } from '../../packages/shared/privacy';
import { snapshotRules } from '../../packages/shared/rules';
describe('money is integer USDC units', () => {
  it.each(['NaN', 'Infinity', '-1', '1e6', '1,000', '1.0000001', ' 1', '.1', '01', '0', '0.0', '+1'])('rejects ambiguous %s', v => expect(() => parseUSDC(v)).toThrow());
  it('preserves exact six decimals and keeps gas in eighteen decimals', () => {
    expect(parseUSDC('10.000001')).toBe(10_000_001n); expect(formatUSDC(10_000_001n, true)).toBe('10.000001');
    expect(parseUSDC(formatUSDC(10_000_001n, true))).toBe(10_000_001n);
    const estimate = requiredNativeBalance(10_000_000n, 100_000n, 1n, 0n);
    expect(estimate.maxFeePerGas).toBe(20_000_000_000n);
    expect(estimate.required).toBe(10n * 10n ** 18n + 2_400_000_000_000_000n);
  });
  it('rejects invalid priority fees and never silently clamps contribution', () => {
    expect(() => requiredNativeBalance(1n, 1n, 20n, 30_000_000_000n)).toThrow();
    expect(contributionError(2_000_000n, 10_000_000n, 9_000_000n, 0n)).toBe('GOAL_CAPACITY_EXCEEDED');
    expect(contributionError(1n, 1_000_000n, 999_999n, 0n)).toBeNull();
    expect(contributionError(1n, 1_000_000n, 0n, 0n)).toBe('INVALID_AMOUNT');
    expect(contributionError(1_000_000n, 100_000_000n, 20_000_000n, 20_000_000n)).toBe('WALLET_CAP_EXCEEDED');
  });
  it('refund conservation and rounding over 10,000 deterministic cases', () => {
    for (let i = 1n; i <= 10_000n; i++) {
      const a = i * 131n, b = i * 47n + 1n, total = a + b, pool = (i * 97n) % total;
      const ra = proportionalRefund(a, pool, total), rb = proportionalRefund(b, pool, total);
      expect(ra + rb <= pool && pool - ra - rb < 2n).toBe(true);
      expect(proportionalRefund(a, total, total)).toBe(a);
    }
    expect(proportionalRefund(0n, 0n, 0n)).toBe(0n);
  });
});
describe('privacy projection', () => {
  it('does not serialize private fields or hidden amounts', () => {
    const row = { publicRowId: 'random-public-id', preference: preferenceSchema.parse({ displayKind: 'nickname', displayName: 'fan_a', amountPublic: false }), contributionUnits: 1234567n, wallet: 'SECRET_WALLET', txHash: 'SECRET_TX', clientRef: 'SECRET_REF' };
    const json = JSON.stringify(publicSupporter(row));
    expect(json).not.toMatch(/SECRET|1234567|wallet|txHash|clientRef/);
    expect(JSON.parse(json).amount).toBeNull();
  });
  it('rejects HTML, control characters and unknown fields; normalizes X handle', () => {
    expect(() => preferenceSchema.parse({ displayKind: 'nickname', displayName: '<img>', amountPublic: true })).toThrow();
    expect(() => preferenceSchema.parse({ displayKind: 'anonymous', displayName: null, amountPublic: false, wallet: 'other' })).toThrow();
    expect(preferenceSchema.parse({ displayKind: 'x_handle', displayName: '@lumi', amountPublic: false }).displayName).toBe('lumi');
  });
});
const rules = { version: 1, chainId: 5042, factory: '0x0000000000000000000000000000000000000001', organizer: '0x0000000000000000000000000000000000000002', reviewer: '0x0000000000000000000000000000000000000003', usdc: '0x3600000000000000000000000000000000000000', goalUnits: '10000000', deadline: 1800000000, settleBy: 1801209600, refundPolicy: 'claim_on_failure', surplusPolicy: 'proportional_refund', allocations: [{ index: 0, recipient: '0x0000000000000000000000000000000000000004', capUnits: '9000000', purposeHash: `0x${'ab'.repeat(32)}`, label: 'Birthday ad' }] };
describe('frozen canonical rules', () => {
  it('has the same hash regardless of object key insertion order', () => {
    expect(snapshotRules(rules).hash).toBe(snapshotRules(Object.fromEntries(Object.entries(rules).reverse())).hash);
    expect(snapshotRules({ ...rules, goalUnits: '11000000' }).hash).not.toBe(snapshotRules(rules).hash);
  });
  it('rejects excluded policy, personal data, role collision and oversize goal', () => {
    for (const edit of [{ surplusPolicy: 'donate' }, { nickname: 'fan' }, { reviewer: rules.organizer }, { goalUnits: '3000000000' }, { settleBy: rules.settleBy + 1 }]) expect(() => snapshotRules({ ...rules, ...edit })).toThrow();
  });
});
