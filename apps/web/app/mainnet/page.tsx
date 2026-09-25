import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient, formatUnits, getAddress, http, isAddress } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { MAINNET_PURPOSE_HASH, MAINNET_RULES, MAINNET_RULES_HASH } from '@fanpot/shared/mainnet-plan';
import { fanPotFactoryAbi } from '@fanpot/shared/abi/FanPotFactory';
import { fanPotCampaignAbi } from '@fanpot/shared/abi/FanPotCampaign';
import rawDeployment from '../../data/arc-mainnet-deployment.json';
import { MainnetSupport } from '../../components/mainnet-support';

export const dynamic = 'force-dynamic';
const client = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0], { timeout: 8000 }) });
const deployment: { factory: string | null; campaign: string | null; vendor: string | null; organizer: string; reviewer: string; transactions: Record<string, string> } = rawDeployment;
const phases = ['Awaiting review', 'Funding', 'Goal met', 'Paying', 'Refunds open', 'Closed'];
const fmt = (amount: bigint) => formatUnits(amount, 6);

async function readFactory() {
  if (!deployment.factory || !isAddress(deployment.factory)) return null;
  try {
    const factory = getAddress(deployment.factory);
    const [code, owner, reviewer, usdc] = await Promise.all([
      client.getCode({ address: factory }),
      client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'owner' }),
      client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'reviewer' }),
      client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'usdc' }),
    ]);
    if (!code || code === '0x' || owner.toLowerCase() !== deployment.organizer.toLowerCase() || reviewer.toLowerCase() !== deployment.reviewer.toLowerCase() || usdc.toLowerCase() !== ARC_USDC.toLowerCase()) return null;
    return factory;
  } catch { return null; }
}

async function readCampaign() {
  if (!deployment.factory || !deployment.campaign || !deployment.vendor || !isAddress(deployment.factory) || !isAddress(deployment.campaign)) return null;
  try {
    const factory = getAddress(deployment.factory), campaign = getAddress(deployment.campaign);
    const [chainId, factoryCode, campaignCode, registered, config, summary, allocation] = await Promise.all([
      client.getChainId(), client.getCode({ address: factory }), client.getCode({ address: campaign }),
      client.readContract({ address: factory, abi: fanPotFactoryAbi, functionName: 'isCampaign', args: [campaign] }),
      client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getConfig' }),
      client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getSummary' }),
      client.readContract({ address: campaign, abi: fanPotCampaignAbi, functionName: 'getAllocation', args: [0] }),
    ]);
    if (chainId !== 5042 || !factoryCode || !campaignCode || !registered || config.usdc.toLowerCase() !== ARC_USDC.toLowerCase() || config.organizer.toLowerCase() !== deployment.organizer.toLowerCase() || config.reviewer.toLowerCase() !== deployment.reviewer.toLowerCase() || config.goal !== 2_000_000n || config.rulesHash !== MAINNET_RULES_HASH || allocation.recipient.toLowerCase() !== deployment.vendor.toLowerCase() || allocation.cap !== 1_000_000n || allocation.purposeHash !== MAINNET_PURPOSE_HASH) return null;
    return { factory, campaign, config, summary, allocation };
  } catch { return null; }
}

