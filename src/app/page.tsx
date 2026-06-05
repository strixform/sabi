'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  SiInstagram, SiX, SiYoutube, SiTiktok, SiSnapchat, SiSpotify,
  SiWhatsapp, SiPinterest, SiThreads, SiTelegram, SiTwitch,
} from 'react-icons/si';
import {
  FiArrowRight, FiCheck, FiZap, FiUsers, FiMapPin, FiMessageCircle,
  FiShield, FiTrendingUp, FiStar, FiPlay,
} from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

// ─── Animated Counter ───────────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Live activity ticker ────────────────────────────────────────────────────
const ACTIVITIES = [
  'Oluwatobi in Lagos just gained 1,200 Instagram followers',
  'Chinedu from Abuja boosted his TikTok to 50K views',
  'Fatimah in Kano got 800 YouTube subscribers',
  'Emeka in Port Harcourt went viral with 25K Reel views',
  'Blessing from Ibadan gained 500 Twitter followers in 2 hours',
  'Damilola in Enugu got 300 comments on her post',
  'Usman from Kaduna boosted his Spotify to 2,000 plays',
  'Amara in Delta just got 1,000 TikTok likes',
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm max-w-xl mx-auto">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.span key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="text-emerald-300 truncate">
          {ACTIVITIES[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { Icon: SiInstagram, name: 'Instagram', color: 'from-pink-500 to-purple-600', services: ['Followers', 'Likes', 'Comments', 'Saves', 'Reel Views', 'Story Views'] },
  { Icon: SiTiktok, name: 'TikTok', color: 'from-slate-700 to-black', services: ['Followers', 'Likes', 'Comments', 'Views', 'Shares'] },
  { Icon: SiYoutube, name: 'YouTube', color: 'from-red-600 to-red-800', services: ['Subscribers', 'Views', 'Likes', 'Comments'] },
  { Icon: SiX, name: 'X (Twitter)', color: 'from-slate-600 to-slate-900', services: ['Followers', 'Likes', 'Retweets', 'Views'] },
  { Icon: SiSnapchat, name: 'Snapchat', color: 'from-yellow-400 to-yellow-500', services: ['Followers', 'Views', 'Saves'] },
  { Icon: SiWhatsapp, name: 'WhatsApp', color: 'from-green-500 to-green-700', services: ['Followers', 'Shares'] },
  { Icon: SiTelegram, name: 'Telegram', color: 'from-blue-400 to-blue-600', services: ['Followers', 'Views', 'Reactions'] },
  { Icon: SiThreads, name: 'Threads', color: 'from-slate-500 to-slate-800', services: ['Followers', 'Likes', 'Comments'] },
  { Icon: SiSpotify, name: 'Spotify', color: 'from-green-500 to-green-800', services: ['Followers', 'Plays'] },
  { Icon: SiPinterest, name: 'Pinterest', color: 'from-red-500 to-red-700', services: ['Followers', 'Repins', 'Likes'] },
  { Icon: SiTwitch, name: 'Twitch', color: 'from-purple-600 to-purple-900', services: ['Followers', 'Views', 'Subscriptions'] },
];

const DIFFERENTIATORS = [
  { icon: FiUsers, title: '300,000+ Real Nigerians', desc: 'Not bots. Not scripts. Real humans with real accounts, real followers, real histories. Every action is authentic — platforms can\'t detect it because it\'s literally real people.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: FiMapPin, title: 'Nigerian State-Level Targeting', desc: 'Choose Lagos, Abuja, PH, Kano — down to the city. Target by state, gender, or niche. No other platform on earth offers this for Nigerian audiences.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: FiMessageCircle, title: 'Comments That Make Sense', desc: 'Real Nigerians write real comments — in Pidgin, Yoruba, English, whatever fits your brand. You brief them. They deliver. No "Nice post!" spam ever.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { icon: FiZap, title: 'Orders Start in Minutes', desc: 'Place an order and it hits active Nigerians immediately. No waiting lists, no manual assignments. 50+ services across 11 platforms, always available.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: FiShield, title: 'Zero Platform Risk', desc: 'Because it\'s real people taking real actions, there are no sudden drops, no bans, no shadowbans. Your account stays safe and the engagement holds.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: FiStar, title: 'Every Nigerian is a Creator', desc: 'SABI isn\'t just for brands. Every Nigerian on the platform is an earner. They complete tasks, grow their own presence, and power others. Everyone wins.', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Choose your platform & service', desc: 'Pick from Instagram, TikTok, YouTube and 8 more. Followers, likes, views, comments — 50+ services available.' },
  { step: '02', title: 'Set your targeting', desc: 'Pick your Nigerian state, city, audience gender. Brief your comment style. Add a promo code. Confirm your order.' },
  { step: '03', title: 'Watch it happen in real time', desc: '300,000+ Nigerians receive your order. They act. You get notifications as it rolls in. Track every update on your dashboard.' },
];

const STATS = [
  { value: 300000, label: 'Active Nigerians', suffix: '+' },
  { value: 50, label: 'Services Available', suffix: '+' },
  { value: 11, label: 'Platforms Covered', suffix: '' },
  { value: 99, label: 'Satisfaction Rate', suffix: '%', prefix: '' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Fixed ambient glows ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/6 rounded-full blur-[120px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoImage className="w-10 h-10" />
            <span className="text-xl font-black tracking-tight">SABI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="/sabi/services" className="hover:text-white transition">Services</Link>
            <Link href="#how-it-works" className="hover:text-white transition">How It Works</Link>
            <Link href="/sabi/docs" className="hover:text-white transition">API</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sabi/login" className="text-sm text-white/70 hover:text-white transition px-4 py-2">Sign In</Link>
            <Link href="/sabi/register"
              className="text-sm font-bold px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:brightness-110 transition shadow-lg shadow-blue-500/25">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-10">
        {/* Live badge */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/70 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Nigeria's first real-people social media engine
        </motion.div>

        {/* Main headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight max-w-5xl mb-6">
          <span className="text-white">300,000 real</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Nigerians
          </span>
          <br />
          <span className="text-white">will make you go</span>
          <br />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            viral.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
          SABI isn't an SMM panel. It's a movement — powered by real people across every Nigerian state,
          every platform, every niche. Place an order and hundreds of active Nigerians go to work for you.
          Immediately.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-14">
          <Link href="/sabi/register"
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-lg rounded-2xl hover:brightness-110 transition shadow-2xl shadow-blue-500/30 group">
            Start Growing Now
            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/sabi/services"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white/80 font-bold text-lg rounded-2xl hover:bg-white/10 hover:text-white transition backdrop-blur-sm">
            <FiPlay className="w-4 h-4" />
            See All Services
          </Link>
        </motion.div>

        {/* Live ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="w-full max-w-2xl">
          <LiveTicker />
        </motion.div>

        {/* Platform scroll strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-16 w-full overflow-hidden">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-6">Available on all major platforms</p>
          <div className="flex items-center gap-8 justify-center flex-wrap opacity-50">
            {PLATFORMS.map(({ Icon, name }) => (
              <Icon key={name} className="w-6 h-6 text-white/60" title={name} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />
              </p>
              <p className="text-white/40 text-sm mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WHY SABI IS DIFFERENT ─────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-20">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">Why SABI is different</p>
            <h2 className="text-4xl sm:text-6xl font-black mb-6">
              This has never<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                been done before.
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Every other SMM panel uses bots. We use people.
              300,000 active Nigerians who earn by engaging with your content.
              The engagement is real. The impact is real. The results last.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div key={d.title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border p-7 ${d.bg} hover:scale-[1.02] transition-transform cursor-default`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${d.bg}`}>
                    <Icon className={`w-6 h-6 ${d.color}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{d.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{d.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-28 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-20">
            <p className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-4">Ridiculously simple</p>
            <h2 className="text-4xl sm:text-6xl font-black">
              Three steps.<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Thousands of results.
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((h, i) => (
              <motion.div key={h.step}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative">
                <div className="text-8xl font-black text-white/5 leading-none mb-4 select-none">{h.step}</div>
                <h3 className="text-xl font-black text-white mb-3 -mt-6">{h.title}</h3>
                <p className="text-white/40 leading-relaxed">{h.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 text-white/20">
                    <FiArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS GRID ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-pink-400 text-sm font-bold uppercase tracking-widest mb-4">50+ Services</p>
            <h2 className="text-4xl sm:text-5xl font-black">
              Every platform.<br />
              <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                Every metric.
              </span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PLATFORMS.map(({ Icon, name, color, services }, i) => (
              <motion.div key={name}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold mb-3">{name}</h3>
                <div className="space-y-1">
                  {services.slice(0, 4).map(s => (
                    <div key={s} className="flex items-center gap-2 text-white/40 text-xs">
                      <FiCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      {s}
                    </div>
                  ))}
                  {services.length > 4 && <p className="text-white/25 text-xs mt-1">+{services.length - 4} more</p>}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/sabi/services"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition">
              View All 50+ Services <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TARGETING CALLOUT ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-pink-600/20 border border-white/10 p-12 sm:p-16 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">Only on SABI</p>
              <h2 className="text-4xl sm:text-6xl font-black mb-6">
                Target Nigeria<br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  by state. By city. By gender.
                </span>
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10">
                No other platform in the world lets you target Lagos-Lekki females aged 18-35 for your Instagram post.
                We do. Because our 300,000 Nigerians are real people with real addresses.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-10">
                {['Lagos - Lekki', 'Abuja - Maitama', 'Port Harcourt GRA', 'Ibadan', 'Kano City', 'Enugu', '+ 30 more states'].map(loc => (
                  <span key={loc} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">
                    📍 {loc}
                  </span>
                ))}
              </div>
              <Link href="/sabi/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-lg rounded-2xl hover:brightness-110 transition shadow-2xl shadow-emerald-500/30">
                Start Targeting Nigeria <FiArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6 border-t border-white/5 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
              300,000 Nigerians<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                are waiting for you.
              </span>
            </h2>
            <p className="text-white/40 text-xl mb-12 max-w-2xl mx-auto">
              Create your account. Fund your wallet. Place your first order.
              Your growth starts today — with real people, not bots.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sabi/register"
                className="flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-xl rounded-2xl hover:brightness-110 transition shadow-2xl shadow-blue-500/30 group">
                Create Free Account
                <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/sabi/docs"
                className="flex items-center justify-center gap-2 px-10 py-5 bg-white/5 border border-white/10 text-white font-bold text-xl rounded-2xl hover:bg-white/10 transition">
                API Access
              </Link>
            </div>
            <p className="text-white/25 text-sm mt-8">
              Free to join · No setup fees · Orders start instantly · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoImage className="w-8 h-8" />
            <span className="font-black text-white">SABI</span>
            <span className="text-white/30 text-sm">— Real Nigerian Engagement</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/sabi/services" className="hover:text-white transition">Services</Link>
            <Link href="/sabi/docs" className="hover:text-white transition">API Docs</Link>
            <Link href="/sabi/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/sabi/register" className="hover:text-white transition">Register</Link>
          </div>
          <p className="text-white/20 text-sm">© 2026 Sabi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
