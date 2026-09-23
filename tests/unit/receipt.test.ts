import { expect, it } from 'vitest';
import { encodeAbiParameters, encodeEventTopics, parseAbi, type Address, type Hex } from 'viem';
import { verifyContributionReceipt } from '../../packages/shared/receipt';
const supporter = '0x0000000000000000000000000000000000000001' as Address;
const campaign = '0x0000000000000000000000000000000000000002' as Address;
const clientRef = `0x${'ab'.repeat(32)}` as Hex, tx = `0x${'cd'.repeat(32)}` as Hex;
const abi = parseAbi(['event Contributed(address indexed supporter, uint256 amount, bytes32 clientRef, uint256 totalContributed, uint256 supporterOrdinal)']);
const log = { address: campaign, topics: encodeEventTopics({ abi, eventName: 'Contributed', args: { supporter } }) as Hex[], data: encodeAbiParameters([{ type: 'uint256' }, { type: 'bytes32' }, { type: 'uint256' }, { type: 'uint256' }], [1_000_000n, clientRef, 1_000_000n, 1n]) };
const receipt = { status: 'success' as const, transactionHash: tx, from: supporter, logs: [log] };
const expected = { tx, chainId: 5042, actualChainId: 5042, campaign, supporter, amount: 1_000_000n, clientRef };
it('accepts only matching success event', () => expect(verifyContributionReceipt(receipt, expected).amount).toBe(1_000_000n));
it('rejects reverted, wrong chain/contract/sender/amount/ref and no event', () => {
  expect(() => verifyContributionReceipt({ ...receipt, status: 'reverted' }, expected)).toThrow();
  expect(() => verifyContributionReceipt({ ...receipt, logs: [] }, expected)).toThrow();
  for (const edit of [{ actualChainId: 5042002 }, { campaign: supporter }, { supporter: campaign }, { amount: 2n }, { clientRef: tx }]) expect(() => verifyContributionReceipt(receipt, { ...expected, ...edit })).toThrow();
});
