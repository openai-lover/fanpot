import type { Metadata } from 'next';
import '@fontsource-variable/noto-sans-kr';
import './globals.css';
import './home-story.css';
import './service.css';
import { Shell } from '../components/shell';
import mainnetDeployment from '../data/arc-mainnet-deployment.json';
const mainnetLive = Boolean(mainnetDeployment.factory && mainnetDeployment.campaign);
export const metadata: Metadata = { title: 'FanPot — Made of fan love.', description: 'Fund fan-led ads and goods together, with shared USDC funds, clear budgets, reviewed payouts and claimable refunds.', icons: { icon: '/fanpot-logo.png', apple: '/fanpot-logo.png' }, robots: { index: mainnetLive, follow: mainnetLive } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }
