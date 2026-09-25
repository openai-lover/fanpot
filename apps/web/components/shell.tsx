'use client';
import Link from 'next/link';
import Image from 'next/image';
import { createContext, useContext } from 'react';
import { ArrowUpRight, Heart, LockKeyhole, ClipboardCheck, RotateCcw, ArrowLeft, Check, CircleHelp } from 'lucide-react';
import en from '../messages/en.json';
import mainnetDeployment from '../data/arc-mainnet-deployment.json';
const I18n = createContext({ messages: en });
const mainnetLive = Boolean(mainnetDeployment.factory && mainnetDeployment.campaign);
export function Shell({ children }: { children: React.ReactNode }) {
  return <I18n.Provider value={{ messages: en }}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header"><div className="nav-wrap"><Link className="brand" href="/" aria-label="FanPot home"><Logo /></Link>
      <nav aria-label="Main navigation"><Link href="/#projects">Projects</Link><Link href="/mainnet">Arc Mainnet</Link><Link href="/arc-demo">Testnet demo</Link></nav></div></header>
    {children}
    <footer><div><Link href="/" className="brand small" aria-label="FanPot home"><Logo /></Link><p>{mainnetLive ? 'Arc Mainnet proof of concept · Fictional artist' : 'Arc Testnet demo · Fictional artists and campaigns'}</p></div><div className="footer-links"><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><span className="copyright">© 2026 FanPot · {mainnetLive ? 'Onchain prototype' : 'Development preview'}</span></footer>
  </I18n.Provider>;
}
function Logo() { return <Image src="/fanpot-logo.png" width={1312} height={1199} alt="" className="brand-logo" loading="eager" />; }
export function RulesCard() {
  const { messages: m } = useContext(I18n);
  return <section className="rules" id="rules"><div className="section-title"><span className="eyebrow">FUND CONTROLS</span><h2>{m.rulesTitle}</h2><p>{mainnetLive ? 'The Arc Mainnet prototype and testnet examples show each rule in a public contract.' : m.rulesSub}</p></div><div className="rule-grid">{[LockKeyhole, ClipboardCheck, RotateCcw].map((Icon, i) => <article key={i}><span className={`rule-icon color-${i}`}><Icon size={23} strokeWidth={1.75}/></span><h3>{m[`rule${i + 1}` as keyof typeof m]}</h3><p>{m[`rule${i + 1}Body` as keyof typeof m]}</p></article>)}</div></section>;
}
export function Poster({ compact = false }: { compact?: boolean }) { return <div className={`poster ${compact ? 'compact' : ''}`} role="img" aria-label="Original typographic poster for fictional artist LUMI"><span className="poster-top">TO OUR LITTLE UNIVERSE</span><span className="poster-orbit"/><span className="poster-star one">✦</span><span className="poster-star two">✧</span><span className="poster-name">LUMI</span><span className="poster-hand">you make our days brighter.</span><span className="poster-bottom">BIRTHDAY LIGHTS <span>WITH LOVE, TOGETHER</span></span></div>; }
const demoProjects = [
  { id: 'ad-campaign', image: '/arc-demo/subway-display-idol-v2.jpg', status: 'FUNDING · TESTNET', title: 'LUMI birthday screen', description: 'See live contributions and a purpose-capped ad budget.', alt: 'Generated concept of fictional performer LUMI on a proposed subway ad' },
  { id: 'vanta5-concept', image: '/arc-demo/vanta5-photobook-concept-v1.jpg', status: 'CONCEPT ONLY · NO FUNDING', title: 'VANTA5 anniversary photobook', description: 'A fictional boy-group idea for a future campaign. No contract or collection.', alt: 'AI-generated editorial photo of five fictional adult male performers' },
  { id: 'goods-campaign', image: '/arc-demo/goods-mockup-idol-v2.jpg', status: 'SETTLED · TESTNET', title: 'LUMI fan-made goods', description: 'See approved payouts and supporter refunds.', alt: 'Generated LUMI photocard and cupsleeve concept' },
  { id: 'cancelled-campaign', image: '/arc-demo/bus-shelter-idol-v2.jpg', status: 'CANCELLED · REFUNDED', title: 'LUMI bus shelter proposal', description: 'A cancelled test shows full contribution refunds.', alt: 'Generated concept of an unbooked LUMI bus shelter ad' },
];
export function Home() {
  const { messages: m } = useContext(I18n);
  return <main id="main" tabIndex={-1}>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">{mainnetLive ? 'FAN PROJECTS · ARC MAINNET PROTOTYPE' : m.eyebrow}</span><h1>{m.tagline}</h1><p>{mainnetLive ? 'Pool USDC in an Arc Mainnet campaign contract. Fixed payout caps, separate review, and claimable refunds make the fund rules visible to every supporter.' : m.intro}</p><div className="hero-actions"><Link className="button" href={mainnetLive ? '/mainnet' : '#projects'}>{mainnetLive ? 'Explore live campaign' : m.browse}<ArrowUpRight size={18}/></Link><a className="text-link" href="#rules">{m.how}<span>↗</span></a></div></div><div className="hero-art"><div className="art-label"><span/>FICTIONAL GROUP CONCEPT</div><div className="hero-mockup"><Image src="/arc-demo/vanta5-rooftop-concept-v1.jpg" width={1536} height={1024} alt="AI-generated photo of fictional adult boy group VANTA5 on a rooftop" priority sizes="(max-width: 600px) 88vw, 48vw" /></div></div></section>
    <RulesCard/>
    <section className="projects-section" id="projects"><div className="section-heading"><div><span className="eyebrow">CAMPAIGN EXAMPLES</span><h2>{mainnetLive ? 'Live proof and testnet scenarios' : m.projectHeading}</h2><p>All artists and images are fictional. Chain labels distinguish Mainnet transactions from Testnet simulations.</p></div></div><div className="campaign-teasers">{mainnetLive && <Link className="campaign-teaser" href="/mainnet"><div className="campaign-teaser-image"><Image src="/arc-demo/subway-display-idol-v2.jpg" width={1536} height={1024} alt="AI-generated LUMI station display mockup; no advertisement booked" sizes="(max-width: 750px) 100vw, 50vw"/><span>AI-GENERATED CONCEPT</span></div><div className="campaign-teaser-copy"><span className="small-pill">LIVE · ARC MAINNET</span><h3>LUMI birthday screen</h3><p>See real USDC escrow, live onchain totals and a fixed vendor budget.</p><strong>View live proof <ArrowUpRight size={16}/></strong></div></Link>}{demoProjects.map((project) => <Link className="campaign-teaser" href={`/arc-demo#${project.id}`} key={project.id}><div className="campaign-teaser-image"><Image src={project.image} width={1536} height={1024} alt={project.alt} sizes="(max-width: 750px) 100vw, 50vw"/><span>AI-GENERATED CONCEPT</span></div><div className="campaign-teaser-copy"><span className="small-pill">{project.status}</span><h3>{project.title}</h3><p>{project.description}</p><strong>View details <ArrowUpRight size={16}/></strong></div></Link>)}</div></section>
  </main>;
}
export function CampaignPreview() {
  const { messages: m } = useContext(I18n);
  return <main id="main" tabIndex={-1} className="detail"><Link className="back-link" href="/"><ArrowLeft size={16}/>{m.back}</Link><div className="preview-banner"><CircleHelp size={18}/><span>{m.previewNote}</span></div><div className="detail-grid"><div><Poster/><div className="project-intro"><span className="small-pill">{m.previewLabel}</span><p className="eyebrow">{m.projectType}</p><h1>{m.projectTitle}</h1><p>{m.organizer}</p></div><section className="content-block"><h2>{m.storyTitle}</h2><p>{m.story}</p></section><section className="content-block"><h2>{m.budget}</h2><div className="budget-row"><span><span className="budget-number">01</span>{m.ad}</span><strong>8 USDC</strong></div><div className="budget-row"><span><span className="budget-number">02</span>{m.cafe}</span><strong>1 USDC</strong></div><div className="budget-row reserve"><span>{m.reserved}</span><strong>1 USDC</strong></div></section><section className="content-block"><h2>{m.supporters}</h2><p>{m.noSupporters}</p></section><section className="content-block" id="updates"><h2>{m.updates}</h2><p>{m.noUpdates}</p></section><details className="content-block ledger" id="funds"><summary>{m.ledger}</summary><p>{m.noLedger}</p></details></div><aside className="funding-panel"><span className="small-pill">{m.notStarted}</span><p className="muted">{m.plannedGoal}</p><div className="goal">10.00 <span>USDC</span></div><p className="subtle">{m.noFigures}</p><button className="button" disabled aria-describedby="support-unavailable"><Heart size={18}/>{m.support}</button><p id="support-unavailable" className="disabled-reason">{m.notReady}</p><div className="mini-rules">{[m.rule1, m.rule2, m.rule3].map(text => <p key={text}><Check size={17}/>{text}</p>)}</div><p className="privacy-note">{m.privacyHint}</p></aside></div><RulesCard/></main>;
}
export function Information({ kind }: { kind: 'me' | 'proof' | 'help' | 'privacy' | 'terms' }) {
  const { messages: m } = useContext(I18n);
  return <main id="main" tabIndex={-1} className="info-page"><span className="info-icon"><Heart size={30}/></span><h1>{m[`${kind}Title` as keyof typeof m]}</h1><p>{m[`${kind}Body` as keyof typeof m]}</p><Link href="/" className="outline-button">{m.back}<ArrowUpRight size={18}/></Link>{kind === 'help' && <RulesCard/>}</main>;
}
