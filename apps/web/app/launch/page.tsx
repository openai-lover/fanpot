import Link from 'next/link';
import { MainnetLaunch } from '../../components/mainnet-launch';

export default function LaunchPage() {
  return <main id="main" className="mainnet-page" tabIndex={-1}>
    <Link href="/mainnet" className="back-link">← Campaign</Link>

    <h1>Campaign setup</h1>
    <p className="mainnet-lead">For the organizer and reviewer. Each action requires a wallet confirmation and uses real USDC for network fees.</p>
    <MainnetLaunch />
  </main>;
}
