'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  motion, useInView, AnimatePresence,
  useMotionValue, useSpring, useScroll, useTransform,
} from 'framer-motion';
import {
  SiInstagram, SiX, SiYoutube, SiTiktok, SiSnapchat, SiSpotify,
  SiWhatsapp, SiPinterest, SiThreads, SiTelegram, SiTwitch,
  SiFacebook, SiGoogle, SiApple, SiApplepodcasts,
} from 'react-icons/si';
import { FaLinkedinIn } from 'react-icons/fa';
import { FiArrowRight, FiArrowUpRight, FiGlobe } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';
import ChequeMateAd from '@/components/ChequeMateAd';

// ─── Smooth cursor glow ───────────────────────────────────────────────────────
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { damping: 50, stiffness: 150, mass: 0.5 });
  const sy = useSpring(y, { damping: 50, stiffness: 150, mass: 0.5 });
  useEffect(() => {
    const fn = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, [x, y]);
  return (
    <motion.div className="pointer-events-none fixed z-0 rounded-full"
      style={{ width: 700, height: 700, x: sx, y: sy, translateX: '-50%', translateY: '-50%',
        background: 'radial-gradient(circle, rgba(30,64,175,0.06) 0%, rgba(88,28,220,0.03) 45%, transparent 70%)' }} />
  );
}

// ─── Text mask reveal — the signature animation ───────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: '108%', opacity: 0.4 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Fade in ─────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '', y = 24 }: any) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 2600;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setN(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

// ─── Live ticker ─────────────────────────────────────────────────────────────
const LIVE = [
  ['@tobi.creates', 'Lagos · Lekki', '+1,247 Instagram followers'],
  ['@chinedu__', 'Abuja · Maitama', '+50K TikTok views'],
  ['@fatimah.ng', 'Kano · City', '+800 YouTube subscribers'],
  ['@emeka_vibe', 'Port Harcourt', '+25K Reel views'],
  ['@blessing__', 'Ibadan · Bodija', '+500 Twitter followers'],
  ['@damilola.c', 'Enugu · Layout', '+300 curated comments'],
  ['@usman.ng', 'Kaduna', '+2,000 Spotify plays'],
];

