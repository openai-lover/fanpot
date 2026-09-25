import Link from 'next/link';
import { MainnetLaunch } from '../../components/mainnet-launch';

export default function LaunchPage() {
  return <main id="main" className="mainnet-page" tabIndex={-1}>
    <Link href="/mainnet" className="back-link">← Arc Mainnet</Link>
    <span className="eyebrow">ARC MAINNET · DEMO SETUP</span>
    <h1>Launch the proof of concept</h1>
    <p className="mainnet-lead">This page sends real Arc Mainnet transactions only after you confirm each one in your wallet. The organizer deploys a factory and creates one small fictional campaign. A separate reviewer activates it. Save each transaction link as evidence.</p>
    <MainnetLaunch />
  </main>;
}