export default async function MainnetPage() {
  const [live, verifiedFactory] = await Promise.all([readCampaign(), readFactory()]);
  const phase = live ? Number(live.summary.phase) : -1;
  return <main id="main" className="mainnet-page" tabIndex={-1}>
    <Link href="/" className="back-link">← Back to FanPot</Link>
    <span className="eyebrow">ARC MAINNET · ONCHAIN PROOF OF CONCEPT</span>
    <h1>Fan plans with visible fund rules</h1>
    <p className="mainnet-lead">FanPot holds USDC in a campaign contract on Arc Mainnet. Payouts have fixed caps and need a separate reviewer; supporters can claim eligible refunds. The LUMI example is fictional, with no real ad booked or delivered.</p>
    {live ? <>
      <section className="mainnet-campaign"><div className="mainnet-campaign-art"><Image src="/arc-demo/subway-display-idol-v2.jpg" width={1536} height={1024} alt="AI-generated mockup of fictional adult artist LUMI on a proposed station screen; no screen was booked" priority sizes="(max-width: 750px) 100vw, 50vw" /><span>AI-GENERATED CONCEPT · NO AD BOOKED</span></div><div className="mainnet-campaign-copy"><span className="small-pill">{phases[phase] ?? 'Unknown'} · ARC MAINNET</span><h2>LUMI birthday screen</h2><p>A 2 USDC onchain demonstration. One simulated vendor payout is capped at 1 USDC. Unspent funds become claimable after settlement.</p><div className="mainnet-amount"><strong>{fmt(live.summary.totalContributed)} / {fmt(live.config.goal)} USDC</strong><span>{String(live.summary.supporterCount)} onchain supporters</span></div><div className="arc-progress"><span style={{ width: `${Math.min(Number(live.summary.totalContributed * 100n / live.config.goal), 100)}%` }} /></div><p>Funding closes {new Date(Number(live.config.deadline) * 1000).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })} UTC.</p></div></section>
      <div className="mainnet-grid"><section className="mainnet-panel"><h2>Live fund record</h2><dl><div><dt>Contributed</dt><dd>{fmt(live.summary.totalContributed)} USDC</dd></div><div><dt>Paid to simulated vendor</dt><dd>{fmt(live.summary.totalPaid)} USDC</dd></div><div><dt>Refunded</dt><dd>{fmt(live.summary.totalRefunded)} USDC</dd></div><div><dt>Vendor cap</dt><dd>{fmt(live.allocation.cap)} USDC</dd></div><div><dt>Phase</dt><dd>{phases[phase] ?? 'Unknown'}</dd></div></dl><a href={`https://explorer.arc.io/address/${live.campaign}`} target="_blank" rel="noreferrer">Campaign contract ↗</a><br/><a href={`https://explorer.arc.io/address/${live.factory}`} target="_blank" rel="noreferrer">Factory contract ↗</a></section><MainnetSupport campaign={live.campaign} phase={phase} remaining={fmt(live.config.goal - live.summary.totalContributed)} deadline={Number(live.config.deadline)} settleBy={Number(live.config.settleBy)} /></div>
      <section className="mainnet-panel mainnet-proof"><h2>Fixed contract rules</h2><p>{MAINNET_RULES}</p><p>The organizer and reviewer are separate wallets. Recipient, budget cap, deadline and rules hash are fixed when the campaign is created. A payout needs a request and reviewer approval. This contract has no platform fee or admin sweep.</p><dl><div><dt>Organizer</dt><dd>{live.config.organizer}</dd></div><div><dt>Reviewer</dt><dd>{live.config.reviewer}</dd></div><div><dt>Simulated vendor</dt><dd>{live.allocation.recipient}</dd></div><div><dt>Rules hash</dt><dd>{live.config.rulesHash}</dd></div></dl><p>These wallets are controlled by the project builder for this demonstration. The images and scenario are fictional; onchain transactions are real.</p><h3>Verify the build</h3><p><a href="https://github.com/openai-lover/fanpot" target="_blank" rel="noreferrer">Public source repository ↗</a> · <a href="https://github.com/openai-lover" target="_blank" rel="noreferrer">Builder profile ↗</a></p><ul>{Object.entries(deployment.transactions).map(([label, hash]) => <li key={label}><a href={`https://explorer.arc.io/tx/${hash}`} target="_blank" rel="noreferrer">{label.replaceAll('-', ' ')} ↗</a></li>)}</ul></section>
    </> : <section className="mainnet-panel mainnet-pending"><h2>Mainnet campaign is being prepared</h2>{verifiedFactory ? <p>The factory is deployed and its owner, reviewer and USDC configuration match the published plan. <a href={`https://explorer.arc.io/address/${verifiedFactory}`} target="_blank" rel="noreferrer">Inspect the factory ↗</a> <a href={`https://explorer.arc.io/tx/${deployment.transactions['deploy-factory']}`} target="_blank" rel="noreferrer">Deployment receipt ↗</a></p> : null}<p>No verified FanPot campaign is published here yet. This page will show live campaign data after creation, reviewer activation and a contribution have been checked and recorded.</p><Link href="/launch" className="outline-button">Deployment setup</Link></section>}
    <p className="mainnet-footnote">Arc uses USDC for gas. Native and ERC-20 views are the same balance. Contributions are real and may remain locked until campaign settlement. Testnet USDC cannot be used here.</p>
  </main>;
}
