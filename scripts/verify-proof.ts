import { readFileSync } from 'node:fs';
import { createPublicClient, decodeEventLog, decodeFunctionData, encodeDeployData, getAddress, http, isAddress, parseAbi } from 'viem';
import { arc } from 'viem/chains';
import { fanPotFactoryAbi } from '../packages/shared/abi/FanPotFactory.ts';
import { fanPotCampaignAbi } from '../packages/shared/abi/FanPotCampaign.ts';
import { ARC_USDC } from '../packages/shared/chain.ts';
import { MAINNET_PURPOSE_HASH, MAINNET_RULES_HASH } from '../packages/shared/mainnet-plan.ts';

type Proof = { chainId: number; factory: string | null; campaign: string | null; organizer: string; reviewer: string; vendor: string | null; transactions: Record<string, string> };
const proof = JSON.parse(readFileSync('apps/web/data/arc-mainnet-deployment.json', 'utf8')) as Proof;
const build = JSON.parse(readFileSync('apps/web/data/mainnet-factory-bytecode.json', 'utf8')) as { compiler: string; bytecode: `0x${string}` };
const rulesHash = MAINNET_RULES_HASH;
const purposeHash = MAINNET_PURPOSE_HASH;
const required = ['deploy-factory', 'allow-organizer', 'create-campaign', 'activate-campaign', 'contribute-campaign', 'complete-funding', 'request-payout', 'approve-and-pay', 'settle-campaign', 'claim-refund'];

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw Error(message); }
function sameAddress(actual: string | null | undefined, expected: string) { return actual?.toLowerCase() === expected.toLowerCase(); }
async function main() {
  assert(proof.chainId === 5042, 'Wrong manifest chain ID');
  assert(typeof proof.factory === 'string' && isAddress(proof.factory) && typeof proof.campaign === 'string' && isAddress(proof.campaign) && isAddress(proof.organizer) && isAddress(proof.reviewer) && typeof proof.vendor === 'string' && isAddress(proof.vendor), 'Deployment addresses are missing or invalid');
  const factory = getAddress(proof.factory), campaign = getAddress(proof.campaign), organizer = getAddress(proof.organizer), reviewer = getAddress(proof.reviewer), vendor = getAddress(proof.vendor);
  assert(new Set([organizer.toLowerCase(), reviewer.toLowerCase(), vendor.toLowerCase()]).size === 3, 'Roles are not distinct');
  for (const label of required) assert(/^0x[0-9a-fA-F]{64}$/.test(proof.transactions[label] ?? ''), `Missing ${label} transaction`);
  const client = createPublicClient({ chain: arc, transport: http(process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io') });
  assert(await client.getChainId() === 5042, 'RPC is not Arc Mainnet');
  const [factoryCode, campaignCode, registered, owner, fixedReviewer, factoryUsdc, config, summary, allocation] = await Promise.all([
    client.getCode({ address: factory }), client.getCode({ address: campaign }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'isCampaign', args: [campaign] }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'owner' }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'reviewer' }),
    client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'usdc' }),
    client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getConfig' }),
    client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getSummary' }),
    client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getAllocation', args: [0] }),
  ]);
  assert(factoryCode && factoryCode !== '0x' && campaignCode && campaignCode !== '0x', 'Missing deployed bytecode');
  assert(registered && sameAddress(owner, organizer) && sameAddress(fixedReviewer, reviewer) && sameAddress(factoryUsdc, ARC_USDC), 'Factory config mismatch');
  assert(sameAddress(config.organizer, organizer) && sameAddress(config.reviewer, reviewer) && sameAddress(config.usdc, ARC_USDC) && config.goal === 2_000_000n && config.rulesHash === rulesHash, 'Campaign config mismatch');
  assert(sameAddress(allocation.recipient, vendor) && allocation.cap === 1_000_000n && allocation.purposeHash === purposeHash, 'Allocation mismatch');
  assert(summary.phase >= 1 && summary.totalContributed > 0n, 'Campaign is not activated with a real contribution');
  const receipts = Object.fromEntries(await Promise.all(required.map(async (label) => {
    const receipt = await client.getTransactionReceipt({ hash: proof.transactions[label] as `0x${string}` });
    assert(receipt.status === 'success', `${label} reverted`);
    return [label, receipt] as const;
  })));
  assert(sameAddress(receipts['deploy-factory'].contractAddress, factory) && sameAddress(receipts['deploy-factory'].from, organizer), 'Factory deployment receipt mismatch');
  assert(sameAddress(receipts['allow-organizer'].to, factory) && sameAddress(receipts['create-campaign'].to, factory) && sameAddress(receipts['activate-campaign'].to, campaign) && sameAddress(receipts['contribute-campaign'].to, campaign), 'Transaction destinations mismatch');
  assert(sameAddress(receipts['activate-campaign'].from, reviewer), 'Reviewer did not activate campaign');
  const creation = receipts['create-campaign'].logs.map((log) => { try { return decodeEventLog({ abi: fanPotFactoryAbi, data: log.data, topics: log.topics }); } catch { return null; } }).find((event) => event?.eventName === 'CampaignCreated');
  assert(creation?.eventName === 'CampaignCreated' && sameAddress(creation.args.campaign, campaign) && creation.args.rulesHash === rulesHash, 'CampaignCreated event mismatch');
  const deploymentTx = await client.getTransaction({ hash: proof.transactions['deploy-factory'] as `0x${string}` });
  const expectedInput = encodeDeployData({ abi: fanPotFactoryAbi, bytecode: build.bytecode, args: [organizer, reviewer, ARC_USDC] });
  assert(deploymentTx.input === expectedInput, 'Factory creation bytecode does not match the checked-in build');
  const steps = [
    ['complete-funding', 'contribute', organizer], ['request-payout', 'requestPayout', organizer],
    ['approve-and-pay', 'approveAndPay', reviewer], ['settle-campaign', 'settle', organizer],
    ['claim-refund', 'claimRefund', organizer],
  ] as const;
  for (const [label, method, caller] of steps) {
    const receipt = receipts[label];
    assert(sameAddress(receipt.to, campaign) && sameAddress(receipt.from, caller), `${label}: destination/caller mismatch`);
    const tx = await client.getTransaction({ hash: receipt.transactionHash });
    assert(decodeFunctionData({ abi: fanPotCampaignAbi, data: tx.input }).functionName === method, `${label}: method mismatch`);
  }
  function events(label: string) {
    return receipts[label].logs.filter(log => sameAddress(log.address, campaign)).flatMap(log => {
      try { return [decodeEventLog({ abi: fanPotCampaignAbi, data: log.data, topics: log.topics })]; } catch { return []; }
    });
  }
  const funded = events('complete-funding').find(e => e.eventName === 'Contributed');
  assert(funded?.eventName === 'Contributed' && funded.args.amount === 1_750_000n && funded.args.totalContributed === 2_000_000n && sameAddress(funded.args.supporter, organizer), 'Funding event mismatch');
  const requested = events('request-payout').find(e => e.eventName === 'PayoutRequested');
  assert(requested?.eventName === 'PayoutRequested' && requested.args.index === 0 && requested.args.amount === 1_000_000n && requested.args.evidenceHash === allocation.evidenceHash, 'Request event mismatch');
  const paid = events('approve-and-pay').find(e => e.eventName === 'PayoutExecuted');
  assert(paid?.eventName === 'PayoutExecuted' && paid.args.index === 0 && paid.args.amount === 1_000_000n && sameAddress(paid.args.recipient, vendor) && paid.args.evidenceHash === allocation.evidenceHash, 'Payment event mismatch');
  const settled = events('settle-campaign').find(e => e.eventName === 'RefundsOpened');
  assert(settled?.eventName === 'RefundsOpened' && settled.args.refundPool === 1_000_000n && settled.args.reason === 3, 'Settlement event mismatch');
  const refunded = events('claim-refund').find(e => e.eventName === 'RefundClaimed');
  assert(refunded?.eventName === 'RefundClaimed' && refunded.args.amount === 1_000_000n && sameAddress(refunded.args.supporter, organizer), 'Refund event mismatch');
  const transferAbi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);
  for (const [label, recipient] of [['approve-and-pay', vendor], ['claim-refund', organizer]] as const) {
    const transfers = receipts[label].logs.filter(log => sameAddress(log.address, ARC_USDC)).flatMap(log => {
      try { return [decodeEventLog({ abi: transferAbi, data: log.data, topics: log.topics })]; } catch { return []; }
    });
    assert(transfers.some(e => sameAddress(e.args.from, campaign) && sameAddress(e.args.to, recipient) && e.args.value === 1_000_000n), `${label}: USDC transfer missing`);
  }
  assert(summary.phase === 5 && summary.outcome === 1 && allocation.status === 2 && summary.totalContributed === 2_000_000n && summary.totalPaid === 1_000_000n && summary.totalRefunded === 1_000_000n && summary.accountedBalance === 0n, 'Final lifecycle does not reconcile');
  console.log(JSON.stringify({ network: 'Arc Mainnet', lifecycle: 'Closed; funding, payment, settlement and refund verified', factory, campaign, organizer, reviewer, vendor, raisedUsdc: Number(summary.totalContributed) / 1e6, paidUsdc: Number(summary.totalPaid) / 1e6, refundedUsdc: Number(summary.totalRefunded) / 1e6, accountedBalanceUsdc: Number(summary.accountedBalance) / 1e6, supporterCount: summary.supporterCount.toString(), compiler: build.compiler, transactions: proof.transactions }, null, 2));
}
main().catch((error) => { console.error(`Mainnet proof failed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
