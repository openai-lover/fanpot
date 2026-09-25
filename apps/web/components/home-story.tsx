'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Heart, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

const sceneCopy = [
  { kicker: '01 / THE IDEA', title: 'Imagine their name lighting up the city.', body: 'One fan has an idea. Together, fans can give it a place in the world.', detail: 'LUMI is a fictional artist. The billboard is an illustration; no ad has been booked.' },
  { kicker: '02 / TOGETHER', title: 'Small contributions. One big moment.', body: 'A little from each fan moves the same plan forward.', detail: 'Illustrative fan contributions include $5, $10, $20 and $25.' },
  { kicker: '03 / THE FANPOT', title: 'One pot. Clear progress.', body: 'See the goal, the amount raised, and the plan everyone is supporting.', detail: 'A sample FanPot shows the amount raised, a $3,000 goal, fan count, and recent support.' },
  { kicker: '04 / CLEAR RULES', title: 'One currency. Rules fans can see.', body: 'Fans contribute in USDC on Arc. If the goal is missed, supporters can claim their funds after the campaign is finalized.', detail: 'A refund requires a separate claim transaction; it is not automatic. The amounts shown here are illustrative.' },
  { kicker: '05 / THE GOAL', title: 'The goal opens the next step.', body: 'At $3,000, a capped payout still needs independent review before anyone arranges the ad.', detail: 'Reaching the goal does not book an ad or send funds to an organizer automatically.' },
  { kicker: '06 / THE VISION', title: 'Imagine it on the city screen.', body: 'This AI-generated placement shows what fans could make possible. No ad has been booked.', detail: 'LUMI is a fictional artist and the Seoul street placement is an AI-generated concept.' },
] as const;

const fans = [
  { name: 'Mina', amount: 25, initials: 'M', color: 'lilac', x: -0.38, y: -0.31 },
  { name: 'Alex', amount: 10, initials: 'A', color: 'peach', x: 0.32, y: -0.29 },
  { name: 'Jae', amount: 5, initials: 'J', color: 'blue', x: -0.43, y: 0.05 },
  { name: 'Noor', amount: 20, initials: 'N', color: 'mint', x: 0.38, y: 0.07 },
  { name: 'Kai', amount: 10, initials: 'K', color: 'rose', x: -0.27, y: 0.35 },
  { name: 'Anonymous', amount: 5, initials: '♡', color: 'cream', x: 0.29, y: 0.34 },
] as const;

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function span(value: number, start: number, end: number) { return clamp((value - start) / (end - start)); }
function visible(value: number, start: number, end: number, fade = 0.045) {
  return Math.min(span(value, start, start + fade), 1 - span(value, end - fade, end));
}

