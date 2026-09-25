import Link from 'next/link';
import { createPublicClient, http, parseAbi } from 'viem';
import { ARC_USDC, fanpotArc } from '@fanpot/shared/chain';
import { MainnetWallet } from '../../components/mainnet-wallet';

export const dynamic = 'force-dynamic';

const client = createPublicClient({ chain: fanpotArc, transport: http(fanpotArc.rpcUrls.default.http[0], { timeout: 8000 }) });
const usdcAbi = parseAbi(['function decimals() view returns (uint8)']);

async function readMainnetStatus() {
  try {
    const [chainId, block, decimals, code] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
      client.readContract({ address: ARC_USDC, abi: usdcAbi, functionName: 'decimals' }),
      client.getCode({ address: ARC_USDC }),
    ]);
    if (chainId !== 5042 || decimals !== 6 || !code || code === '0x') throw Error('Unexpected network or USDC contract');
    return { connected: true, block: block.toString() };
  } catch {
    return { connected: false, block: null };
  }
}

export default async function MainnetPage() {
  const status = await readMainnetStatus();
  return <main id="main" className="mainnet-page" tabIndex={-1}>
    <Link href="/" className="back-link">← Back to FanPot</Link>
    <span className="eyebrow">ARC MAINNET · READ-ONLY CONNECTION</span>
    <h1>Arc Mainnet connection</h1>
    <p className="mainnet-lead">FanPot can read Arc Mainnet and your wallet&apos;s USDC balance. The campaign contracts on this site are still testnet examples. No FanPot Mainnet campaign is deployed, so Mainnet contributions are unavailable.</p>
    <div className="mainnet-grid">
      <section className="mainnet-panel" aria-labelledby="network-status-heading">
        <h2 id="network-status-heading">Network status</h2>
        <div className="mainnet-status"><span className={status.connected ? 'status-dot is-connected' : 'status-dot'} />{status.connected ? 'Arc Mainnet verified' : 'Arc Mainnet RPC unavailable'}</div>
        <dl><div><dt>Chain ID</dt><dd>5042</dd></div><div><dt>USDC interface</dt><dd>{status.connected ? 'Verified · 6 decimals' : 'Not verified'}</dd></div><div><dt>Latest checked block</dt><dd>{status.block ?? 'Unavailable'}</dd></div></dl>
        <a href="https://explorer.arc.io" target="_blank" rel="noreferrer">Open Arc Explorer ↗</a>
      </section>
      <MainnetWallet />
    </div>
    <p className="mainnet-footnote">This page makes read-only RPC calls. Connecting a wallet may ask to show your address or switch networks; it does not request a signature, token approval, or payment. Testnet USDC cannot be used on Mainnet.</p>
  </main>;
}
