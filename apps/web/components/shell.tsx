'use client';
import Link from 'next/link';
import Image from 'next/image';
import { createContext, useContext } from 'react';
import { ArrowUpRight, Heart, LockKeyhole, ClipboardCheck, RotateCcw, ArrowLeft, Check, CircleHelp } from 'lucide-react';
import en from '../messages/en.json';
import mainnetDeployment from '../data/arc-mainnet-deployment.json';
import { HomeStory } from './home-story';
const I18n = createContext({ messages: en });
const mainnetLive = Boolean(mainnetDeployment.factory && mainnetDeployment.campaign);
export function Shell({ children }: { children: React.ReactNode }) {
  return <I18n.Provider value={{ messages: en }}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header"><div className="nav-wrap"><Link className="brand" href="/" aria-label="FanPot home"><Logo /></Link>
      <nav aria-label="Main navigation"><Link href="/#projects">Campaigns</Link><Link href="/#rules">How it works</Link><Link href="/me">My support</Link></nav></div></header>
    {children}
    <footer><div><Link href="/" className="brand small" aria-label="FanPot home"><Logo /></Link><p>Made for the moments fans make.</p></div><div className="footer-links"><Link href="/mainnet#funds">Funds & spending</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><span className="copyright">© 2026 FanPot</span></footer>
  </I18n.Provider>;
}
function Logo() { return <span className="brand-wordmark">fanpot</span>; }
export function RulesCard() {
  const { messages: m } = useContext(I18n);
  return <section className="rules" id="rules"><div className="section-title"><h2>{m.rulesTitle}</h2><p>{m.rulesSub}</p></div><div className="rule-grid">{[LockKeyhole, ClipboardCheck, RotateCcw].map((Icon, i) => <article key={i}><span className={`rule-icon color-${i}`}><Icon size={23} strokeWidth={1.75}/></span><h3>{m[`rule${i + 1}` as keyof typeof m]}</h3><p>{m[`rule${i + 1}Body` as keyof typeof m]}</p></article>)}</div></section>;
}
export function Poster({ compact = false }: { compact?: boolean }) { return <div className={`poster ${compact ? 'compact' : ''}`} role="img" aria-label="Original typographic poster for fictional artist LUMI"><span className="poster-top">TO OUR LITTLE UNIVERSE</span><span className="poster-orbit"/><span className="poster-star one">✦</span><span className="poster-star two">✧</span><span className="poster-name">LUMI</span><span className="poster-hand">you make our days brighter.</span><span className="poster-bottom">BIRTHDAY LIGHTS <span>WITH LOVE, TOGETHER</span></span></div>; }
const featuredProjects = [
  { id: 'vanta5-concept', image: '/arc-demo/vanta5-photobook-concept-v1.jpg', category: 'Anniversary photobook', title: 'VANTA5, another year together', description: 'Five voices. A year of moments to keep.', alt: 'AI-generated photo of fictional male idol group VANTA5 gathered around a photobook', status: 'Not open for funding' },
  { id: 'goods-campaign', image: '/arc-demo/goods-mockup-idol-v2.jpg', category: 'Fan-made goods', title: 'A little LUMI to keep', description: 'Photocards made to be shared.', alt: 'Generated LUMI photocard and cupsleeve concept' },
  { id: 'cafe-campaign', image: '/arc-demo/cafe-concept-candid-v3.jpg', category: 'Birthday café', title: 'Meet over a birthday wish', description: 'A café moment for the whole fandom.', alt: 'Generated concept of a fictional LUMI birthday café' },
  { id: 'cancelled-campaign', image: '/arc-demo/bus-shelter-idol-v2.jpg', category: 'Birthday ad', title: 'A brighter way home', description: 'A bus shelter project with a full refund record.', alt: 'Generated concept of an unbooked LUMI bus shelter ad' },
];
export function Home() {
  return <main id="main" tabIndex={-1} className="home-main">
    <HomeStory/>
    <div className="home-content">
      <section className="projects-section" id="projects">
        <div className="section-heading"><div><h2>Find your next moment.</h2><p>Birthday screens, fan-made goods and places to come together.</p></div></div>
        <div className="campaign-teasers">
          {mainnetLive && <Link className="campaign-teaser" href="/mainnet"><div className="campaign-teaser-image"><Image src="/arc-demo/subway-display-idol-v2.jpg" width={1536} height={1024} alt="Generated LUMI station display concept" sizes="(max-width: 750px) 100vw, 50vw"/><span>Arc Mainnet · Fictional campaign</span></div><div className="campaign-teaser-copy"><span className="eyebrow">Birthday ad</span><h3>LUMI birthday screen</h3><p>A birthday wish, funded together.</p><strong>View campaign <ArrowUpRight size={16}/></strong></div></Link>}
          {featuredProjects.map((project) => <Link className="campaign-teaser" href={`/arc-demo#${project.id}`} key={project.id}><div className="campaign-teaser-image"><Image src={project.image} width={1536} height={1024} alt={project.alt} sizes="(max-width: 750px) 100vw, 50vw"/><span>{project.status ?? 'Testnet'}</span></div><div className="campaign-teaser-copy"><span className="eyebrow">{project.category}</span><h3>{project.title}</h3><p>{project.description}</p><strong>{project.status ? 'View project' : 'View campaign'} <ArrowUpRight size={16}/></strong></div></Link>)}
        </div>
        <p className="campaign-disclosure">Fictional artists and AI-generated imagery. Testnet campaigns use test tokens; no ads, goods or events are booked.</p>
      </section>
      <RulesCard/>
    </div>
  </main>;
}

