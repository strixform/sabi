'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { BBNaijaIcon } from '@/components/BBNaijaIcon';

const ORDER_CTA = '/sabi/order?serviceId=bbnaija_vote';

const STEPS = [
  { n: 1, t: 'Paste the voting link', d: 'Drop the official BBNaija voting link (site, app or poll).' },
  { n: 2, t: 'Name your housemate', d: 'Tell us exactly who the votes should go to.' },
  { n: 3, t: 'Choose your votes & pay', d: 'Pick how many votes — real Nigerians do the rest, paced naturally.' },
];

const WHY = [
  { icon: '🧑🏽‍🤝‍🧑🏽', t: 'Real people, real devices', d: 'Every vote is cast by a genuine Nigerian — never bots, so they actually count.' },
  { icon: '⏱️', t: 'Naturally paced', d: 'Spread across the voting window so it never looks like a sudden rush.' },
  { icon: '⚡', t: 'Starts in minutes', d: 'Most orders begin within minutes of payment.' },
  { icon: '🔒', t: 'Safe & private', d: 'You only share the voting link and the housemate — nothing else.' },
];

const FAQ = [
  { q: 'How do I buy BBNaija votes?', a: 'Paste the voting link, tell us which housemate to vote for, choose how many votes, and pay. Real Nigerians cast the votes, paced over the window.' },
  { q: 'Are the votes real?', a: 'Yes — every vote is a genuine person on a real device, which is why they hold up on the official platforms.' },
  { q: 'How fast do votes start?', a: 'Most orders begin within minutes and are spread out so they never look like a bot rush.' },
  { q: 'Can I vote for any housemate?', a: 'Yes. You name the housemate when you order and every voter backs that person.' },
];

export default function BBNaijaPage() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://sability.io/sabi/bbnaija';
    const text = 'Rally votes for your favourite BBNaija housemate — real Nigerian votes on SABI 👁️';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Buy BBNaija Votes · SABI', text, url });
        return;
      }
    } catch { /* fall through to copy */ }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-white">
      <ModernSabiHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,56,176,0.14),transparent_60%)]" />
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-12 sm:pt-20 sm:pb-16 relative text-center">
          <div className="mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-400/30 flex items-center justify-center text-fuchsia-400">
            <BBNaijaIcon className="text-4xl sm:text-5xl" />
          </div>
          <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-400/25 rounded-full px-3 py-1 mb-4 text-xs sm:text-sm text-fuchsia-300">
            👁️ BBNaija season is live
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4">
            Buy <span className="bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent">BBNaija Votes</span>
            <br className="hidden sm:block" /> for your favourite housemate
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Keep your fave in the house with <b className="text-white">real Nigerian votes</b> — genuine people,
            real devices, paced naturally so they always count. Orders start within minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={ORDER_CTA} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white font-black text-base hover:opacity-90 transition shadow-lg shadow-fuchsia-500/20">
              Vote now →
            </Link>
            <button onClick={share} className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 font-bold text-sm hover:bg-white/10 transition">
              {copied ? '✓ Link copied' : '🔗 Share & rally votes'}
            </button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[['👥', 'Real Nigerians'], ['⚡', 'Starts in minutes'], ['⏱️', 'Naturally paced'], ['✅', 'Votes that count']].map(([i, t]) => (
            <div key={t} className="text-xs sm:text-sm text-slate-300"><span className="mr-1">{i}</span>{t}</div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">How it works</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Three steps — under a minute to order.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="w-9 h-9 rounded-lg bg-fuchsia-500/15 text-fuchsia-300 font-black flex items-center justify-center mb-3">{s.n}</div>
              <div className="font-bold mb-1">{s.t}</div>
              <div className="text-sm text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8">Why buy your votes here</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {WHY.map((w) => (
            <div key={w.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex gap-4">
              <div className="text-3xl shrink-0">{w.icon}</div>
              <div>
                <div className="font-bold mb-1">{w.t}</div>
                <div className="text-sm text-slate-400">{w.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8">BBNaija votes — FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 group">
              <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                {f.q}<span className="text-fuchsia-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-sm text-slate-400 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">Don&apos;t let your fave get evicted</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">Real Nigerian votes, starting in minutes. Order now and keep your housemate in the game.</p>
          <Link href={ORDER_CTA} className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white font-black text-lg hover:opacity-90 transition shadow-lg shadow-fuchsia-500/20">
            Buy BBNaija votes →
          </Link>
        </div>
      </section>
    </div>
  );
}
