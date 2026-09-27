'use client';

import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

const BOARD_WIDTH = 1026;
const BOARD_HEIGHT = 482;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const phase = (p: number, a: number, b: number) => ease((p - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function CampaignArtwork() {
  return <div className="story-artwork">
    <Image src="/arc-demo/lumi-editorial-v4.webp" alt="" fill priority sizes="(max-width: 700px) 100vw, 85vw" />
    <div className="story-print"><span>To our favourite person.</span><strong>LUMI</strong><span>A birthday, made brighter.</span><small>With love, from all of us.</small></div>
  </div>;
}

export function HomeStory() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const desktopTarget = useRef<SVGRectElement>(null);
  const mobileTarget = useRef<SVGRectElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const position = positionRef.current;
    const board = boardRef.current;
    if (!track || !stage || !position || !board) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let p = 0;
    let desired = 0;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let distance = 1;
    let compact = false;
    let destination = { x: 0, y: 0, width: 0 };

    function measure() {
      if (!track || !stage) return;
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      compact = width <= 700;
      distance = Math.max(1, track.offsetHeight - height);
      const target = (compact ? mobileTarget.current : desktopTarget.current)?.getBoundingClientRect();
      if (target) destination = { x: target.left - rect.left + target.width / 2, y: target.top - rect.top + target.height / 2, width: target.width };
      // On resize, render the same scroll position against the new geometry once.
      p = desired = clamp(-track.getBoundingClientRect().top / distance);
      draw(p);
      stage.dataset.ready = 'true';
      schedule();
    }

    function draw(progress: number) {
      if (!stage || !position || !board) return;
      const approach = phase(progress, .08, .48);
      const install = phase(progress, .48, .88);
      const reveal = phase(progress, .63, .88);
      const initialWidth = Math.min(width * (compact ? .74 : .46), 660);
      const middleWidth = compact ? width * .83 : Math.min(width * .53, destination.width * .93);
      const start = { x: width * .50, y: height * (compact ? .57 : .56) };
      const middle = { x: width * (compact ? .52 : .71), y: height * (compact ? .58 : .48) };
      const x = mix(mix(start.x, middle.x, approach), destination.x, install);
      const y = mix(mix(start.y, middle.y, approach), destination.y, install);
      const displayedWidth = mix(mix(initialWidth, middleWidth, approach), destination.width, install);
      // A single scalar is used on all three axes. The artwork never stretches,
      // changes crop, swaps to a second image or snaps into another rectangle.
      const scale = displayedWidth / BOARD_WIDTH;
      const rx = mix(mix(9, -5, approach), 0, install);
      const ry = mix(mix(-15, 24, approach), 0, install);
      const rz = mix(mix(-4, 3, approach), 0, install);
      position.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0)`;
      board.style.transform = `perspective(2400px) rotateX(${rx.toFixed(4)}deg) rotateY(${ry.toFixed(4)}deg) rotateZ(${rz.toFixed(4)}deg) scale3d(${scale.toFixed(6)},${scale.toFixed(6)},${scale.toFixed(6)})`;
      stage.style.setProperty('--city-opacity', String(reveal));
      stage.style.setProperty('--studio-opacity', String(1 - reveal));
      stage.style.setProperty('--intro-opacity', String(1 - phase(progress, .12, .25)));
      stage.style.setProperty('--together-opacity', String(phase(progress, .23, .34) * (1 - phase(progress, .53, .64))));
      stage.style.setProperty('--final-opacity', String(phase(progress, .84, .93)));
      stage.style.setProperty('--finish', String(install));
      stage.style.setProperty('--ground-x', `${x}px`);
      stage.style.setProperty('--ground-y', `${y + displayedWidth / (BOARD_WIDTH / BOARD_HEIGHT) * .84}px`);
      stage.style.setProperty('--ground-width', `${displayedWidth * .70}px`);
      stage.dataset.scene = progress < .25 ? 'idea' : progress < .68 ? 'together' : 'city';
      stage.dataset.progress = progress.toFixed(4);
    }

    function tick(time: number) {
      raf = 0;
      if (reduced.matches) return;
      const dt = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      // Time-based damping gives wheel, trackpad and touch the same short settle.
      p += (desired - p) * (1 - Math.exp(-dt / 85));
      if (Math.abs(desired - p) < .00005) p = desired;
      draw(p);
      if (p !== desired) raf = requestAnimationFrame(tick);
      else previousTime = 0;
    }
    function schedule() {
      if (!track || reduced.matches) return;
      desired = clamp(-track.getBoundingClientRect().top / distance);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    reduced.addEventListener('change', measure);
    measure();
    return () => {
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <section ref={trackRef} className="story-track" aria-label="From a fan idea to a city billboard">
    <div ref={stageRef} className="story-stage" aria-hidden="true">
      <div className="story-city">
        <svg className="story-city-desktop" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid meet"><image href="/arc-demo/city-daylight-desktop-v2.webp" width="1672" height="941"/><rect ref={desktopTarget} className="story-mount-target" x="565" y="132" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="transparent"/></svg>
        <svg className="story-city-mobile" viewBox="0 0 941 1672" preserveAspectRatio="xMidYMid meet"><image href="/arc-demo/city-daylight-mobile-v2.webp" width="941" height="1672"/><rect ref={mobileTarget} className="story-mount-target" x="41" y="758" width="859" height={859 * BOARD_HEIGHT / BOARD_WIDTH} fill="transparent"/></svg>
      </div>
      <div className="story-studio"/>
      <div className="story-ground"/>
      <div className="story-intro"><h1>Made of fan love.</h1><p>Fan projects. Funded together.</p></div>
      <div className="story-together"><h2>A little from<br/>all of us.</h2><p>One shared fund.<br/>A moment worth making.</p><span>USDC on Arc</span></div>
      <div className="story-position" ref={positionRef}>
        <div className="story-board" ref={boardRef}>
          <div className="story-board-back"/><div className="story-board-side"/>
          <CampaignArtwork/>
          <div className="story-board-glass"/>
        </div>
      </div>
      <div className="story-finish"><h2>From your fandom.<br/>To the world.</h2><span>Campaign visualisation</span></div>
      <div className="story-invitation"><ArrowDown size={16}/><span>See it come to life</span></div>
    </div>
    <div className="story-readable">
      <h1>Made of fan love.</h1><p>Fund fan ads and goods together with USDC on Arc.</p>
      <div className="story-static-art"><CampaignArtwork/></div>
      <h2>A little from all of us.</h2><p>Contributions stay in a campaign contract. Every payout needs a separate reviewer.</p>
      <h2>From your fandom. To the world.</h2><p>LUMI and the city placement are fictional, AI-generated campaign concepts. No advertisement has been booked.</p>
    </div>
  </section>;
}
