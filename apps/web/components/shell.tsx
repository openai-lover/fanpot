'use client';
import Link from 'next/link';
import Image from 'next/image';
import { createContext, useContext, useEffect, useState } from 'react';
import { ArrowUpRight, Heart, Sparkles, ReceiptText, ArrowLeft, Check, CircleHelp } from 'lucide-react';
import en from '../messages/en.json';
import ko from '../messages/ko.json';
type Language = 'en' | 'ko';
const I18n = createContext({ language: 'en' as Language, messages: en });
export function Shell({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem('fanpot.language'); } catch { /* private browsing */ }
    const initial = stored === 'ko' || stored === 'en' ? stored : navigator.language.startsWith('ko') ? 'ko' : 'en';
    setLanguage(initial); document.documentElement.lang = initial;
  }, []);
  const messages = language === 'ko' ? ko : en;
  function changeLanguage() {
    const next = language === 'en' ? 'ko' : 'en'; setLanguage(next); document.documentElement.lang = next;
    try { localStorage.setItem('fanpot.language', next); } catch { /* language still changes in memory */ }
  }
  return <I18n.Provider value={{ language, messages }}>
    <a className="skip" href="#main">{language === 'ko' ? '본문 바로가기' : 'Skip to content'}</a>
    <header className="header"><div className="nav-wrap"><Link className="brand" href="/" aria-label="FanPot home"><Logo /></Link>
      <nav aria-label={language === 'ko' ? '주 메뉴' : 'Main navigation'}><Link href="/" className="nav-projects">{messages.projects}</Link><Link href="/me">{messages.mySupport}</Link><button className="language" onClick={changeLanguage} aria-label={language === 'en' ? '한국어로 변경' : 'Switch to English'}>{language === 'en' ? 'EN' : 'KO'}<span aria-hidden="true">⌄</span></button></nav></div></header>
    {children}
    <footer><div><Link href="/" className="brand small" aria-label="FanPot home"><Logo /></Link><p>{messages.footer}</p></div><div className="footer-links"><Link href="/help">{messages.help}</Link><Link href="/privacy">{messages.privacy}</Link><Link href="/terms">{messages.terms}</Link></div><span className="copyright">© 2026 FanPot · Development preview</span></footer>
  </I18n.Provider>;
}
function Logo() { return <Image src="/fanpot-logo.png" width={1312} height={1199} alt="" className="brand-logo" loading="eager" />; }
export function RulesCard() {
  const { messages: m } = useContext(I18n);
  return <section className="rules" id="rules"><div className="section-title"><span className="eyebrow">THE FANPOT PROMISE</span><h2>{m.rulesTitle}</h2><p>{m.rulesSub}</p></div><div className="rule-grid">{[Heart, ReceiptText, Sparkles].map((Icon, i) => <article key={i}><span className={`rule-icon color-${i}`}><Icon size={23} strokeWidth={1.75}/></span><h3>{m[`rule${i + 1}` as keyof typeof m]}</h3><p>{m[`rule${i + 1}Body` as keyof typeof m]}</p></article>)}</div></section>;
}
export function Poster({ compact = false }: { compact?: boolean }) { return <div className={`poster ${compact ? 'compact' : ''}`} role="img" aria-label="Original typographic poster for fictional artist LUMI"><span className="poster-top">TO OUR LITTLE UNIVERSE</span><span className="poster-orbit"/><span className="poster-star one">✦</span><span className="poster-star two">✧</span><span className="poster-name">LUMI</span><span className="poster-hand">you make our days brighter.</span><span className="poster-bottom">BIRTHDAY LIGHTS <span>WITH LOVE, TOGETHER</span></span></div>; }
export function Home() {
  const { messages: m } = useContext(I18n);
  return <main id="main" tabIndex={-1}><section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-star">✦</span>{m.eyebrow}</span><h1>{m.tagline}</h1><p>{m.intro}</p><div className="hero-actions"><a className="button" href="#projects">{m.browse}<ArrowUpRight size={18}/></a><a className="text-link" href="#rules">{m.how}<span>↗</span></a></div><div className="hero-note"><span className="heart-badge"><Heart size={15}/></span>Small contributions. Shared possibilities.</div></div><div className="hero-art"><div className="art-label"><span/>FAN-MADE MOMENTS</div><Poster compact/><span className="art-sticker"><Heart size={17} fill="currentColor"/>Made with love</span><span className="floating-spark">✦</span></div></section>
    <section className="projects-section" id="projects"><div className="section-heading"><div><span className="eyebrow">OUR NEXT CHAPTER</span><h2>{m.projectHeading}</h2><p>{m.projectSub}</p></div><span className="small-pill">K-POP · BIRTHDAY PROJECTS</span></div><div className="empty-card"><div className="empty-art"><Sparkles size={32} strokeWidth={1.4}/></div><div><h3>{m.emptyTitle}</h3><p>{m.emptyBody}</p></div><Link className="outline-button" href="/c/lumi-birthday-lights-demo">{m.preview}<ArrowUpRight size={17}/></Link></div></section>
    <RulesCard/>
    <div className="end-note"><Heart size={18}/><span>{m.privacyHint}</span></div>
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
