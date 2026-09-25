import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseUnits, keccak256, toBytes, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Testnet only. Keys live in ignored .demo/keys.json and are never exported.
const chain = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } } };
const usdc = '0x3600000000000000000000000000000000000000';
const tokenAbi = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{name:'to',type:'address'},{name:'value',type:'uint256'}], outputs: [{type:'bool'}] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{name:'spender',type:'address'},{name:'value',type:'uint256'}], outputs: [{type:'bool'}] },
];
const publicClient = createPublicClient({ chain, transport: http() });
const keys = JSON.parse(readFileSync('.demo/keys.json', 'utf8'));
const factoryBuild = JSON.parse(readFileSync('.demo/build/FanPotFactory.json', 'utf8'));
const campaignBuild = JSON.parse(readFileSync('.demo/build/FanPotCampaign.json', 'utf8'));
const accounts = Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, privateKeyToAccount(key.privateKey)]));
const wallets = Object.fromEntries(Object.entries(accounts).map(([name, account]) => [name, createWalletClient({ account, chain, transport: http() })]));
const sha = (value) => keccak256(toBytes(value));
const units = (value) => parseUnits(value, 6);
const statePath = '.demo/deployment.json';
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { chainId: chain.id, transactions: {} };
const save = () => writeFileSync(statePath, JSON.stringify(state, null, 2));
async function record(label, send) {
  if (state.transactions[label]) {
    const previous = await publicClient.waitForTransactionReceipt({ hash: state.transactions[label] });
    if (previous.status !== 'success') throw Error(`${label} previously reverted: ${previous.transactionHash}`);
    return previous;
  }
  const hash = await send();
  state.transactions[label] = hash;
  save();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw Error(`${label} reverted: ${hash}`);
  console.log(`${label}: ${hash}`);
  return receipt;
}
async function write(role, address, abi, functionName, args, label) {
  return record(label, () => wallets[role].writeContract({ address, abi, functionName, args }));
}
async function createCampaign(slug, allocations) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 14 * 86400);
  const rulesHash = sha(`fanpot-arc-testnet-v1:${slug}:fictional-demo:no-real-world-delivery`);
  const draftRef = sha(`fanpot-arc-testnet:${slug}:2026-09-25`);
  const receipt = await write('organizer', state.factory, factoryBuild.abi, 'createCampaign',
    [units('10'), deadline, rulesHash, allocations, draftRef], `create-${slug}`);
  const event = receipt.logs.map((log) => {
    try { return decodeEventLog({ abi: factoryBuild.abi, data: log.data, topics: log.topics }); } catch { return null; }
  }).find((event) => event?.eventName === 'CampaignCreated');
  if (!event) throw Error(`CampaignCreated missing for ${slug}`);
  return { slug, address: event.args.campaign, rulesHash, draftRef, deadline: Number(deadline) };
}
const campaign = (address, functionName, args, role, label) => write(role, address, campaignBuild.abi, functionName, args, label);
async function contribute(slug, address, role, amount, n) {
  await write(role, usdc, tokenAbi, 'approve', [address, units(amount)], `approve-${slug}-${role}-${n}`);
  await campaign(address, 'contribute', [units(amount), sha(`${slug}:${role}:${n}:fictional-demo`)], role, `contribute-${slug}-${role}-${n}`);
}
async function main() {
  if ((await publicClient.getChainId()) !== chain.id) throw Error('Wrong chain');
  const receipt = await record('deploy-factory', () => wallets.organizer.deployContract({
    abi: factoryBuild.abi, bytecode: factoryBuild.bytecode,
    args: [accounts.organizer.address, accounts.reviewer.address, usdc],
  }));
  state.factory = receipt.contractAddress;
  save();
  await write('organizer', state.factory, factoryBuild.abi, 'setOrganizerAllowed', [accounts.organizer.address, true], 'allow-organizer');
  // Each transfer funds an explicitly labelled simulated fan, using only faucet USDC.
  await write('organizer', usdc, tokenAbi, 'transfer', [accounts.fanA.address, units('10')], 'seed-fan-a');
  await write('organizer', usdc, tokenAbi, 'transfer', [accounts.fanB.address, units('7')], 'seed-fan-b');
  for (const role of ['reviewer', 'fanA', 'fanB']) {
    await record(`gas-${role}`, () => wallets.organizer.sendTransaction({
      to: accounts[role].address, value: parseUnits('0.1', 18),
    }));
  }

  if (!state.campaigns?.advertising) {
    const allocations = [
      { recipient: accounts.adVendor.address, cap: units('8'), purposeHash: sha('demo:hongdae-station-screen-placement') },
      { recipient: accounts.printVendor.address, cap: units('1'), purposeHash: sha('demo:original-poster-production') },
    ];
    state.campaigns = { ...state.campaigns, advertising: await createCampaign('lumi-birthday-ad', allocations) }; save();
  }
  const ad = state.campaigns.advertising.address;
  await campaign(ad, 'activate', [], 'reviewer', 'activate-ad');
  await contribute('ad', ad, 'fanA', '4', 1);
  await contribute('ad', ad, 'fanB', '3', 1);

  if (!state.campaigns?.merch) {
    const allocations = [
      { recipient: accounts.printVendor.address, cap: units('6'), purposeHash: sha('demo:original-cupsleeve-photocard-print') },
      { recipient: accounts.adVendor.address, cap: units('3'), purposeHash: sha('demo:fictional-pop-up-display') },
    ];
    state.campaigns = { ...state.campaigns, merch: await createCampaign('lumi-fanmade-goods', allocations) }; save();
  }
  const merch = state.campaigns.merch.address;
  await campaign(merch, 'activate', [], 'reviewer', 'activate-merch');
  await contribute('merch', merch, 'fanA', '6', 1);
  await contribute('merch', merch, 'fanB', '4', 1);
  const evidence = [sha('simulation:print-allocation:fictional-vendor:no-order'), sha('simulation:display-allocation:fictional-vendor:no-order')];
  await campaign(merch, 'requestPayout', [0, units('6'), evidence[0]], 'organizer', 'request-merch-print');
  await campaign(merch, 'approveAndPay', [0, units('6'), evidence[0]], 'reviewer', 'pay-merch-print');
  await campaign(merch, 'requestPayout', [1, units('3'), evidence[1]], 'organizer', 'request-merch-display');
  await campaign(merch, 'approveAndPay', [1, units('3'), evidence[1]], 'reviewer', 'pay-merch-display');
  await campaign(merch, 'settle', [], 'organizer', 'settle-merch');
  await campaign(merch, 'claimRefund', [], 'fanA', 'refund-merch-fan-a');
  await campaign(merch, 'claimRefund', [], 'fanB', 'refund-merch-fan-b');

  const adSummary = await publicClient.readContract({ address: ad, abi: campaignBuild.abi, functionName: 'getSummary' });
  const merchSummary = await publicClient.readContract({ address: merch, abi: campaignBuild.abi, functionName: 'getSummary' });
  if (adSummary.phase !== 1 || adSummary.totalContributed !== units('7') || merchSummary.phase !== 5 || merchSummary.totalPaid !== units('9') || merchSummary.totalRefunded !== units('1')) throw Error('Unexpected on-chain state');
  const manifest = {
    chainId: chain.id, rpc: 'https://rpc.testnet.arc.io', explorer: 'https://explorer.testnet.arc.io', usdc,
    factory: state.factory, scenario: 'fictional, simulated fan campaign; faucet tokens; no real orders or artist affiliation',
    campaigns: state.campaigns, actors: Object.fromEntries(Object.entries(accounts).map(([name, account]) => [name, account.address])),
    transactions: state.transactions,
  };
  writeFileSync('apps/web/data/arc-testnet-demo.json', JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ factory: state.factory, advertising: ad, merch, adRaised: '7/10', merchPaid: '9/10', merchRefunded: '1/10' }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
