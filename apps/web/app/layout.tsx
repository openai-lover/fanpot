import type { Metadata } from 'next';
import '@fontsource-variable/noto-sans-kr';
import './globals.css';
import { Shell } from '../components/shell';
import mainnetDeployment from '../data/arc-mainnet-deployment.json';
const mainnetLive = Boolean(mainnetDeployment.factory && mainnetDeployment.campaign);
export const metadata: Metadata = { title: 'FanPot — A little love, together', description: mainnetLive ? 'Fan campaign USDC escrow prototype on Arc Mainnet, with fixed payout caps, separate review and claimable refunds.' : 'Fan-led birthday projects with clear funding, spending and refund rules. Development preview.', icons: { icon: '/fanpot-logo.png', apple: '/fanpot-logo.png' }, robots: { index: mainnetLive, follow: mainnetLive } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }
