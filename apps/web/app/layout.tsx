import type { Metadata } from 'next';
import '@fontsource-variable/noto-sans-kr';
import './globals.css';
import { Shell } from '../components/shell';
export const metadata: Metadata = { title: 'FanPot — A little love, together', description: 'Fan-led birthday projects with clear funding, spending and refund rules. Development preview.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }
