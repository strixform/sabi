'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';

interface Sub {
  id: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  intervalDays: number;
  nextRunAt: string;
  active: number;
  lastOrderId: string | null;
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch('/api/sabi/subscriptions')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.success) setSubs(d.subscriptions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const toggle = async (sub: Sub) => {
    setBusy(sub.id);
    try {
      await fetch(`/api/sabi/subscriptions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !sub.active }),
      });
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, active: sub.active ? 0 : 1 } : s));
    } finally { setBusy(null); }
  };

  const remove = async (sub: Sub) => {
    setBusy(sub.id);
    try {
      await fetch(`/api/sabi/subscriptions/${sub.id}`, { method: 'DELETE' });
      setSubs(prev => prev.filter(s => s.id !== sub.id));
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/sabi/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/[0.025] hover:bg-slate-700/50 text-slate-300 rounded-lg transition flex items-center gap-2 border border-white/[0.06]">
              <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
            </motion.button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-2 flex items-center gap-3">
            <FiRefreshCw className="w-8 h-8 text-emerald-400" />
            <GradientText>Auto-Reorders</GradientText>
          </h1>
          <p className="text-slate-400">Orders that re-run on a schedule and charge your wallet automatically.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
            <FiLoader className="w-5 h-5 animate-spin" /> Loading your auto-reorders…
          </div>
        ) : subs.length === 0 ? (
          <InteractiveCard glowColor="emerald">
            <div className="p-10 text-center">
              <div className="text-4xl mb-3">🔁</div>
              <p className="text-slate-300 font-semibold mb-1">No auto-reorders yet</p>
              <p className="text-slate-500 text-sm mb-6">Open any order and tap <b>Enable auto-reorder</b> to keep it running on a schedule.</p>
              <Link href="/sabi/dashboard">
                <span className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg text-sm inline-block">View my orders</span>
              </Link>
            </div>
          </InteractiveCard>
        ) : (
          <div className="space-y-4">
            {subs.map((sub) => (
              <InteractiveCard key={sub.id} glowColor={sub.active ? 'emerald' : 'orange'}>
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold capitalize text-white">{sub.serviceId.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400">× {sub.quantity.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>
                        {sub.active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate max-w-md">{sub.targetUrl}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Every <b className="text-slate-300">{sub.intervalDays} days</b>
                      {sub.active && <> · next run {new Date(sub.nextRunAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => toggle(sub)} disabled={busy === sub.id}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${sub.active ? 'bg-slate-700/60 text-slate-300 border border-white/[0.08]' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'}`}
                    >
                      {busy === sub.id ? '…' : sub.active ? 'Pause' : 'Resume'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => remove(sub)} disabled={busy === sub.id}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
