import Link from 'next/link';
import { MainnetPayout } from '../../../components/mainnet-payout';

export default function ManageMainnetPage() {
  return <main id="main" className="mainnet-page" tabIndex={-1}>
    <Link href="/mainnet" className="back-link">← Campaign</Link>
    <h1>Payments & settlement</h1>
    <p className="mainnet-lead">Request a payment, review it with the designated reviewer wallet, then return the remaining funds to supporters.</p>
    <MainnetPayout />
  </main>;
}
