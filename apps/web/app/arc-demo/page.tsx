import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient, http, parseAbi } from 'viem';
import manifest from '../../data/arc-testnet-demo.json';
import { SupportAction } from '../../components/support-action';

export const dynamic = 'force-dynamic';
const chain = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: [manifest.rpc] } } } as const;
const client = createPublicClient({ chain, transport: http(manifest.rpc) });
const abi = parseAbi(['function totalContributed() view returns (uint256)', 'function totalPaid() view returns (uint256)', 'function totalRefunded() view returns (uint256)', 'function supporterCount() view returns (uint256)', 'function phase() view returns (uint8)', 'function outcome() view returns (uint8)']);
const value = (amount: bigint) => (Number(amount) / 1_000_000).toFixed(2);
const link = (hash: string) => `${manifest.explorer}/tx/${hash}`;
async function stats(address: `0x${string}`) {
  const [raised, paid, refunded, supporters, phase, outcome] = await Promise.all([
    client.readContract({ address, abi, functionName: 'totalContributed' }),
    client.readContract({ address, abi, functionName: 'totalPaid' }),
    client.readContract({ address, abi, functionName: 'totalRefunded' }),
    client.readContract({ address, abi, functionName: 'supporterCount' }),
    client.readContract({ address, abi, functionName: 'phase' }),
    client.readContract({ address, abi, functionName: 'outcome' }),
  ]);
  return { raised, paid, refunded, supporters, phase, outcome };
}
export default async function ArcDemo() {
  const ad = manifest.campaigns.advertising;
  const merch = manifest.campaigns.merch;
  const cafe = manifest.campaigns.cafe;
  const cancelled = manifest.campaigns.cancelled;
  const [ads, goods, cafeStats, cancelledStats] = await Promise.all([stats(ad.address as `0x${string}`), stats(merch.address as `0x${string}`), stats(cafe.address as `0x${string}`), stats(cancelled.address as `0x${string}`)]);
  return <main id="main" className="arc-demo" tabIndex={-1}>
    <Link href="/" className="back-link">← Back to FanPot</Link>
    <div className="preview-banner">Testnet campaigns · Test tokens only</div>
    <h1>Made for shared moments.</h1>
    <p className="arc-lead">Fictional campaigns with AI-generated imagery. All contributions come from test wallets; no ads, goods or events are booked.</p>
    <figure className="arc-artist-intro"><Image src="/arc-demo/lumi-candid-v3.jpg" width={1536} height={1024} alt="AI-generated candid studio photo of fictional adult performer LUMI smiling in motion" priority sizes="(max-width: 750px) 100vw, 360px"/><figcaption><span className="small-pill">Fictional artist</span><strong>LUMI</strong><span>Birthday wishes, in every form.</span></figcaption></figure>
    <div className="arc-grid">
      <article className="arc-card" id="ad-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/subway-display-idol-v2.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI portrait on a proposed subway screen; no placement was booked" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Station screen concept</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/ad-artwork-idol-v2.jpg" width={1536} height={1024} alt="AI-generated artwork featuring fictional adult performer LUMI" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Campaign artwork</figcaption></figure></div>
        <span className="small-pill">{ads.phase === 1 ? 'Funding · Testnet' : 'Funding closed · Testnet'}</span>
        <h2>LUMI birthday screen</h2>
        <p>A birthday message for the daily commute. Display budget: 8 test USDC. Print budget: 1 test USDC.</p>
        <div className="arc-metric"><strong>{value(ads.raised)} / 10.00 USDC</strong><span>{String(ads.supporters)} test wallets · {ads.phase === 1 ? 'Funding' : 'State changed'}</span></div>
        <div className="arc-progress"><span style={{ width: `${Math.min(Number(ads.raised) / 100_000, 100)}%` }} /></div>
        <SupportAction address={ad.address as `0x${string}`} active={ads.phase === 1} remaining={10_000_000n - ads.raised} />
        <p className="arc-note">Contributions use testnet USDC.</p>
        <details className="arc-records"><summary>Funds & transactions</summary><a className="arc-link" href={`${manifest.explorer}/address/${ad.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['contribute-ad-fanA-1'])} target="_blank" rel="noreferrer">Contribution A ↗</a>
        <a className="arc-link" href={link(manifest.transactions['contribute-ad-fanB-1'])} target="_blank" rel="noreferrer">Contribution B ↗</a>
      </details>
      </article>
      <article className="arc-card" id="goods-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/goods-mockup-idol-v2.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI portrait photocards and cupsleeves; none were printed" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Photocard & cupsleeve concept</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/cafe-concept-candid-v3.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI birthday café poster with a smiling candid pose; no event took place" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Café display concept</figcaption></figure></div>
        <span className="small-pill">Settled · Testnet</span>
        <h2>LUMI fan-made goods</h2>
        <p>Photocards made to share. 9 test USDC paid out and 1 returned to contributors.</p>
        <div className="arc-metric"><strong>{value(goods.raised)} / 10.00 USDC</strong><span>{String(goods.supporters)} test wallets · {goods.phase === 5 ? 'Closed' : 'State changed'}</span></div>
        <div className="arc-funds"><div>Vendor payout <strong>{value(goods.paid)} USDC</strong></div><div>Supporter refunds <strong>{value(goods.refunded)} USDC</strong></div></div>
        <details className="arc-records"><summary>Funds & transactions</summary><a className="arc-link" href={`${manifest.explorer}/address/${merch.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['pay-merch-print'])} target="_blank" rel="noreferrer">Print allocation payout ↗</a>
        <a className="arc-link" href={link(manifest.transactions['pay-merch-display'])} target="_blank" rel="noreferrer">Display allocation payout ↗</a>
        <a className="arc-link" href={link(manifest.transactions['refund-merch-fan-a'])} target="_blank" rel="noreferrer">Supporter refund A ↗</a>
      </details>
      </article>
      <article className="arc-card" id="cafe-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/cafe-concept-candid-v3.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI birthday café poster with a smiling candid pose, not a real event" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Birthday café concept</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/goods-mockup-idol-v2.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI photocard set, not an actual print order" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Photocard concept</figcaption></figure></div>
        <span className="small-pill">Settled · Testnet</span>
        <h2>LUMI birthday café</h2>
        <p>A place to share birthday wishes. 8 test USDC paid out; the unused 2 returned to contributors.</p>
        <div className="arc-metric"><strong>{value(cafeStats.raised)} / 10.00 USDC</strong><span>{String(cafeStats.supporters)} test wallets · {cafeStats.phase === 5 ? 'Closed' : 'State changed'}</span></div>
        <div className="arc-funds"><div>Paid out <strong>{value(cafeStats.paid)} USDC</strong></div><div>Refunded <strong>{value(cafeStats.refunded)} USDC</strong></div></div>
        <details className="arc-records"><summary>Funds & transactions</summary><a className="arc-link" href={`${manifest.explorer}/address/${cafe.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['skip-cafe-signage'])} target="_blank" rel="noreferrer">Optional signage skipped ↗</a>
        <a className="arc-link" href={link(manifest.transactions['refund-cafe-fan-c'])} target="_blank" rel="noreferrer">Unused funds returned ↗</a>
      </details>
      </article>
      <article className="arc-card" id="cancelled-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/bus-shelter-idol-v2.jpg" width={1536} height={1024} alt="AI-generated fictional LUMI portrait on an unbooked bus shelter ad concept" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Bus shelter concept</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/ad-artwork-idol-v2.jpg" width={1536} height={1024} alt="AI-generated artwork of fictional adult performer LUMI" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Campaign artwork</figcaption></figure></div>
        <span className="small-pill">Refunded · Testnet</span>
        <h2>LUMI bus shelter proposal</h2>
        <p>A brighter way home. Funding closed at 5 of 8 test USDC, with all contributions refunded.</p>
        <div className="arc-metric"><strong>{value(cancelledStats.raised)} / 8.00 USDC</strong><span>{String(cancelledStats.supporters)} test wallets · {cancelledStats.outcome === 3 ? 'Cancelled' : 'State changed'}</span></div>
        <div className="arc-funds"><div>Vendor payout <strong>{value(cancelledStats.paid)} USDC</strong></div><div>Supporter refunds <strong>{value(cancelledStats.refunded)} USDC</strong></div></div>
        <details className="arc-records"><summary>Funds & transactions</summary><a className="arc-link" href={`${manifest.explorer}/address/${cancelled.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['stop-cancelled'])} target="_blank" rel="noreferrer">Funding stopped ↗</a>
        <a className="arc-link" href={link(manifest.transactions['refund-cancelled-fan-d'])} target="_blank" rel="noreferrer">Full refund confirmed ↗</a>
      </details>
      </article>
    </div>
    <section className="concept-card" id="vanta5-concept"><div className="concept-card-copy"><span className="small-pill">Not open for funding</span><h2>VANTA5 anniversary photobook</h2><p>A keepsake for another year together. Fictional group and AI-generated artwork; this concept is not accepting contributions.</p></div><div className="concept-card-images"><Image src="/arc-demo/vanta5-photobook-concept-v1.jpg" width={1536} height={1024} alt="AI-generated daylight studio scene of fictional adult male group VANTA5 with photobook sample" sizes="(max-width: 750px) 100vw, 50vw"/><Image src="/arc-demo/vanta5-rooftop-concept-v1.jpg" width={1536} height={1024} alt="AI-generated rooftop editorial photo of fictional adult male group VANTA5" sizes="(max-width: 750px) 100vw, 50vw"/></div></section>

  </main>;
}