export function CampaignPreview() {
  const { messages: m } = useContext(I18n);
  return <main id="main" tabIndex={-1} className="detail"><Link className="back-link" href="/"><ArrowLeft size={16}/>{m.back}</Link><div className="preview-banner"><CircleHelp size={18}/><span>{m.previewNote}</span></div><div className="detail-grid"><div><Poster/><div className="project-intro"><span className="small-pill">{m.previewLabel}</span><p className="eyebrow">{m.projectType}</p><h1>{m.projectTitle}</h1><p>{m.organizer}</p></div><section className="content-block"><h2>{m.storyTitle}</h2><p>{m.story}</p></section><section className="content-block"><h2>{m.budget}</h2><div className="budget-row"><span><span className="budget-number">01</span>{m.ad}</span><strong>8 USDC</strong></div><div className="budget-row"><span><span className="budget-number">02</span>{m.cafe}</span><strong>1 USDC</strong></div><div className="budget-row reserve"><span>{m.reserved}</span><strong>1 USDC</strong></div></section><section className="content-block"><h2>{m.supporters}</h2><p>{m.noSupporters}</p></section><section className="content-block" id="updates"><h2>{m.updates}</h2><p>{m.noUpdates}</p></section><details className="content-block ledger" id="funds"><summary>{m.ledger}</summary><p>{m.noLedger}</p></details></div><aside className="funding-panel"><span className="small-pill">{m.notStarted}</span><p className="muted">{m.plannedGoal}</p><div className="goal">10.00 <span>USDC</span></div><p className="subtle">{m.noFigures}</p><button className="button" disabled aria-describedby="support-unavailable"><Heart size={18}/>{m.support}</button><p id="support-unavailable" className="disabled-reason">{m.notReady}</p><div className="mini-rules">{[m.rule1, m.rule2, m.rule3].map(text => <p key={text}><Check size={17}/>{text}</p>)}</div><p className="privacy-note">{m.privacyHint}</p></aside></div><RulesCard/></main>;
}
export function Information({ kind }: { kind: 'me' | 'proof' | 'help' | 'privacy' | 'terms' }) {
  const content = {
    me: { title: 'Your contributions', body: 'Connect your wallet on a campaign to see what you’ve contributed and claim available refunds.' },
    proof: { title: 'Funds & spending', body: 'Follow contributions, payouts and refunds in the campaign’s transaction history.' },
    help: { title: 'A little help.', body: 'Choose a campaign, enter an amount and confirm in MetaMask. Use USDC on the network shown on the campaign.' },
    privacy: { title: 'Your privacy', body: 'We don’t ask for your name or social handles. Wallet addresses and transactions are public on Arc and may be linked to your identity through other public information.' },
    terms: { title: 'Before you contribute', body: 'Mainnet contributions and network fees use real USDC. Testnet campaigns use test tokens. Funds may remain locked until settlement. Refunds depend on the campaign rules and require a claim transaction. Network fees are not refunded. FanPot charges no platform fee.' },
  }[kind];
  return <main id="main" tabIndex={-1} className="info-page service-info"><h1>{content.title}</h1><p>{content.body}</p>
    {kind === 'help' && <div className="help-answers"><details><summary>Why does my wallet ask twice?</summary><p>The first transaction sets a spending limit. The second contributes that amount to the campaign.</p></details><details><summary>How do refunds work?</summary><p>If a campaign misses its goal, you can claim your contribution after funding is finalized. After settlement, unused funds are returned proportionally when you claim. Open the campaign and connect the wallet you used.</p></details><details><summary>Which USDC should I use?</summary><p>Match the network shown on the campaign. Arc Mainnet uses real USDC for contributions and network fees. Testnet campaigns only accept test tokens. Use the contribution button; don’t transfer directly to a contract address.</p></details></div>}
    {kind === 'terms' && <p>Campaigns currently shown use fictional artists and AI-generated images. No ad, goods or event is being purchased. The Mainnet campaign wallets are controlled by FanPot’s builder. Funding a campaign does not guarantee delivery. The contracts have not been independently audited.</p>}
    <Link href={kind === 'me' || kind === 'proof' ? '/mainnet#support' : '/#projects'} className="outline-button">{kind === 'me' ? 'View your contribution' : 'Explore campaigns'}<ArrowUpRight size={18}/></Link>
  </main>;
}
