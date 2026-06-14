'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiLoader } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';

const PERKS = [
  'Your own branded website, built by us',
  'SABI API embedded — resell every service',
  'Set your own prices & keep the margin',
  'Wallet, orders & automated delivery included',
  'Your logo, your domain, your brand',
  'Ongoing access to new services we add',
];

export default function PartnershipPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ brandName: '', domain: '', contactPhone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [needsFunding, setNeedsFunding] = useState(false);

  const load = () => fetch('/api/sabi/partnership')
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d?.success) setData(d); })
    .catch(() => {})
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const apply = async () => {
    setErr(''); setNeedsFunding(false);
    if (!form.brandName.trim()) { setErr('Enter your brand name.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/sabi/partnership', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) { setData((p: any) => ({ ...p, partnership: d.partnership })); }
      else { setErr(d?.error || 'Could not submit'); if (d?.needsFunding) setNeedsFunding(true); }
    } finally { setSubmitting(false); }
  };

  const feeNaira = data?.feeKobo ? Math.round(data.feeKobo / 100) : 100000;
  const input = "w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/40";

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

        <div className="text-center mb-8">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">SABI Partnership</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-2 mb-3"><GradientText>Your own growth engine website</GradientText></h1>
          <p className="text-slate-400 max-w-xl mx-auto">We build you a branded growth engine website with our API embedded — resell all of SABI&apos;s real-engagement services under your own brand. One-time <b className="text-white">₦{feeNaira.toLocaleString()}</b>.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><FiLoader className="w-6 h-6 animate-spin text-purple-400" /></div>
        ) : data?.partnership && data.partnership.status !== 'cancelled' ? (
          <InteractiveCard glowColor="purple">
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">{data.partnership.status === 'live' ? '🚀' : '🛠️'}</div>
              <h2 className="text-xl font-bold mb-1">{data.partnership.brandName}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${data.partnership.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                {data.partnership.status === 'live' ? 'LIVE' : 'BEING BUILT'}
              </span>
              <p className="text-slate-400 text-sm mt-4">
                {data.partnership.status === 'live'
                  ? 'Your reseller site is live! Our team will have sent your access details.'
                  : 'Payment received — our team is building your branded reseller site. We&apos;ll reach out with your access details shortly.'}
              </p>
            </div>
          </InteractiveCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <InteractiveCard glowColor="purple">
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-lg mb-4">What you get</h3>
                <ul className="space-y-2.5">
                  {PERKS.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                      <FiCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </InteractiveCard>

            <InteractiveCard glowColor="blue">
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-lg mb-1">Apply</h3>
                <p className="text-xs text-slate-400 mb-4">The ₦{feeNaira.toLocaleString()} fee is charged from your wallet. Fund it first if needed.</p>
                <div className="space-y-3">
                  <input className={input} placeholder="Brand name *" value={form.brandName} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} />
                  <input className={input} placeholder="Preferred domain (optional)" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                  <input className={input} placeholder="WhatsApp / phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                  <textarea className={input + ' resize-none'} rows={2} placeholder="Anything we should know? (colors, niche…)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  {err && <p className="text-red-400 text-xs">{err}</p>}
                  {needsFunding && <Link href="/sabi/wallet" className="text-xs text-emerald-400 underline">Fund your wallet →</Link>}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={apply} disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg text-sm disabled:opacity-50">
                    {submitting ? 'Processing…' : `Pay ₦${feeNaira.toLocaleString()} & start`}
                  </motion.button>
                </div>
              </div>
            </InteractiveCard>
          </div>
        )}
      </div>
    </div>
  );
}
