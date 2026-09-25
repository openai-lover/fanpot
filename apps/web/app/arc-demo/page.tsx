import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient, http, parseAbi } from 'viem';
import manifest from '../../data/arc-testnet-demo.json';
import { SupportAction } from '../../components/support-action';

export const dynamic = 'force-dynamic';
const chain = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: [manifest.rpc] } } } as const;
const client = createPublicClient({ chain, transport: http(manifest.rpc) });
const abi = parseAbi(['function totalContributed() view returns (uint256)', 'function totalPaid() view returns (uint256)', 'function totalRefunded() view returns (uint256)', 'function supporterCount() view returns (uint256)', 'function phase() view returns (uint8)']);
const value = (amount: bigint) => (Number(amount) / 1_000_000).toFixed(2);
const link = (hash: string) => `${manifest.explorer}/tx/${hash}`;
async function stats(address: `0x${string}`) {
  const [raised, paid, refunded, supporters, phase] = await Promise.all([
    client.readContract({ address, abi, functionName: 'totalContributed' }),
    client.readContract({ address, abi, functionName: 'totalPaid' }),
    client.readContract({ address, abi, functionName: 'totalRefunded' }),
    client.readContract({ address, abi, functionName: 'supporterCount' }),
    client.readContract({ address, abi, functionName: 'phase' }),
  ]);
  return { raised, paid, refunded, supporters, phase };
}
export default async function ArcDemo() {
  const ad = manifest.campaigns.advertising;
  const merch = manifest.campaigns.merch;
  const [ads, goods] = await Promise.all([stats(ad.address as `0x${string}`), stats(merch.address as `0x${string}`)]);
  return <main id="main" className="arc-demo" tabIndex={-1}>
    <Link href="/" className="back-link">← Back to FanPot</Link>
    <div className="preview-banner">ARC TESTNET · Fictional campaign simulation · No artist affiliation, fan purchases, vendor orders, or real-world delivery.</div>
    <h1>From fan idea to verifiable fund flow</h1>
    <p className="arc-lead">Inspired by K-pop fan birthday ads and fan-made goods. Two labelled demo wallets simulate supporters. All USDC amounts are small testnet examples, not real advertising or print quotes.</p>
    <div className="arc-grid">
      <article className="arc-card" id="ad-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/subway-display.jpg" width={1536} height={1024} alt="Generated visual concept of a LUMI birthday advertisement on a subway screen; no placement has been booked" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Proposed subway screen · generated mockup, not installed</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/ad-artwork.jpg" width={1536} height={1024} alt="Generated original lavender LUMI Birthday Lights campaign artwork" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Original ad artwork concept</figcaption></figure></div>
        <span className="small-pill">LIVE FUNDING · TESTNET</span>
        <h2>LUMI birthday screen</h2>
        <p>Original artwork for a proposed Hongdae station screen. A display vendor would receive up to 8 USDC; a poster printer up to 1 USDC. The remaining 1 USDC is refundable after settlement.</p>
        <div className="arc-metric"><strong>{value(ads.raised)} / 10.00 USDC</strong><span>{String(ads.supporters)} simulated supporters · {ads.phase === 1 ? 'Funding' : 'State changed'}</span></div>
        <div className="arc-progress"><span style={{ width: `${Math.min(Number(ads.raised) / 100_000, 100)}%` }} /></div>
        <SupportAction address={ad.address as `0x${string}`} active={ads.phase === 1} remaining={10_000_000n - ads.raised} />
        <p className="arc-note">Supporting with your own wallet makes a real Arc Testnet transaction. Use testnet USDC only.</p>
        <a className="arc-link" href={`${manifest.explorer}/address/${ad.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['contribute-ad-fanA-1'])} target="_blank" rel="noreferrer">Simulated fan contribution A ↗</a>
        <a className="arc-link" href={link(manifest.transactions['contribute-ad-fanB-1'])} target="_blank" rel="noreferrer">Simulated fan contribution B ↗</a>
      </article>
      <article className="arc-card" id="goods-campaign">
        <div className="arc-gallery"><figure className="arc-gallery-primary"><Image src="/arc-demo/goods-mockup.jpg" width={1536} height={1024} alt="Generated concept mockup of LUMI cupsleeves, photocards and a birthday postcard; none were printed" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Proposed printed goods · generated mockup, not produced</figcaption></figure><figure className="arc-gallery-secondary"><Image src="/arc-demo/cafe-concept.jpg" width={1536} height={1024} alt="Generated fictional birthday café display concept with fan-made LUMI goods; no café event took place" sizes="(max-width: 750px) 100vw, 50vw"/><figcaption>Possible birthday café display concept</figcaption></figure></div>
        <span className="small-pill">SETTLED · TESTNET</span>
        <h2>LUMI fan-made goods</h2>
        <p>Original cupsleeve and photocard concept. This example traces a completed 10 USDC test fund: 6 to a simulated printer, 3 to a simulated display vendor, and 1 returned to the two demo supporters.</p>
        <div className="arc-metric"><strong>{value(goods.raised)} / 10.00 USDC</strong><span>{String(goods.supporters)} simulated supporters · {goods.phase === 5 ? 'Closed' : 'State changed'}</span></div>
        <div className="arc-funds"><div>Vendor payout <strong>{value(goods.paid)} USDC</strong></div><div>Supporter refunds <strong>{value(goods.refunded)} USDC</strong></div></div>
        <a className="arc-link" href={`${manifest.explorer}/address/${merch.address}`} target="_blank" rel="noreferrer">View campaign contract ↗</a>
        <a className="arc-link" href={link(manifest.transactions['pay-merch-print'])} target="_blank" rel="noreferrer">Simulated print payout ↗</a>
        <a className="arc-link" href={link(manifest.transactions['pay-merch-display'])} target="_blank" rel="noreferrer">Simulated display payout ↗</a>
        <a className="arc-link" href={link(manifest.transactions['refund-merch-fan-a'])} target="_blank" rel="noreferrer">Supporter refund A ↗</a>
      </article>
    </div>
    <section className="arc-explainer"><h2>How this was modelled</h2><p>These are transparent test cases, not evidence that K-pop fans donated or that advertising or goods were ordered. The campaign contracts hold testnet USDC, cap payouts by purpose, require a separate reviewer to approve payouts, and return unused funds to supporters. The symbolic 10 USDC goals do not represent commercial prices.</p><p>Structure reference: <a href="https://dukplace.com/en/celeb/support" target="_blank" rel="noreferrer">DUKPLACE fan support ad guide ↗</a></p></section>
  </main>;
}
