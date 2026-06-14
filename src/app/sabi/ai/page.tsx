'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiZap, FiEdit3, FiLoader } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';

export default function AIToolsPage() {
  // Growth plan
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [planErr, setPlanErr] = useState('');

  const runPlan = async () => {
    setPlanErr(''); setPlan(null);
    if (!url.trim()) { setPlanErr('Paste your profile or post link.'); return; }
    setPlanLoading(true);
    try {
      const res = await fetch('/api/sabi/ai/growth-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), goal: goal.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) setPlan(d);
      else setPlanErr(d?.error || 'Could not generate a plan.');
    } finally { setPlanLoading(false); }
  };

  // Caption generator
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('engaging');
  const [capLoading, setCapLoading] = useState(false);
  const [caps, setCaps] = useState<any>(null);
  const [capErr, setCapErr] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const runCaptions = async () => {
    setCapErr(''); setCaps(null);
    if (!topic.trim()) { setCapErr('Tell us what the post is about.'); return; }
    setCapLoading(true);
    try {
      const res = await fetch('/api/sabi/ai/caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), tone }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) setCaps(d);
      else setCapErr(d?.error || 'Could not generate captions.');
    } finally { setCapLoading(false); }
  };

  const input = "w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/40";

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/sabi/dashboard">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-4 py-2 mb-8 bg-white/[0.025] hover:bg-slate-700/50 text-slate-300 rounded-lg transition flex items-center gap-2 border border-white/[0.06]">
            <FiArrowLeft className="w-4 h-4" /> Dashboard
          </motion.button>
        </Link>

        <h1 className="text-4xl sm:text-5xl font-black mb-2"><GradientText>AI Studio</GradientText></h1>
        <p className="text-slate-400 mb-8">Let AI plan your growth and write your posts.</p>

        {/* Growth plan */}
        <InteractiveCard glowColor="blue">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><FiZap className="text-blue-400" /> Growth-plan recommender</h2>
            <p className="text-xs text-slate-400 mb-4">Paste your profile link — AI suggests a tailored package you can order in one tap.</p>
            <div className="space-y-3">
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" className={input} />
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Your goal (optional) — e.g. land brand deals" className={input} />
              {planErr && <p className="text-red-400 text-xs">{planErr}</p>}
              <motion.button whileTap={{ scale: 0.97 }} onClick={runPlan} disabled={planLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                {planLoading ? <><FiLoader className="w-4 h-4 animate-spin" /> Thinking…</> : 'Generate my plan'}
              </motion.button>
            </div>

            {plan && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-300">{plan.summary}</p>
                {plan.items.map((it: any) => (
                  <div key={it.serviceId} className="rounded-xl p-4 bg-black/25 border border-white/[0.06] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-white">{it.name} <span className="text-slate-400 font-normal">× {it.quantity.toLocaleString()}</span></div>
                      <div className="text-xs text-slate-400 mt-0.5">{it.reason}</div>
                    </div>
                    <Link href={`/sabi/order?serviceId=${encodeURIComponent(it.serviceId)}&quantity=${it.quantity}&url=${encodeURIComponent(url)}`}>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg text-xs whitespace-nowrap inline-block">Order →</span>
                    </Link>
                  </div>
                ))}
                {plan.dripDays > 0 && <p className="text-xs text-blue-300">💡 Tip: drip this over {plan.dripDays} days for natural growth (set it on the order page).</p>}
              </div>
            )}
          </div>
        </InteractiveCard>

        {/* Caption generator */}
        <div className="mt-6">
          <InteractiveCard glowColor="purple">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><FiEdit3 className="text-purple-400" /> Caption & hashtag writer</h2>
              <p className="text-xs text-slate-400 mb-4">Describe your post — get scroll-stopping captions + hashtags.</p>
              <div className="space-y-3">
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's the post about? e.g. my new Afrobeats single drops Friday" className={input} />
                <select value={tone} onChange={e => setTone(e.target.value)} className={input}>
                  {['engaging', 'funny', 'inspirational', 'bold', 'professional', 'gen-z'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {capErr && <p className="text-red-400 text-xs">{capErr}</p>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={runCaptions} disabled={capLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                  {capLoading ? <><FiLoader className="w-4 h-4 animate-spin" /> Writing…</> : 'Write captions'}
                </motion.button>
              </div>

              {caps && (
                <div className="mt-5 space-y-2">
                  {caps.captions.map((c: string, i: number) => (
                    <button key={i} onClick={() => { navigator.clipboard?.writeText(c); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
                      className="w-full text-left rounded-xl p-4 bg-black/25 border border-white/[0.06] hover:border-purple-500/30 transition">
                      <span className="text-sm text-slate-200">{c}</span>
                      <span className="block text-[10px] text-purple-300 mt-1">{copied === i ? '✓ Copied' : 'Tap to copy'}</span>
                    </button>
                  ))}
                  {caps.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {caps.hashtags.map((h: string) => (
                        <span key={h} className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>
      </div>
    </div>
  );
}
