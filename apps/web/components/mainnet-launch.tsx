'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, createWalletClient, custom, decodeEventLog, getAddress, http, isAddress, parseUnits, type EIP1193Provider } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { MAINNET_DRAFT_REF, MAINNET_ORGANIZER, MAINNET_PURPOSE_HASH, MAINNET_REVIEWER, MAINNET_RULES, MAINNET_RULES_HASH, MAINNET_VENDOR } from '@fanpot/shared/mainnet-plan';
import { fanPotFactoryAbi } from '@fanpot/shared/abi/FanPotFactory';
import { fanPotCampaignAbi } from '@fanpot/shared/abi/FanPotCampaign';
import build from '../data/mainnet-factory-bytecode.json';
import deployment from '../data/arc-mainnet-deployment.json';
import { WALLET_ACTIONS_PAUSED, WALLET_REVIEW_URL } from '../wallet-safety';

const organizer = MAINNET_ORGANIZER;
const reviewer = MAINNET_REVIEWER;
const suggestedVendor = MAINNET_VENDOR;
const rules = MAINNET_RULES;
const rulesHash = MAINNET_RULES_HASH;
const purposeHash = MAINNET_PURPOSE_HASH;
const draftRef = MAINNET_DRAFT_REF;
const publicClient = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0]) });
const explorer = 'https://explorer.arc.io';
type Address = `0x${string}`;

function provider() {
  const found = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!found) throw Error('Open this page in a browser with MetaMask.');
  return found;
}
async function wallet() {
  const client = createWalletClient({ chain: fanpotArc, transport: custom(provider()) });
  const [account] = await client.requestAddresses();
  if (!account) throw Error('Select a wallet account.');
  if (await client.getChainId() !== fanpotArc.id) {
    try { await client.switchChain({ id: fanpotArc.id }); }
    catch { await client.addChain({ chain: fanpotArc }); await client.switchChain({ id: fanpotArc.id }); }
  }
  if (await client.getChainId() !== fanpotArc.id) throw Error('Switch your wallet to Arc Mainnet.');
  return { client, account: getAddress(account) };
}

