import { decodeEventLog, parseAbi, type Address, type Hex } from 'viem';
const abi = parseAbi(['event Contributed(address indexed supporter, uint256 amount, bytes32 clientRef, uint256 totalContributed, uint256 supporterOrdinal)']);
type Receipt = { status: 'success' | 'reverted'; transactionHash: Hex; from: Address; logs: { address: Address; data: Hex; topics: readonly Hex[] }[] };
export function verifyContributionReceipt(receipt: Receipt, expected: { tx: Hex; chainId: number; actualChainId: number; campaign: Address; supporter: Address; amount: bigint; clientRef: Hex }) {
  if (expected.actualChainId !== expected.chainId || receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== expected.tx.toLowerCase() || receipt.from.toLowerCase() !== expected.supporter.toLowerCase()) throw new Error('RECEIPT_MISMATCH');
  const matches = receipt.logs.flatMap(log => {
    if (log.address.toLowerCase() !== expected.campaign.toLowerCase()) return [];
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
      return event.args.supporter.toLowerCase() === expected.supporter.toLowerCase() && event.args.amount === expected.amount && event.args.clientRef.toLowerCase() === expected.clientRef.toLowerCase() ? [event.args] : [];
    } catch { return []; }
  });
  if (matches.length !== 1) throw new Error('CONTRIBUTION_NOT_CONFIRMED');
  return matches[0];
}
