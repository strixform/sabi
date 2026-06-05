'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  SiInstagram, SiX, SiYoutube, SiTiktok, SiSnapchat, SiSpotify,
  SiWhatsapp, SiPinterest, SiThreads, SiTelegram, SiTwitch,
} from 'react-icons/si';
import { FiArrowRight, FiCheck, FiZap, FiUsers, FiMapPin, FiMessageCircle, FiShield, FiTrendingUp, FiStar } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

// ─── Mouse-tracking cursor glow ───────────────────────────────────────────────
function CursorGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 30, stiffness: 200 });
  const springY = useSpring(y, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-0 rounded-full"
      style={{
        width: 800, height: 800,
        x: springX, y: springY,
        translateX: '-50%', translateY: '-50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, rgba(124,58,237,0.04) 40%, transparent 70%)',
      }}
    />
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 2200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Terminal ticker ──────────────────────────────────────────────────────────
const ACTIVITIES = [
  { user: 'tobi_creates', city: 'Lagos', action: '+1,247 Instagram followers', time: '2s ago' },
  { user: 'ch1nedu_', city: 'Abuja', action: '+50K TikTok views', time: '7s ago' },
  { user: 'fatimah.ng', city: 'Kano', action: '+800 YouTube subscribers', time: '11s ago' },
  { user: 'emeka_vibe', city: 'PH', action: '+25K Reel views in 1hr', time: '18s ago' },
  { user: 'blessing__', city: 'Ibadan', action: '+500 Twitter followers', time: '24s ago' },
  { user: 'dami.creates', city: 'Enugu', action: '+300 post comments', time: '31s ago' },
  { user: 'usman.ng', city: 'Kaduna', action: '+2,000 Spotify plays', time: '38s ago' },
  { user: 'amara_delta', city: 'Warri', action: '+1,000 TikTok likes', time: '44s ago' },
];

function TerminalTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 2800);
    return () => clearInterval(t);
  }, []);
  const a = ACTIVITIES[idx];
  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-black border border-white/10 rounded-lg font-mono text-sm max-w-xl mx-auto overflow-hidden">
      <span className="text-emerald-400 shrink-0">▶</span>
      <AnimatePresence mode="wait">
        <motion.span key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-2 text-white/70 truncate">
          <span className="text-blue-400">{a.user}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/50">{a.city}</span>
          <span className="text-white/30">·</span>
          <span className="text-emerald-300">{a.action}</span>
          <span className="text-white/20 text-xs shrink-0 hidden sm:inline">{a.time}</span>
        </motion.span>
      </AnimatePresence>
      <span className="w-1 h-4 bg-white/40 animate-pulse shrink-0" />
    </div>
  );
}

// ─── Marquee strip ────────────────────────────────────────────────────────────
const PLATFORM_ICONS = [
  { Icon: SiInstagram, name: 'Instagram', color: '#E1306C' },
  { Icon: SiTiktok, name: 'TikTok', color: '#FFFFFF' },
  { Icon: SiYoutube, name: 'YouTube', color: '#FF0000' },
  { Icon: SiX, name: 'X', color: '#FFFFFF' },
  { Icon: SiSnapchat, name: 'Snapchat', color: '#FFFC00' },
  { Icon: SiWhatsapp, name: 'WhatsApp', color: '#25D366' },
  { Icon: SiTelegram, name: 'Telegram', color: '#2CA5E0' },
  { Icon: SiThreads, name: 'Threads', color: '#FFFFFF' },
  { Icon: SiSpotify, name: 'Spotify', color: '#1DB954' },
  { Icon: SiPinterest, name: 'Pinterest', color: '#E60023' },
  { Icon: SiTwitch, name: 'Twitch', color: '#9146FF' },
];