function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % LIVE.length), 3200); return () => clearInterval(t); }, []);
  const [handle, city, result] = LIVE[i];
  return (
    <div className="inline-flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-full px-6 py-2.5 font-mono text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.span key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.35 }} className="flex items-center gap-3 text-white/40">
          <span className="text-white/70 font-medium">{handle}</span>
          <span>·</span>
          <span>{city}</span>
          <span>·</span>
          <span className="text-emerald-400">{result}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Horizontal marquee ───────────────────────────────────────────────────────
const PLATFORMS = [
  { Icon: SiInstagram,    name: 'Instagram',  color: '#E1306C' },
  { Icon: SiTiktok,       name: 'TikTok',     color: '#ffffff' },
  { Icon: SiYoutube,      name: 'YouTube',    color: '#FF0000' },
  { Icon: SiX,            name: 'X',          color: '#ffffff' },
  { Icon: SiFacebook,     name: 'Facebook',   color: '#1877F2' },
  { Icon: FaLinkedinIn,   name: 'LinkedIn',   color: '#0A66C2' },
  { Icon: SiGoogle,       name: 'Google',     color: '#4285F4' },
  { Icon: SiSnapchat,     name: 'Snapchat',   color: '#FFFC00' },
  { Icon: SiWhatsapp,     name: 'WhatsApp',   color: '#25D366' },
  { Icon: SiTelegram,     name: 'Telegram',   color: '#2CA5E0' },
  { Icon: SiThreads,      name: 'Threads',    color: '#ffffff' },
  { Icon: SiSpotify,      name: 'Spotify',    color: '#1DB954' },
  { Icon: SiPinterest,    name: 'Pinterest',  color: '#E60023' },
  { Icon: SiTwitch,       name: 'Twitch',     color: '#9146FF' },
  { Icon: SiApple,        name: 'App Store',  color: '#A2AAAD' },
  { Icon: SiApplepodcasts,name: 'Podcasts',   color: '#872EC4' },
  { Icon: FiGlobe,        name: 'Website',    color: '#38BDF8' },
];

function Marquee() {
  const d = [...PLATFORMS, ...PLATFORMS];
  return (
    <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
      <motion.div className="flex gap-16 w-max py-1"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        {d.map(({ Icon, name, color }, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 opacity-30 hover:opacity-80 transition-opacity duration-500">
            <Icon style={{ color }} className="w-5 h-5" />
            <span className="text-white/60 text-sm font-medium tracking-wide">{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Capability card ──────────────────────────────────────────────────────────
function CapCard({ number, title, body, accent, wide = false, tall = false }: any) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl overflow-hidden cursor-default
        ${wide ? 'md:col-span-2' : ''} ${tall ? 'md:row-span-2' : ''}`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Inner glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${accent}08, transparent 60%)` }} />
      <div className="relative p-8 h-full flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono tracking-widest mb-6" style={{ color: accent }}>
            {number.toString().padStart(2, '0')}
          </div>
          <h3 className="text-xl font-bold text-white mb-4 leading-snug">{title}</h3>
          <p className="text-white/40 leading-relaxed text-sm">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [liveActions, setLiveActions] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroO = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    fetch('/api/sabi/stats/public')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.actionsDelivered > 0) setLiveActions(d.actionsDelivered); })
      .catch(() => {});
  }, []);
  if (!mounted) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030507] text-white overflow-x-hidden selection:bg-blue-800/40 selection:text-white grain">
      <CursorGlow />

      {/* Subtle dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
        style={{ backdropFilter: 'blur(24px) saturate(180%)', background: 'rgba(3,5,7,0.7)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.3 }}>
              <LogoImage height={39} />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-sm text-white/35 font-medium">
            {[['Services', '/sabi/services'], ['How it works', '#how'], ['API', '/sabi/docs'], ['Pricing', '/sabi/services']].map(([l, h]) => (
              <Link key={l} href={h} className="hover:text-white/80 transition-colors duration-300 tracking-wide">{l}</Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/sabi/login"
              className="text-sm text-white/35 hover:text-white/70 transition-colors duration-300 px-4 py-2 hidden sm:block tracking-wide">
              Sign in
            </Link>
            <Link href="/sabi/register"
              className="group relative flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl overflow-hidden tracking-wide">
              <div className="absolute inset-0 bg-white/90 group-hover:bg-white transition-colors duration-300" />
              <span className="relative text-black">Get started</span>
              <FiArrowRight className="relative w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Atmospheric glow — deep and restrained */}
        <motion.div style={{ y: heroY, opacity: heroO }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[900px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(29,78,216,0.09) 0%, rgba(88,28,220,0.05) 40%, transparent 70%)', filter: 'blur(40px)' }} />
        </motion.div>

        {/* Badge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
          className="mb-12">
          <span className="inline-flex items-center gap-2.5 text-xs font-mono tracking-[0.2em] text-white/30 uppercase">
            <span className="w-4 h-px bg-white/20" />
            Nigeria's social infrastructure
            <span className="w-4 h-px bg-white/20" />
          </span>
        </motion.div>

        {/* Main headline — editorial serif, calm authority */}
        <div className="mb-8 max-w-5xl">
          <Reveal delay={0.2}>
            <h1 className="font-editorial text-[clamp(56px,8.5vw,128px)] font-bold leading-[0.92] tracking-[-0.02em] text-white display-text">
              The platform<br />
              <em className="not-italic text-white/35">powered by</em>
            </h1>
          </Reveal>
          <Reveal delay={0.35}>
            <h1 className="font-editorial text-[clamp(56px,8.5vw,128px)] font-bold leading-[0.92] tracking-[-0.02em] display-text">
              <span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F472B6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                300,000 Nigerians.
              </span>
            </h1>
          </Reveal>
        </div>

        {/* Subline */}
        <FadeIn delay={0.55} className="mb-14 max-w-xl">
          <p className="text-white/40 text-lg leading-relaxed font-light tracking-wide">
            Real people. Every platform. Every Nigerian state.
            Place an order — they go to work within minutes.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.65} className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link href="/sabi/register"
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold tracking-wide relative overflow-hidden">
            <div className="absolute inset-0 bg-white/95 group-hover:bg-white transition-colors duration-500" />
            <span className="relative text-black">Start growing</span>
            <FiArrowRight className="relative w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform duration-300" />
          </Link>
          <Link href="/sabi/services"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-medium text-white/40 hover:text-white/70 border border-white/[0.07] hover:border-white/15 transition-all duration-500 tracking-wide">
            See all services
            <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </FadeIn>

        {/* Live ticker */}
        <FadeIn delay={0.75}>
          <Ticker />
        </FadeIn>

        {/* Platform strip */}
        <FadeIn delay={0.85} className="mt-20 w-full max-w-5xl">
          <p className="text-white/15 font-mono text-[10px] uppercase tracking-[0.25em] mb-8 text-center">
            11 platforms · 50+ services
          </p>
          <Marquee />
        </FadeIn>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { n: 300000, s: '+', l: 'Active Nigerians' },
              { n: 50, s: '+', l: 'Services available' },
              { n: 11, s: '', l: 'Platforms covered' },
              liveActions > 0
                ? { n: liveActions, s: '+', l: 'Real actions delivered' }
                : { n: 99, s: '%', l: 'Orders delivered' },
            ].map((st, i) => (
              <FadeIn key={st.l} delay={i * 0.1}
                className={`py-16 px-8 text-center ${i < 3 ? 'border-r border-white/[0.05]' : ''}`}>
                <div className="font-editorial text-[clamp(48px,6vw,88px)] font-bold leading-none tracking-tight mb-3"
                  style={{ background: 'linear-gradient(160deg, #ffffff 30%, rgba(255,255,255,0.35) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  <Counter target={st.n} suffix={st.s} />
                </div>
                <p className="text-white/30 text-sm font-mono tracking-widest uppercase">{st.l}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-36 px-6 border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-start">
            <FadeIn delay={0.1}>
              <p className="text-xs font-mono text-white/25 uppercase tracking-[0.2em] pt-2">
                What makes SABI<br />different
              </p>
            </FadeIn>
            <div>
              <Reveal delay={0.15}>
                <h2 className="font-editorial text-[clamp(32px,4.5vw,64px)] font-bold leading-[1.1] tracking-tight text-white mb-10">
                  Every other platform<br />
                  <span className="text-white/30">sends bots.</span><br />
                  We send people.
                </h2>
              </Reveal>
              <FadeIn delay={0.3}>
                <p className="text-white/40 text-lg leading-relaxed font-light max-w-2xl mb-10">
                  SABI is not a panel. It is an infrastructure — a network of 300,000 active Nigerians across every state, every platform, every demographic. When you place an order, real humans receive it and act on it. Immediately. The engagement holds because it is genuine. Your account stays safe because no algorithm was gamed.
                </p>
                <p className="text-white/40 text-lg leading-relaxed font-light max-w-2xl">
                  We've been building this quietly for years. Refining, expanding, deepening the network. What you see today is the result of that patience — and it shows in every order.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-16">
            <p className="text-xs font-mono text-white/25 uppercase tracking-[0.2em] mb-6">Capabilities</p>
            <Reveal>
              <h2 className="font-editorial text-[clamp(32px,4.5vw,58px)] font-bold leading-tight tracking-tight">
                Built for results.<br />
                <span className="text-white/30">Designed for permanence.</span>
              </h2>
            </Reveal>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Wide card */}
            <FadeIn delay={0} className="md:col-span-2">
              <CapCard number={1} wide
                accent="#60A5FA"
                title="Nigerian state & city targeting"
                body="Lagos-Lekki. Abuja-Maitama. Port Harcourt GRA. Ibadan-Bodija. Specify the exact Nigerian audience you want — state, city, gender. Precision that no other platform can offer, because our people are actually from these places." />
            </FadeIn>

            <FadeIn delay={0.08}>
              <CapCard number={2}
                accent="#34D399"
                title="Comments that read like humans wrote them"
                body="Because they did. Brief your taskers on tone, language, topic — Pidgin, Yoruba, formal English. Every comment is original, contextual, permanent." />
            </FadeIn>

            <FadeIn delay={0.12}>
              <CapCard number={3}
                accent="#A78BFA"
                title="Zero platform risk"
                body="Real accounts with real history taking real actions. Platforms detect bot patterns — not this. Your account stays clean indefinitely." />
            </FadeIn>

            <FadeIn delay={0.16}>
              <CapCard number={4}
                accent="#FB923C"
                title="Orders start in minutes"
                body="50+ services across 11 platforms. Place your order — 300,000 people receive it immediately. No queues, no delays, no manual assignment." />
            </FadeIn>

            <FadeIn delay={0.2}>
              <CapCard number={5}
                accent="#F472B6"
                title="Every user is a creator"
                body="Every Nigerian on SABI earns by completing tasks. They grow their own presence while powering yours. A self-sustaining ecosystem." />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how" className="relative z-10 py-28 px-6 border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-start mb-20">
            <FadeIn>
              <p className="text-xs font-mono text-white/25 uppercase tracking-[0.2em] pt-2">How it works</p>
            </FadeIn>
            <Reveal delay={0.1}>
              <h2 className="font-editorial text-[clamp(32px,4.5vw,58px)] font-bold leading-tight tracking-tight">
                Three steps.<br />
                <span className="text-white/30">Permanent results.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              { n: '01', t: 'Choose your service', b: 'Select from 50+ services across 11 platforms. Followers, likes, views, comments, shares, saves — whatever your content needs.' },
              { n: '02', t: 'Configure your targeting', b: 'Nigerian state, city, audience gender. Brief your comment style if needed. Add a promo code. Review and confirm your order.' },
              { n: '03', t: 'Watch it happen', b: '300,000 Nigerians receive your order. Actions begin within minutes. Track every update in real time on your dashboard.' },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.12}
                className="bg-[#030507] hover:bg-white/[0.015] transition-colors duration-700 p-10 group cursor-default">
                <div className="text-[80px] font-editorial font-bold text-white/[0.04] leading-none select-none mb-8 group-hover:text-white/[0.07] transition-colors duration-700">
                  {s.n}
                </div>
                <h3 className="text-white font-semibold text-lg mb-4 tracking-tight">{s.t}</h3>
                <p className="text-white/35 leading-relaxed text-sm">{s.b}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARGETING ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-b border-white/[0.05] overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-center">
            <FadeIn>
              <p className="text-xs font-mono text-white/25 uppercase tracking-[0.2em]">Only on SABI</p>
            </FadeIn>
            <div>
              <Reveal delay={0.1}>
                <h2 className="font-editorial text-[clamp(32px,4.5vw,58px)] font-bold leading-tight tracking-tight mb-8">
                  Target Nigeria<br />
                  <span style={{ background: 'linear-gradient(135deg, #34D399, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    by state. By city.<br />By gender.
                  </span>
                </h2>
              </Reveal>
              <FadeIn delay={0.25}>
                <p className="text-white/35 text-lg leading-relaxed mb-10 max-w-xl font-light">
                  No other platform in the world lets you specify Lagos-Lekki females for your Instagram campaign. We do — because our 300,000 Nigerians are real people with real addresses, real devices, and real social media accounts from every corner of the country.
                </p>
                <div className="flex flex-wrap gap-2 mb-10">
                  {['Lagos · Lekki', 'Lagos · Ikeja', 'Abuja · Maitama', 'Abuja · Wuse', 'PH · GRA', 'Ibadan · Bodija', 'Kano City', 'Delta · Warri', 'Enugu · Layout', 'Female', 'Male', '+ 30 states'].map(l => (
                    <span key={l} className="px-3.5 py-1.5 border border-white/[0.07] rounded-full text-xs text-white/35 font-mono tracking-wide hover:border-emerald-500/30 hover:text-emerald-400/70 transition-all duration-300 cursor-default">
                      {l}
                    </span>
                  ))}
                </div>
                <Link href="/sabi/register"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base tracking-wide text-black relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #34D399, #06B6D4)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: '0 0 60px rgba(52,211,153,0.35)' }} />
                  <span className="relative font-bold">Start targeting Nigeria</span>
                  <FiArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_2fr] gap-20 items-start mb-16">
            <FadeIn>
              <p className="text-xs font-mono text-white/25 uppercase tracking-[0.2em] pt-2">Coverage</p>
            </FadeIn>
            <Reveal delay={0.1}>
              <h2 className="font-editorial text-[clamp(32px,4.5vw,58px)] font-bold leading-tight tracking-tight">
                Every platform.<br />
                <span className="text-white/30">Every metric.</span>
              </h2>
            </Reveal>
          </div>

          <FadeIn className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" delay={0.15}>
            {PLATFORMS.map(({ Icon, name, color }, i) => (
              <motion.div key={name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 cursor-default group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                  <Icon style={{ color }} className="w-4 h-4" />
                </div>
                <span className="text-white/60 text-sm font-medium group-hover:text-white/80 transition-colors duration-300">{name}</span>
              </motion.div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(29,78,216,0.07) 0%, transparent 55%)' }} />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <FadeIn className="mb-6">
            <p className="text-xs font-mono text-white/20 uppercase tracking-[0.25em]">
              · · ·
            </p>
          </FadeIn>
          <div className="mb-6">
            <Reveal>
              <h2 className="font-editorial text-[clamp(48px,8vw,112px)] font-bold leading-[0.9] tracking-tight">
                300,000 people.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-editorial text-[clamp(48px,8vw,112px)] font-bold leading-[0.9] tracking-tight text-white/30">
                Waiting for
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <h2 className="font-editorial text-[clamp(48px,8vw,112px)] font-bold leading-[0.9] tracking-tight">
                <span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your order.</span>
              </h2>
            </Reveal>
          </div>

          <FadeIn delay={0.4} className="mb-14">
            <p className="text-white/30 text-xl max-w-lg mx-auto font-light leading-relaxed tracking-wide">
              Create an account. Fund your wallet.<br />
              Place your first order. This is where growth begins.
            </p>
          </FadeIn>

          <FadeIn delay={0.5} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sabi/register"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-lg tracking-wide overflow-hidden">
              <div className="absolute inset-0 bg-white/95 group-hover:bg-white transition-colors duration-500" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ boxShadow: '0 0 80px rgba(255,255,255,0.15)' }} />
              <span className="relative text-black">Create free account</span>
              <FiArrowRight className="relative w-5 h-5 text-black group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
            <Link href="/sabi/docs"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-medium text-lg text-white/30 border border-white/[0.07] hover:border-white/15 hover:text-white/50 transition-all duration-500 tracking-wide">
              API documentation
            </Link>
          </FadeIn>

          <FadeIn delay={0.6} className="mt-14">
            <p className="text-white/15 text-xs font-mono tracking-widest uppercase">
              Free to join · Instant orders · Cancel anytime
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── ChequeMate cross-promo ──────────────────────────────────────── */}
      <div className="relative z-10 flex justify-center px-6 pb-4">
        <ChequeMateAd />
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoImage className="h-10 w-auto opacity-60" />
            <span className="w-px h-3 bg-white/10" />
            <span className="text-white/20 text-xs font-mono tracking-wide">Real Nigerian engagement</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-white/20 font-mono tracking-widest uppercase">
            {[['Services', '/sabi/services'], ['API', '/sabi/docs'], ['Sign in', '/sabi/login'], ['Register', '/sabi/register']].map(([l, h]) => (
              <Link key={l} href={h} className="hover:text-white/45 transition-colors duration-300">{l}</Link>
            ))}
            <span className="w-px h-3 bg-white/10" />
            {[['Terms', '/sabi/legal/terms'], ['Privacy', '/sabi/legal/privacy'], ['Refunds', '/sabi/legal/refunds'], ['Cookies', '/sabi/legal/cookies']].map(([l, h]) => (
              <Link key={l} href={h} className="hover:text-white/45 transition-colors duration-300">{l}</Link>
            ))}
          </div>
          <p className="text-white/15 text-xs font-mono">© 2026 Sabi · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