export function HomeStory() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const billboardFrameRef = useRef<HTMLDivElement>(null);
  const billboardRef = useRef<HTMLDivElement>(null);
  const desktopTargetRef = useRef<SVGRectElement>(null);
  const mobileTargetRef = useRef<SVGRectElement>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLElement>(null);
  const supporterRef = useRef<HTMLElement>(null);
  const percentRef = useRef<HTMLElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const potStatusRef = useRef<HTMLElement>(null);
  const currencyRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const sceneNumberRef = useRef<HTMLSpanElement>(null);
  const fanRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const copies = Array.from(stage.querySelectorAll<HTMLElement>('[data-story-scene]'));
    let frame = 0;
    let viewHeight = window.innerHeight;
    let travel = Math.max(1, track.offsetHeight - viewHeight);
    let worldWidth = stage.querySelector<HTMLElement>('.story-world')?.offsetWidth ?? 700;
    let worldHeight = stage.querySelector<HTMLElement>('.story-world')?.offsetHeight ?? 650;
    let targetX = 0;
    let targetY = 0;
    let targetScaleX = 1;
    let targetScaleY = 1;
    let previousAmount = -1;
    let previousFans = -1;
    let previousScene = -1;

    function measure() {
      if (!track || !stage) return;
      viewHeight = window.innerHeight;
      travel = Math.max(1, track.offsetHeight - viewHeight);
      worldWidth = stage.querySelector<HTMLElement>('.story-world')?.offsetWidth ?? 700;
      worldHeight = stage.querySelector<HTMLElement>('.story-world')?.offsetHeight ?? 650;
      const world = stage.querySelector<HTMLElement>('.story-world');
      const board = billboardFrameRef.current;
      const target = (window.innerWidth <= 700 ? mobileTargetRef.current : desktopTargetRef.current)?.getBoundingClientRect();
      if (world && board && target) {
        const origin = world.getBoundingClientRect();
        targetX = target.left - origin.left - board.offsetLeft;
        targetY = target.top - origin.top - board.offsetTop;
        targetScaleX = target.width / board.offsetWidth;
        targetScaleY = target.height / board.offsetHeight;
      }
      schedule();
    }

    function render() {
      frame = 0;
      if (!track || !stage || motion.matches) return;
      const progress = clamp(-track.getBoundingClientRect().top / travel);
      const ranges = [[-.05, .195], [.155, .36], [.325, .52], [.48, .665], [.625, .855], [.82, 1.02]] as const;
      const copyLevels = ranges.map(([start, end]) => visible(progress, start, end));
      const activeScene = copyLevels.reduce((best, level, index) => level > copyLevels[best] ? index : best, 0);
      copies.forEach((copy, index) => { copy.style.opacity = index === activeScene ? String(Math.max(.88, copyLevels[index])) : '0'; });
      if (activeScene !== previousScene) {
        previousScene = activeScene;
        if (sceneNumberRef.current) sceneNumberRef.current.textContent = String(activeScene + 1).padStart(2, '0');
      }
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;

      const reveal = span(progress, .14, .29);
      const mount = span(progress, .54, .91);
      const turn = Math.sin(mount * Math.PI);
      const reality = span(progress, .56, .82);
      const installedArt = span(progress, .82, .96);
      const light = span(progress, .8, .95);
      const potFocus = span(progress, .16, .38) * (1 - span(progress, .55, .7));
      const compact = window.innerWidth <= 700;
      const depth = compact ? .55 : 1;
      if (billboardFrameRef.current) {
        const x = targetX * mount;
        const y = targetY * mount - turn * (compact ? 20 : 38);
        const scaleX = 1 + (targetScaleX - 1) * mount;
        const scaleY = 1 + (targetScaleY - 1) * mount;
        billboardFrameRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) perspective(1100px) rotateY(${(-34 * turn).toFixed(1)}deg) rotateZ(${(-2 * (1 - mount) + 5 * turn).toFixed(1)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
        billboardFrameRef.current.style.opacity = String(1 - span(progress, .87, .96));
      }
      if (billboardRef.current) {
        billboardRef.current.style.filter = `brightness(${(.42 + mount * .58).toFixed(3)}) saturate(${(.68 + mount * .32).toFixed(3)})`;
      }
      stage.style.setProperty('--story-reality', reality.toFixed(3));
      stage.style.setProperty('--story-concept', (1 - reality).toFixed(3));
      stage.style.setProperty('--story-real-art', installedArt.toFixed(3));
      stage.style.setProperty('--story-art-scale', (1.08 + potFocus * .085 - mount * .055).toFixed(3));
      stage.style.setProperty('--story-art-x', `${(-2 + potFocus * 3 + mount * 1.5).toFixed(2)}%`);
      stage.style.setProperty('--story-art-y', `${(potFocus * -1.8 + mount * 1.2).toFixed(2)}%`);
      stage.style.setProperty('--story-sweep-x', `${(-190 + span(progress, .82, .96) * 570).toFixed(1)}%`);
      stage.style.setProperty('--story-sweep-opacity', (mount * .48).toFixed(3));
      stage.style.setProperty('--story-city-y', `${(potFocus * 13 * depth).toFixed(1)}px`);
      stage.style.setProperty('--story-pot-aura', (reveal * .22 + light * .42).toFixed(3));
      stage.style.setProperty('--story-light', light.toFixed(3));
      stage.style.setProperty('--story-activity', (span(progress, .31, .41) * (1 - span(progress, .44, .51))).toFixed(3));
      if (currencyRef.current) {
        const emphasis = span(progress, .46, .56) * (1 - span(progress, .7, .82));
        currencyRef.current.style.opacity = String(.62 + .38 * emphasis);
        currencyRef.current.style.transform = `scale(${(1 + .12 * emphasis).toFixed(3)})`;
      }
      stage.style.setProperty('--story-success', (span(progress, .71, .8) * (1 - span(progress, .87, .96))).toFixed(3));
      stage.style.setProperty('--story-safeguard', (span(progress, .47, .54) * (1 - span(progress, .64, .71))).toFixed(3));
      stage.style.setProperty('--story-cue', (1 - span(progress, .09, .15)).toFixed(3));
      if (potRef.current) {
        const cardPresence = 1 - span(progress, .77, .92);
        potRef.current.style.opacity = String(span(progress, .17, .28) * cardPresence);
        const entry = span(progress, .18, .32);
        const rise = ((1 - entry) * 54 - potFocus * 19 + span(progress, .77, .92) * 65) * depth;
        const scale = .94 + entry * .06 + potFocus * (compact ? .025 : .09);
        potRef.current.style.transform = `translate3d(0, ${rise.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }

      const amount = progress < .20 ? 185 : progress >= .72 ? 3000 : Math.round(185 + 2815 * span(progress, .20, .72));
      const supporters = Math.round(26 + 402 * span(progress, .18, .72));
      const percentage = Math.round(amount / 30);
      if (amount !== previousAmount) {
        previousAmount = amount;
        if (balanceRef.current) balanceRef.current.textContent = `$${amount.toLocaleString('en-US')}`;
        if (percentRef.current) percentRef.current.textContent = `${percentage}%`;
        if (meterRef.current) meterRef.current.style.width = `${percentage}%`;
      }
      if (supporters !== previousFans) {
        previousFans = supporters;
        if (supporterRef.current) supporterRef.current.textContent = String(supporters);
      }
      if (potStatusRef.current) potStatusRef.current.textContent = amount === 3000 ? 'GOAL REACHED · AWAITING REVIEW' : 'FUNDING EXAMPLE';
      stage.dataset.outcome = amount === 3000 ? 'funded' : 'funding';

      const arrival = span(progress, .18, .37);
      fanRefs.current.forEach((fan, index) => {
        if (!fan) return;
        const offset = fans[index];
        const stagger = clamp((arrival - index * .075) / .55);
        const move = 1 - stagger;
        fan.style.transform = `translate3d(${Math.round(offset.x * worldWidth * move)}px, ${Math.round(offset.y * worldHeight * move)}px, 0) scale(${(0.85 + .15 * move).toFixed(3)})`;
        fan.style.opacity = String(Math.min(1, span(progress, .15 + index * .012, .24 + index * .012)) * (1 - span(progress, .51, .62)));
      });
    }

    function schedule() { if (!frame) frame = window.requestAnimationFrame(render); }
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    motion.addEventListener('change', measure);
    measure();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      motion.removeEventListener('change', measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <>
    <section className="story-track" ref={trackRef} aria-label="How a FanPot comes together">
      <div className="story-sticky" ref={stageRef} aria-hidden="true">
        <div className="story-backdrop" />
        <div className="story-reality" aria-hidden="true">
          <svg className="story-real-desktop" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="story-desktop-screen"><rect x="812" y="172" width="718" height="366" /></clipPath></defs><image href="/arc-demo/story-seoul-billboard-desktop-v1.png" width="1672" height="941" /><image className="story-real-art" href="/arc-demo/ad-artwork-idol-v2.jpg" x="812" y="172" width="718" height="366" preserveAspectRatio="xMidYMid slice" clipPath="url(#story-desktop-screen)" /><rect className="story-real-target" ref={desktopTargetRef} x="795" y="147" width="759" height="411" fill="transparent" /></svg>
          <svg className="story-real-mobile" viewBox="0 0 941 1672" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="story-mobile-screen"><rect x="177" y="779" width="581" height="309" /></clipPath></defs><image href="/arc-demo/story-seoul-billboard-mobile-v1.png" width="941" height="1672" /><image className="story-real-art" href="/arc-demo/ad-artwork-idol-v2.jpg" x="177" y="779" width="581" height="309" preserveAspectRatio="xMidYMid slice" clipPath="url(#story-mobile-screen)" /><rect className="story-real-target" ref={mobileTargetRef} x="159" y="760" width="620" height="350" fill="transparent" /></svg>
        </div>
        <div className="story-city" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
        <div className="story-topbar"><span className="story-mark"><Heart size={16} fill="currentColor" /> FANPOT</span><span>AI-GENERATED PLACEMENT · NO AD BOOKED</span></div>
        <div className="story-inner">
          <div className="story-copy-stack">{sceneCopy.map((scene, index) => <div className="story-scene-copy" data-story-scene key={scene.kicker} style={{ opacity: index === 0 ? 1 : 0 }}><span className="story-kicker">{scene.kicker}</span>{index === 0 ? <h1>{scene.title}</h1> : <h2>{scene.title}</h2>}<p>{scene.body}</p></div>)}</div>
          <div className="story-world">
            <div className="story-billboard" ref={billboardFrameRef}><div className="story-billboard-screen" ref={billboardRef}><Image src="/arc-demo/ad-artwork-idol-v2.jpg" alt="" fill priority sizes="(max-width: 700px) 85vw, 46vw" /></div><span className="story-billboard-caption">LUMI · BIRTHDAY LIGHTS</span></div>
            <div className="story-billboard-pole" />
            <div className="story-billboard-light" />
            <div className="story-fan-field">{fans.map((fan, index) => <div className={`story-fan story-fan-${fan.color}`} key={fan.name} ref={(node) => { fanRefs.current[index] = node; }}><span className="story-fan-avatar">{fan.initials}</span><span className="story-fan-label">{fan.name}<strong>+${fan.amount}</strong></span></div>)}</div>
            <div className="story-pot" ref={potRef} style={{ opacity: 0 }}><div className="story-pot-top"><span className="story-pot-logo"><Heart size={15} fill="currentColor" /> FanPot</span><span className="story-pot-status" ref={potStatusRef}>FUNDING EXAMPLE</span></div><span className="story-pot-caption">LUMI birthday screen</span><div className="story-pot-amount"><strong ref={balanceRef}>$185</strong><span>of $3,000</span></div><div className="story-pot-meter"><span ref={meterRef} style={{ width: '6%' }} /></div><div className="story-pot-bottom"><span><strong ref={percentRef}>6%</strong> funded</span><span><strong ref={supporterRef}>26</strong> fans</span></div><div className="story-pot-currency">FUNDED IN <strong ref={currencyRef}>USDC</strong></div></div>
            <div className="story-activity"><span>RECENT SUPPORT</span><div><i className="story-activity-dot"/>Mina contributed <strong>$25</strong></div><div><i className="story-activity-dot alt"/>Alex contributed <strong>$10</strong></div><div><i className="story-activity-dot third"/>Anonymous contributed <strong>$5</strong></div></div>
            <div className="story-outcome"><span>GOAL REACHED</span><strong>$3,000 / $3,000</strong><small>Next: organizer request + reviewer approval</small></div>
            <div className="story-safeguard"><RotateCcw size={17}/><div><strong>If the goal is missed</strong><span>Fans claim USDC after finalization.</span></div></div>
          </div>
        </div>
        <div className="story-bottom-bar"><span className="story-scroll-cue"><ArrowDown size={16}/> SCROLL TO SEE HOW IT WORKS</span><span className="story-step"><span ref={sceneNumberRef}>01</span> / 06</span><span className="story-progress"><span ref={progressRef} /></span></div>
      </div>
      <ol className="story-accessible">{sceneCopy.map((scene, index) => <li key={scene.kicker}><span>{scene.kicker}</span>{index === 0 ? <h1>{scene.title}</h1> : <h2>{scene.title}</h2>}<p>{scene.body} {scene.detail}</p></li>)}</ol>
    </section>
    <section className="story-bridge" aria-labelledby="story-bridge-title"><div className="story-bridge-inner"><span className="eyebrow">YOUR TURN TO IMAGINE</span><h2 id="story-bridge-title">What would your fandom put on the map?</h2><p>Explore the fictional campaign examples and see the funding rules in action. Creating your own campaign is in development.</p><div className="story-bridge-actions"><Link className="button" href="#projects">Explore FanPots <ArrowUpRight size={17}/></Link><Link className="text-link" href="#rules">How funds work <ArrowUpRight size={16}/></Link></div></div></section>
  </>;
}