function Marquee() {
  const doubled = [...PLATFORM_ICONS, ...PLATFORM_ICONS];
  return (
    <div className="relative overflow-hidden py-4" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
      <motion.div
        className="flex gap-12 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map(({ Icon, name, color }, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <Icon style={{ color }} className="w-6 h-6" />
            <span className="text-white/60 text-sm font-medium">{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Gradient border card ─────────────────────────────────────────────────────
function GradientCard({ children, className = '', gradient = 'from-blue-500/30 via-purple-500/20 to-transparent' }: any) {
  return (
    <div className={`relative rounded-2xl p-px ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}>
      <div className="relative rounded-2xl bg-[#060812] h-full">
        {children}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DIFF = [
  { icon: FiUsers, label: '300K+', title: 'Real Nigerians, not bots', desc: 'Every action is taken by a verified human with a real social media history. Platforms can\'t detect it — because it\'s literally people.', color: '#2563EB', span: 'col-span-1 row-span-1' },
  { icon: FiMapPin, label: '36 States', title: 'State & city targeting', desc: 'Lagos-Lekki. Abuja-Maitama. Port Harcourt GRA. Target by state, city, gender. No other platform on earth offers this for Nigerian audiences.', color: '#10B981', span: 'col-span-1 row-span-2' },
  { icon: FiMessageCircle, label: 'Custom', title: 'Comments that make sense', desc: 'Real Nigerians write real comments — Pidgin, Yoruba, English, slang. You brief them. They deliver. Zero generic spam.', color: '#8B5CF6', span: 'col-span-1 row-span-1' },
  { icon: FiZap, label: 'Minutes', title: 'Orders start instantly', desc: '50+ services. 11 platforms. Place an order and it hits 300,000 active Nigerians immediately.', color: '#F59E0B', span: 'col-span-1 row-span-1' },
  { icon: FiShield, label: 'Zero risk', title: 'Platform-safe guaranteed', desc: 'Real people, real actions. No drops. No bans. No shadowbans. Your account stays clean.', color: '#06B6D4', span: 'col-span-1 row-span-1' },
  { icon: FiStar, label: 'Earn', title: 'Every Nigerian is a creator', desc: 'SABI users earn by completing tasks. They grow their own presence while powering yours. The whole ecosystem thrives.', color: '#EC4899', span: 'col-span-1 row-span-1' },
];

const STATS = [
  { value: 300000, label: 'Active Nigerians', suffix: '+', size: 'text-6xl sm:text-8xl' },
  { value: 50, label: 'Services', suffix: '+', size: 'text-6xl sm:text-8xl' },
  { value: 11, label: 'Platforms', suffix: '', size: 'text-6xl sm:text-8xl' },
  { value: 99, label: 'Satisfaction', suffix: '%', size: 'text-6xl sm:text-8xl' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="min-h-screen bg-[#060812] flex items-center justify-center">
      <div className="w-6 h-6 border border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060812] text-white overflow-x-hidden selection:bg-blue-500/30">
      <CursorGlow />

      {/* CSS grid texture overlay */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoImage className="w-9 h-9 group-hover:scale-105 transition-transform" />
            <span className="text-lg font-black tracking-tight">SABI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/40 font-medium">
            <Link href="/sabi/services" className="hover:text-white transition-colors">Services</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/sabi/docs" className="hover:text-white transition-colors">API</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sabi/login" className="text-sm text-white/40 hover:text-white transition-colors px-4 py-2 hidden sm:block">Sign In</Link>
            <Link href="/sabi/register"
              className="relative text-sm font-bold px-5 py-2.5 rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-90 transition-opacity" />
              <span className="relative">Get Started →</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 overflow-hidden">
        {/* Deep glow behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)' }} />

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/[0.08] rounded-full text-xs font-mono text-white/40 mb-12 bg-white/[0.02] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE · 300,000+ ACTIVE NIGERIANS
        </motion.div>

        {/* Headline — massive, mixed weight */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 1 }}>
          <h1 className="font-black leading-[0.9] tracking-tighter text-[clamp(52px,9vw,130px)] mb-8">
            <div className="text-white">Nigeria's</div>
            <div className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-400 via-purple-400 to-violet-300 bg-clip-text text-transparent">
                300,000
              </span>
              {/* Glow behind number */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 scale-110" />
            </div>
            <div className="text-white/90"> will make</div>
            <div className="text-white"> you go </div>
            <div className="relative inline-block">
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-400 bg-clip-text text-transparent">
                viral.
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 blur-3xl opacity-15 scale-110" />
            </div>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="text-white/40 text-lg sm:text-xl max-w-xl mb-12 font-light leading-relaxed">
          Not a panel. Not bots. A network of real people across every Nigerian state — ready to make your content viral the moment you press confirm.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-14">
          <Link href="/sabi/register"
            className="group relative px-8 py-4 rounded-2xl overflow-hidden font-bold text-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: '0 0 40px rgba(37,99,235,0.5)' }} />
            <span className="relative flex items-center gap-2">
              Start Growing Free
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link href="/sabi/services"
            className="px-8 py-4 rounded-2xl font-bold text-lg text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            Explore Services
          </Link>
        </motion.div>

        {/* Terminal ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <TerminalTicker />
        </motion.div>

        {/* Platform marquee */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-20 w-full max-w-4xl">
          <p className="text-white/20 text-xs font-mono uppercase tracking-widest mb-6">11 platforms · 50+ services</p>
          <Marquee />
        </motion.div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.06] py-20 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(37,99,235,0.03), rgba(124,58,237,0.03), rgba(37,99,235,0.03))' }} />
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center px-8 py-8">
              <div className={`${s.size} font-black tracking-tighter leading-none mb-2 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent`}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-white/30 text-sm font-mono uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENTO: WHY SABI ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16">
            <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-4">// why_sabi_is_different</p>
            <h2 className="text-4xl sm:text-6xl font-black leading-tight">
              This has <span className="italic text-white/40">never</span><br />
              been done before.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Big card - spans 2 rows */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="md:row-span-2 group relative rounded-2xl p-px cursor-default overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05), rgba(255,255,255,0.04))' }}>
              <div className="h-full rounded-2xl bg-[#060812] p-8 flex flex-col justify-between min-h-[320px]">
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <FiMapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-5xl font-black text-emerald-400 mb-3">36 States</div>
                  <h3 className="text-white text-xl font-bold mb-4">State & city targeting</h3>
                  <p className="text-white/40 leading-relaxed">Lagos-Lekki. Abuja-Maitama. Port Harcourt GRA. Kano City. Target any Nigerian audience by state, city, and gender. No other SMM platform on earth offers this.</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {['Lagos', 'Abuja', 'PH', 'Ibadan', 'Kano', '+31 more'].map(l => (
                    <span key={l} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-300 font-mono">{l}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Regular cards */}
            {DIFF.slice(0, 1).map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div key={d.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                  className="group relative rounded-2xl p-px cursor-default"
                  style={{ background: `linear-gradient(135deg, ${d.color}30, rgba(255,255,255,0.04))` }}>
                  <div className="rounded-2xl bg-[#060812] p-7 h-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${d.color}15`, border: `1px solid ${d.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: d.color }} />
                    </div>
                    <div className="text-3xl font-black mb-2" style={{ color: d.color }}>{d.label}</div>
                    <h3 className="text-white font-bold mb-3">{d.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{d.desc}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* Wide card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="group relative rounded-2xl p-px cursor-default"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,255,255,0.04))' }}>
              <div className="rounded-2xl bg-[#060812] p-7 h-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <FiMessageCircle className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-3xl font-black text-violet-400 mb-2">Custom</div>
                <h3 className="text-white font-bold mb-3">Comments that make sense</h3>
                <p className="text-white/40 text-sm leading-relaxed">Real Nigerians write real comments — Pidgin, Yoruba, English. You brief them. They deliver. Zero generic spam.</p>
              </div>
            </motion.div>

            {DIFF.slice(3).map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div key={d.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i + 2) * 0.1 }}
                  className="group relative rounded-2xl p-px cursor-default"
                  style={{ background: `linear-gradient(135deg, ${d.color}25, rgba(255,255,255,0.04))` }}>
                  <div className="rounded-2xl bg-[#060812] p-7 h-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${d.color}15`, border: `1px solid ${d.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: d.color }} />
                    </div>
                    <div className="text-3xl font-black mb-2" style={{ color: d.color }}>{d.label}</div>
                    <h3 className="text-white font-bold mb-3">{d.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{d.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
            <p className="text-purple-400 text-xs font-mono uppercase tracking-widest mb-4">// how_it_works</p>
            <h2 className="text-4xl sm:text-6xl font-black">Three steps.<br />
              <span className="text-white/30">Thousands of results.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {[
              { n: '01', title: 'Pick your service', body: 'Choose from 50+ services across 11 platforms. Followers, likes, views, comments — whatever you need.' },
              { n: '02', title: 'Set your targeting', body: 'Nigerian state, city, audience gender. Brief your comments. Apply a promo code. Confirm your order.' },
              { n: '03', title: 'Watch it happen', body: '300,000 Nigerians receive your order. Actions start within minutes. Track every update in real time.' },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-[#060812] p-10 hover:bg-white/[0.02] transition-colors">
                <div className="font-mono text-white/10 text-7xl font-black leading-none mb-8 select-none">{s.n}</div>
                <h3 className="text-white text-xl font-bold mb-4">{s.title}</h3>
                <p className="text-white/40 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARGETING STATEMENT ────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest mb-8">// only on sabi</p>
            <h2 className="text-5xl sm:text-7xl font-black leading-tight mb-8">
              Target Nigeria<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                like never before.
              </span>
            </h2>
            <p className="text-white/40 text-xl max-w-2xl mx-auto mb-14 leading-relaxed">
              The only platform that lets you target Lagos-Lekki females, Abuja-Maitama young professionals, or Port Harcourt entrepreneurs — because our 300,000 Nigerians are actual people with real addresses.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-14">
              {['Lagos · Lekki', 'Abuja · Maitama', 'PH · GRA', 'Ibadan · Bodija', 'Kano City', 'Delta · Warri', 'Female only', 'Male only', 'Mixed', '+ 27 more states'].map(loc => (
                <span key={loc}
                  className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-full text-sm text-emerald-300/70 font-mono hover:border-emerald-500/40 hover:text-emerald-300 transition-colors cursor-default">
                  {loc}
                </span>
              ))}
            </div>
            <Link href="/sabi/register"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: '0 0 60px rgba(16,185,129,0.4)', background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.3))' }} />
              <span className="relative text-black font-black">Start Targeting Nigeria</span>
              <FiArrowRight className="relative w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-36 px-6 border-t border-white/[0.06] text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.1) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/20 font-mono text-xs uppercase tracking-widest mb-8">// ready_to_grow?</p>
            <h2 className="text-5xl sm:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
              <span className="text-white">300,000</span><br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Nigerians
              </span><br />
              <span className="text-white/50">waiting for you.</span>
            </h2>
            <p className="text-white/30 text-xl mb-14 max-w-xl mx-auto">
              Create your account. Fund your wallet.<br />Place your first order. Growth starts now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sabi/register"
                className="group relative px-10 py-5 rounded-2xl font-black text-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: '0 0 80px rgba(37,99,235,0.5)' }} />
                <span className="relative flex items-center gap-2">
                  Create Free Account
                  <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link href="/sabi/docs"
                className="px-10 py-5 rounded-2xl font-bold text-xl text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/70 transition-all bg-white/[0.02]">
                API Access
              </Link>
            </div>
            <p className="text-white/15 text-sm mt-10 font-mono">
              Free to join · No setup fees · Orders start instantly · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoImage className="w-7 h-7" />
            <span className="font-black">SABI</span>
            <span className="text-white/20 text-sm">· Real Nigerian Engagement</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/25 font-mono">
            <Link href="/sabi/services" className="hover:text-white/60 transition-colors">Services</Link>
            <Link href="/sabi/docs" className="hover:text-white/60 transition-colors">API</Link>
            <Link href="/sabi/login" className="hover:text-white/60 transition-colors">Sign In</Link>
            <Link href="/sabi/register" className="hover:text-white/60 transition-colors">Register</Link>
          </div>
          <p className="text-white/15 text-sm font-mono">© 2026 Sabi</p>
        </div>
      </footer>
    </div>
  );
}
