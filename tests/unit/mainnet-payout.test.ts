import { describe, expect, it } from 'vitest';
import { MAINNET_PAYOUT_AMOUNT, MAINNET_PAYOUT_HASH, payoutActions, type PayoutState } from '../../packages/shared/mainnet-payout';

const organizer = '0x1111111111111111111111111111111111111111';
const reviewer = '0x2222222222222222222222222222222222222222';
const successful: PayoutState = { phase: 2, outcome: 1, allocationStatus: 0, organizer, reviewer, requestedAmount: 0n, evidenceHash: `0x${'0'.repeat(64)}`, settleBy: 200n, timestamp: 100n };
const pending: PayoutState = { ...successful, allocationStatus: 1, requestedAmount: MAINNET_PAYOUT_AMOUNT, evidenceHash: MAINNET_PAYOUT_HASH };

describe('Mainnet payout permissions and lifecycle', () => {
  it('requires successful funding before either payment step', () => {
    expect(payoutActions({ ...successful, phase: 1, outcome: 0 }, organizer).request).toBe(false);
    expect(payoutActions({ ...pending, phase: 1, outcome: 0 }, reviewer).approve).toBe(false);
  });
  it('separates organizer requests from reviewer payments', () => {
    expect(payoutActions(successful, organizer).request).toBe(true);
    expect(payoutActions(successful, reviewer).request).toBe(false);
    expect(payoutActions(pending, organizer).approve).toBe(false);
    expect(payoutActions(pending, reviewer).approve).toBe(true);
    expect(payoutActions(pending, null).approve).toBe(false);
  });
  it('blocks a payout with a different amount or evidence commitment', () => {
    expect(payoutActions({ ...pending, requestedAmount: MAINNET_PAYOUT_AMOUNT - 1n }, reviewer).approve).toBe(false);
    expect(payoutActions({ ...pending, evidenceHash: `0x${'a'.repeat(64)}` }, reviewer).approve).toBe(false);
  });
  it('cannot request or approve a resolved allocation', () => {
    for (const allocationStatus of [2, 3]) {
      expect(payoutActions({ ...pending, allocationStatus }, organizer).request).toBe(false);
      expect(payoutActions({ ...pending, allocationStatus }, reviewer).approve).toBe(false);
    }
  });
  it('blocks payments at the settlement deadline and allows settlement', () => {
    expect(payoutActions({ ...successful, timestamp: 200n }, organizer).request).toBe(false);
    expect(payoutActions({ ...pending, timestamp: 200n }, reviewer).approve).toBe(false);
    expect(payoutActions({ ...pending, timestamp: 200n }, organizer).settle).toBe(true);
  });
  it('allows early settlement only after the allocation is paid or skipped', () => {
    expect(payoutActions(pending, organizer).settle).toBe(false);
    expect(payoutActions({ ...pending, phase: 3, allocationStatus: 2 }, reviewer).settle).toBe(true);
    expect(payoutActions({ ...successful, allocationStatus: 3 }, organizer).settle).toBe(true);
  });
  it('never repeats settlement after refunds open or closure', () => {
    for (const phase of [4, 5]) expect(payoutActions({ ...pending, phase, allocationStatus: 2 }, organizer).settle).toBe(false);
  });
});