export function MainnetLaunch() {
  const [account, setAccount] = useState<Address | null>(null);
  const [factory, setFactory] = useState('');
  const [campaign, setCampaign] = useState('');
  const [vendor, setVendor] = useState<string>(suggestedVendor);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [transactions, setTransactions] = useState<Record<string, string>>({});

  useEffect(() => {
    setFactory(deployment.factory ?? localStorage.getItem('fanpot-mainnet-factory') ?? '');
    setCampaign(localStorage.getItem('fanpot-mainnet-campaign') ?? '');
    try { setTransactions({ ...JSON.parse(localStorage.getItem('fanpot-mainnet-transactions') ?? '{}'), ...deployment.transactions }); } catch { setTransactions(deployment.transactions); }
    const fromUrl = new URLSearchParams(window.location.search).get('campaign');
    if (fromUrl && isAddress(fromUrl)) setCampaign(getAddress(fromUrl));
  }, []);

  function record(label: string, hash: string) {
    setTransactions((previous) => {
      const next = { ...previous, [label]: hash };
      localStorage.setItem('fanpot-mainnet-transactions', JSON.stringify(next));
      return next;
    });
  }
  function saveFactory(value: string) { setFactory(value); if (isAddress(value)) localStorage.setItem('fanpot-mainnet-factory', getAddress(value)); }
  function saveCampaign(value: string) { setCampaign(value); if (isAddress(value)) localStorage.setItem('fanpot-mainnet-campaign', getAddress(value)); }
  async function run(label: string, action: () => Promise<void>) {
    if (WALLET_ACTIONS_PAUSED) { setMessage('Wallet actions are paused while the MetaMask site warning is reviewed.'); return; }
    setBusy(true); setMessage(`${label}: waiting for wallet…`);
    try { await action(); setMessage(`${label}: confirmed on Arc Mainnet.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  async function connect() {
    await run('Connect', async () => { const { account } = await wallet(); setAccount(account); });
  }
  function requireRole(actual: Address, expected: Address) {
    if (actual.toLowerCase() !== expected.toLowerCase()) throw Error(`Select ${expected} in MetaMask for this action.`);
  }
  async function deploy() {
    await run('Deploy factory', async () => {
      if (factory) throw Error('Factory address is already entered. Check it before deploying another.');
      const { client, account } = await wallet(); requireRole(account, organizer);
      const hash = await client.deployContract({ account, chain: fanpotArc, abi: fanPotFactoryAbi, bytecode: build.bytecode as Address, args: [organizer, reviewer, ARC_USDC] });
      record('deploy-factory', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success' || !receipt.contractAddress) throw Error(`Deployment failed. Check ${explorer}/tx/${hash}`);
      saveFactory(receipt.contractAddress);
    });
  }
  async function allowOrganizer() {
    await run('Allow organizer', async () => {
      if (!isAddress(factory)) throw Error('Enter the factory address first.');
      const { client, account } = await wallet(); requireRole(account, organizer);
      const fixedReviewer = await publicClient.readContract({ address: getAddress(factory), abi: fanPotFactoryAbi, functionName: 'reviewer' });
      if (fixedReviewer.toLowerCase() !== reviewer.toLowerCase()) throw Error('Factory reviewer differs from this plan.');
      const hash = await client.writeContract({ account, chain: fanpotArc, address: getAddress(factory), abi: fanPotFactoryAbi, functionName: 'setOrganizerAllowed', args: [organizer, true] });
      record('allow-organizer', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Organizer approval reverted.');
    });
  }
  async function createCampaign() {
    await run('Create campaign', async () => {
      if (!isAddress(factory) || !isAddress(vendor)) throw Error('Enter valid factory and vendor addresses.');
      const recipient = getAddress(vendor);
      if ([organizer, reviewer].some((address) => address.toLowerCase() === recipient.toLowerCase())) throw Error('Vendor must differ from organizer and reviewer.');
      const allowed = await publicClient.readContract({ address: getAddress(factory), abi: fanPotFactoryAbi, functionName: 'organizerAllowed', args: [organizer] });
      if (!allowed) throw Error('Allow the organizer before creating a campaign.');
      const { client, account } = await wallet(); requireRole(account, organizer);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 14 * 86_400);
      const hash = await client.writeContract({ account, chain: fanpotArc, address: getAddress(factory), abi: fanPotFactoryAbi, functionName: 'createCampaign', args: [parseUnits('2', 6), deadline, rulesHash, [{ recipient, cap: parseUnits('1', 6), purposeHash }], draftRef] });
      record('create-campaign', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Campaign creation reverted.');
      const event = receipt.logs.map((log) => { try { return decodeEventLog({ abi: fanPotFactoryAbi, data: log.data, topics: log.topics }); } catch { return null; } }).find((item) => item?.eventName === 'CampaignCreated');
      if (!event || event.eventName !== 'CampaignCreated') throw Error(`CampaignCreated event missing. Check ${explorer}/tx/${hash}`);
      saveCampaign(event.args.campaign);
    });
  }
  async function activate() {
    await run('Activate campaign', async () => {
      if (!isAddress(campaign)) throw Error('Enter the campaign address first.');
      const { client, account } = await wallet(); requireRole(account, reviewer);
      const config = await publicClient.readContract({ address: getAddress(campaign), abi: fanPotCampaignAbi, functionName: 'getConfig' });
      if (config.reviewer.toLowerCase() !== reviewer.toLowerCase() || config.organizer.toLowerCase() !== organizer.toLowerCase() || config.rulesHash !== rulesHash) throw Error('Campaign configuration differs from this plan.');
      const hash = await client.writeContract({ account, chain: fanpotArc, address: getAddress(campaign), abi: fanPotCampaignAbi, functionName: 'activate' });
      record('activate-campaign', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw Error('Activation reverted.');
    });
  }

  return <div className="launch-grid">
    {WALLET_ACTIONS_PAUSED && <section className="mainnet-panel launch-wide" role="alert"><h2>Wallet actions temporarily paused</h2><p>MetaMask currently marks this domain as unsafe. Do not connect or sign while the classification is under review. The verified factory deployment remains visible below. <a href={WALLET_REVIEW_URL} target="_blank" rel="noreferrer">Follow the review request ↗</a></p></section>}
    <section className="mainnet-panel launch-wide"><h2>Campaign plan</h2><p>Fictional LUMI birthday screen · 2 USDC goal · one 1 USDC capped simulated vendor allocation · 14-day funding window. Any unspent funds remain claimable by supporters after settlement. No ad placement or merchandise is being sold.</p><details><summary>Exact rules committed onchain</summary><p>{rules}</p><code>{rulesHash}</code></details><dl><div><dt>Organizer</dt><dd>{organizer}</dd></div><div><dt>Reviewer</dt><dd>{reviewer}</dd></div><div><dt>USDC</dt><dd>{ARC_USDC}</dd></div></dl></section>
    <section className="mainnet-panel"><h2>1. Connect wallet</h2><p>Choose the organizer on this computer. The reviewer can open this page on the other computer when the campaign address is ready.</p><button className="button" disabled={busy || WALLET_ACTIONS_PAUSED} onClick={connect}>Connect MetaMask</button><p>{account ?? 'No wallet connected'}</p></section>
    <section className="mainnet-panel"><h2>2. Deploy factory</h2><p>The verified factory below has already been deployed. Do not deploy another one. MetaMask shows the current USDC gas estimate before any later transaction.</p><button className="button" disabled={busy || WALLET_ACTIONS_PAUSED || !!factory} onClick={deploy}>Deploy factory</button><label className="launch-label">Factory address<input value={factory} onChange={(event) => saveFactory(event.target.value)} placeholder="0x…" /></label><button className="outline-button" disabled={busy || WALLET_ACTIONS_PAUSED || !isAddress(factory)} onClick={allowOrganizer}>Allow organizer</button></section>
    <section className="mainnet-panel"><h2>3. Create campaign</h2><p>The vendor address is controlled by the builder. A payout still requires a separate reviewer decision, and no payout is needed to demonstrate live funding.</p><label className="launch-label">Simulated vendor address<input value={vendor} onChange={(event) => setVendor(event.target.value)} /></label><button className="button" disabled={busy || WALLET_ACTIONS_PAUSED || !isAddress(factory) || !!campaign} onClick={createCampaign}>Create 2 USDC campaign</button><label className="launch-label">Campaign address<input value={campaign} onChange={(event) => saveCampaign(event.target.value)} placeholder="0x…" /></label></section>
    <section className="mainnet-panel"><h2>4. Reviewer activation</h2><p>On the other computer, connect {reviewer} and confirm activation. The reviewer wallet needs Arc USDC for gas.</p><button className="button" disabled={busy || WALLET_ACTIONS_PAUSED || !isAddress(campaign)} onClick={activate}>Activate with reviewer wallet</button>{isAddress(campaign) && <a href={`/launch?campaign=${getAddress(campaign)}`}>Reviewer link ↗</a>}</section>
    <section className="mainnet-panel launch-wide"><h2>Transaction evidence</h2><p aria-live="polite">{message || 'Each step needs a separate MetaMask confirmation. Never share your seed phrase.'}</p><ul>{Object.entries(transactions).map(([label, hash]) => <li key={label}><a href={`${explorer}/tx/${hash}`} target="_blank" rel="noreferrer">{label} · {hash.slice(0, 12)}… ↗</a></li>)}</ul><p>After creating and activating the campaign, add its verified addresses and receipts to the public deployment manifest before submitting the grant.</p></section>
  </div>;
}
