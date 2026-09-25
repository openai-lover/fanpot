import { readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseUnits, keccak256, toBytes, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Only for explicitly labelled Arc Testnet simulations. Never add real keys to .demo.
const chain = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } } };
const usdc = '0x3600000000000000000000000000000000000000';
const tokenAbi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
];
const client = createPublicClient({ chain, transport: http() });
const keyFile = JSON.parse(readFileSync('.demo/keys.json', 'utf8'));
for (const name of ['organizer', 'reviewer', 'fanC', 'fanD', 'adVendor', 'printVendor', 'cafeVendor']) {
  if (!keyFile[name]) throw Error(`Missing ${name} in ignored .demo/keys.json`);
}
const accounts = Object.fromEntries(Object.entries(keyFile).map(([name, key]) => [name, privateKeyToAccount(key.privateKey)]));
const wallets = Object.fromEntries(Object.entries(accounts).map(([name, account]) => [name, createWalletClient({ account, chain, transport: http() })]));
const factoryAbi = JSON.parse(readFileSync('.demo/build/FanPotFactory.json', 'utf8')).abi;
const campaignAbi = JSON.parse(readFileSync('.demo/build/FanPotCampaign.json', 'utf8')).abi;
const stateFile = '.demo/deployment.json';
const state = JSON.parse(readFileSync(stateFile, 'utf8'));
const hash = (text) => keccak256(toBytes(text));
const amount = (text) => parseUnits(text, 6);
const save = () => writeFileSync(stateFile, JSON.stringify(state, null, 2));
async function record(label, action) {
  let tx = state.transactions[label];
  if (!tx) { tx = await action(); state.transactions[label] = tx; save(); console.log(`${label}: ${tx}`); }
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  if (receipt.status !== 'success') throw Error(`${label} reverted: ${tx}`);
  return receipt;
}
const write = (role, address, abi, functionName, args, label) => record(label, () => wallets[role].writeContract({ address, abi, functionName, args }));
const call = (key, functionName, args, role, label) => write(role, state.campaigns[key].address, campaignAbi, functionName, args, label);
async function create(key, slug, goal, allocations) {
  if (state.campaigns[key]) return;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 14 * 86400);
  const rulesHash = hash(`fanpot-arc-testnet-v2:${slug}:fictional-demo:no-real-world-delivery`);
  const draftRef = hash(`fanpot-arc-testnet-v2:${slug}:2026-09-25`);
  const receipt = await write('organizer', state.factory, factoryAbi, 'createCampaign', [amount(goal), deadline, rulesHash, allocations, draftRef], `create-${key}`);
  const event = receipt.logs.map((log) => {
    try { return decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics }); } catch { return null; }
  }).find((log) => log?.eventName === 'CampaignCreated');
  if (!event) throw Error(`CampaignCreated missing for ${key}`);
  const address = event.args.campaign;
  const actualDeadline = await client.readContract({ address, abi: campaignAbi, functionName: 'deadline' });
  state.campaigns[key] = { slug, address, rulesHash, draftRef, deadline: Number(actualDeadline) };
  save();
}
async function contribute(key, role, value) {
  const address = state.campaigns[key].address;
  await write(role, usdc, tokenAbi, 'approve', [address, amount(value)], `approve-${key}-${role}`);
  await call(key, 'contribute', [amount(value), hash(`${key}:${role}:${value}:fictional-demo`)], role, `contribute-${key}-${role}`);
}
async function main() {
  if ((await client.getChainId()) !== chain.id) throw Error('Wrong chain');
  // fanC received 20 USDC from the Circle faucet; fanD is a second controlled demo wallet.
  await record('seed-fan-d', () => wallets.fanC.sendTransaction({ to: accounts.fanD.address, value: parseUnits('7', 18) }));

  await create('cafe', 'lumi-birthday-cafe-demo', '10', [
    { recipient: accounts.printVendor.address, cap: amount('4'), purposeHash: hash('demo:cupsleeve-and-card-print-concept') },
    { recipient: accounts.cafeVendor.address, cap: amount('4'), purposeHash: hash('demo:cafe-display-concept') },
    { recipient: accounts.adVendor.address, cap: amount('1'), purposeHash: hash('demo:optional-event-signage-concept') },
  ]);
  await call('cafe', 'activate', [], 'reviewer', 'activate-cafe');
  await contribute('cafe', 'fanC', '7');
  await contribute('cafe', 'fanD', '3');
  const printEvidence = hash('simulation:fictional-cafe-print-approval:no-order-or-delivery');
  const venueEvidence = hash('simulation:fictional-cafe-display-approval:no-venue-booking');
  await call('cafe', 'requestPayout', [0, amount('4'), printEvidence], 'organizer', 'request-cafe-print');
  await call('cafe', 'approveAndPay', [0, amount('4'), printEvidence], 'reviewer', 'pay-cafe-print');
  await call('cafe', 'requestPayout', [1, amount('4'), venueEvidence], 'organizer', 'request-cafe-display');
  await call('cafe', 'approveAndPay', [1, amount('4'), venueEvidence], 'reviewer', 'pay-cafe-display');
  await call('cafe', 'skipAllocation', [2], 'reviewer', 'skip-cafe-signage');
  await call('cafe', 'settle', [], 'organizer', 'settle-cafe');
  await call('cafe', 'claimRefundFor', [accounts.fanC.address], 'reviewer', 'refund-cafe-fan-c');
  await call('cafe', 'claimRefund', [], 'fanD', 'refund-cafe-fan-d');

  await create('cancelled', 'lumi-bus-shelter-cancelled-demo', '8', [
    { recipient: accounts.adVendor.address, cap: amount('6'), purposeHash: hash('demo:bus-shelter-placement-concept') },
    { recipient: accounts.printVendor.address, cap: amount('1'), purposeHash: hash('demo:bus-shelter-poster-concept') },
  ]);
  await call('cancelled', 'activate', [], 'reviewer', 'activate-cancelled');
  await contribute('cancelled', 'fanC', '3');
  await contribute('cancelled', 'fanD', '2');
  await call('cancelled', 'stop', [], 'organizer', 'stop-cancelled');
  await call('cancelled', 'claimRefund', [], 'fanC', 'refund-cancelled-fan-c');
  await call('cancelled', 'claimRefundFor', [accounts.fanD.address], 'reviewer', 'refund-cancelled-fan-d');

  const cafe = await client.readContract({ address: state.campaigns.cafe.address, abi: campaignAbi, functionName: 'getSummary' });
  const cancelled = await client.readContract({ address: state.campaigns.cancelled.address, abi: campaignAbi, functionName: 'getSummary' });
  if (cafe.phase !== 5 || cafe.totalContributed !== amount('10') || cafe.totalPaid !== amount('8') || cafe.totalRefunded !== amount('2') ||
      cancelled.phase !== 5 || cancelled.outcome !== 3 || cancelled.totalContributed !== amount('5') || cancelled.totalPaid !== 0n || cancelled.totalRefunded !== amount('5')) throw Error('Unexpected extra campaign state');
  const manifestFile = 'apps/web/data/arc-testnet-demo.json';
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  manifest.campaigns = { ...manifest.campaigns, cafe: state.campaigns.cafe, cancelled: state.campaigns.cancelled };
  manifest.actors = Object.fromEntries(Object.entries(accounts).map(([name, account]) => [name, account.address]));
  manifest.transactions = { ...manifest.transactions, ...state.transactions };
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ cafe: state.campaigns.cafe.address, cancelled: state.campaigns.cancelled.address, cafePaid: '8/10', cafeRefunded: '2/10', cancelledRefunded: '5/5' }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
