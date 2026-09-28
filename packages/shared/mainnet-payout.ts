import { keccak256, toBytes } from 'viem';
import { MAINNET_VENDOR } from './mainnet-plan';

export const MAINNET_PAYOUT_AMOUNT = 1_000_000n;
export const MAINNET_PAYOUT_RECORD = JSON.stringify({
  version: 1,
  network: 'Arc Mainnet',
  campaign: '0x82f2C8E937a26Af861F5614181863889218ab11E',
  recipient: MAINNET_VENDOR,
  amountUsdc: '1.00',
  purpose: 'Controlled FanPot payout verification to a builder-owned recipient wallet.',
  delivery: 'No advertisement, merchandise or third-party service was purchased or delivered.',
});
export const MAINNET_PAYOUT_HASH = keccak256(toBytes(MAINNET_PAYOUT_RECORD));

export type PayoutState = {
  phase: number; outcome: number; allocationStatus: number;
  organizer: string; reviewer: string; requestedAmount: bigint; evidenceHash: string;
  settleBy: bigint; timestamp: bigint;
};

/** Gates the published one-allocation Mainnet campaign; the contract remains authoritative. */
export function payoutActions(s: PayoutState, account: string | null) {
  const organizer = account?.toLowerCase() === s.organizer.toLowerCase();
  const reviewer = account?.toLowerCase() === s.reviewer.toLowerCase();
  const successful = s.outcome === 1 && (s.phase === 2 || s.phase === 3);
  const paying = successful && s.timestamp < s.settleBy;
  const requestMatches = s.requestedAmount === MAINNET_PAYOUT_AMOUNT && s.evidenceHash.toLowerCase() === MAINNET_PAYOUT_HASH.toLowerCase();
  return {
    request: organizer && paying && s.allocationStatus === 0,
    approve: reviewer && paying && s.allocationStatus === 1 && requestMatches,
    settle: Boolean(account) && successful && (s.allocationStatus === 2 || s.allocationStatus === 3 || s.timestamp >= s.settleBy),
    requestMatches,
  };
}
