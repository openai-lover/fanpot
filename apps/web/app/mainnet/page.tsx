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
  const live = await readCampaign();
  const phase = live ? Number(live.summary.phase) : -1;
  const now = Math.floor(Date.now() / 1000);
  return <main id="main" className="mainnet-page campaign-page" tabIndex={-1}>
    <Link href="/#projects" className="back-link">← All campaigns</Link>
    {live ? <>
      <section className="mainnet-campaign">
        <div className="mainnet-campaign-art"><Image src="/arc-demo/subway-display-idol-v2.jpg" width={1536} height={1024} alt="AI-generated LUMI station screen concept" priority sizes="(max-width: 750px) 100vw, 50vw" /><span>AI-generated concept</span></div>
        <div className="mainnet-campaign-copy">
          <div className="campaign-meta"><span>{phases[phase] ?? 'Unavailable'}</span><span>Arc Mainnet</span></div>
          <h1>LUMI birthday screen</h1>
          <p className="campaign-description">A birthday wish, larger than life.</p>
          <p className="campaign-context">Fictional campaign. No ad placement is booked.</p>
          <div className="campaign-total"><strong>{fmt(live.summary.totalContributed)} <span>USDC</span></strong><span>of {fmt(live.config.goal)} USDC goal</span></div>
          <div className="arc-progress" role="progressbar" aria-label="Campaign funding" aria-valuemin={0} aria-valuemax={Number(fmt(live.config.goal))} aria-valuenow={Number(fmt(live.summary.totalContributed))}><span style={{ width: `${Math.min(Number(live.summary.totalContributed * 100n / live.config.goal), 100)}%` }} /></div>
          <div className="campaign-timing"><span>{String(live.summary.supporterCount)} participating {live.summary.supporterCount === 1n ? 'wallet' : 'wallets'}</span><span>Closes {new Date(Number(live.config.deadline) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} UTC</span></div>
          <a href="#support" className="button campaign-cta">{phase === 1 ? 'Support this campaign' : 'View your contribution'}</a>
        </div>
      </section>
      <div className="mainnet-grid">
        <section className="mainnet-panel campaign-funds" id="funds"><h2>Funds & spending</h2><dl><div><dt>Raised</dt><dd>{fmt(live.summary.totalContributed)} USDC</dd></div><div><dt>Paid out</dt><dd>{fmt(live.summary.totalPaid)} USDC</dd></div><div><dt>Refunded</dt><dd>{fmt(live.summary.totalRefunded)} USDC</dd></div><div><dt>Payout limit</dt><dd>{fmt(live.allocation.cap)} USDC</dd></div></dl><ul className="campaign-assurances"><li>Funds stay in the campaign contract.</li><li>A separate reviewer wallet approves payouts.</li><li>Unused funds are claimable after settlement.</li></ul><a href={`https://explorer.arc.io/address/${live.campaign}`} target="_blank" rel="noreferrer">Campaign contract ↗</a></section>
        <MainnetSupport campaign={live.campaign} phase={phase} remaining={fmt(live.config.goal - live.summary.totalContributed)} deadline={Number(live.config.deadline)} settleBy={Number(live.config.settleBy)} fundingEnded={now >= Number(live.config.deadline)} settlementEnded={now >= Number(live.config.settleBy)} />
      </div>
      <div className="campaign-details">
        <details><summary>Campaign details</summary><div className="campaign-detail-body"><p>LUMI is a fictional artist. The organizer, reviewer and recipient wallets are controlled by FanPot’s builder. Contributions use real USDC; no advertising service is being purchased.</p><dl><div><dt>Organizer</dt><dd>{live.config.organizer}</dd></div><div><dt>Reviewer</dt><dd>{live.config.reviewer}</dd></div><div><dt>Recipient</dt><dd>{live.allocation.recipient}</dd></div></dl><h3>Funding terms</h3><p>Recipients and payout limits cannot be changed. If the goal is missed, supporters can claim their contribution after funding is finalized. After settlement, unused funds can be claimed proportionally. Refunds require a wallet transaction. Network fees are not refunded. The contracts have not been independently audited.</p><details className="technical-terms"><summary>Original onchain rules</summary><p>{MAINNET_RULES}</p><p className="rules-hash">{live.config.rulesHash}</p></details></div></details>
        <details id="activity"><summary>Transaction history</summary><div className="campaign-detail-body"><ul className="campaign-receipts">{Object.entries(deployment.transactions).map(([label, hash]) => <li key={label}><a href={`https://explorer.arc.io/tx/${hash}`} target="_blank" rel="noreferrer">{({ 'deploy-factory': 'Contract deployed', 'allow-organizer': 'Organizer approved', 'create-campaign': 'Campaign created', 'activate-campaign': 'Funding opened', 'contribute-campaign': 'Contribution received' } as Record<string, string>)[label] ?? label} <span>View receipt ↗</span></a></li>)}</ul><a href={`https://explorer.arc.io/address/${live.factory}`} target="_blank" rel="noreferrer">Factory contract ↗</a></div></details>
      </div>
    </> : <section className="mainnet-panel mainnet-pending"><h1>Campaign temporarily unavailable</h1><p>We couldn’t load the current funding record. Please try again shortly.</p><a href="/mainnet" className="outline-button">Try again</a></section>}
  </main>;
}
