'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiZap, FiSave } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function WalletSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/sabi/wallet/settings').then(r => r.json()).then(d => {
      if (d.success) {
        setEnabled(d.autoTopupEnabled);
        setThreshold(d.autoTopupThreshold ? (d.autoTopupThreshold / 100).toString() : '');
        setAmount(d.autoTopupAmount ? (d.autoTopupAmount / 100).toString() : '');
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/sabi/wallet/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoTopupEnabled: enabled, autoTopupThreshold: Number(threshold) || 0, autoTopupAmount: Number(amount) || 0 }),
    });
    const d = await res.json();
    setMsg(d.success ? 'Saved!' : 'Failed to save');
    setSaving(false);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <Link href="/sabi/wallet" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm transition">
          <FiArrowLeft /> Back to Wallet
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white mb-2">Wallet Settings</h1>
          <p className="text-slate-400 mb-8">Configure automatic top-up so you never run out of balance mid-campaign.</p>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiZap className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-bold">Auto Top-Up</p>
                  <p className="text-slate-400 text-sm">Automatically fund wallet when balance is low</p>
                </div>
              </div>
              <button
                onClick={() => setEnabled(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-blue-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {enabled && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">When balance drops below (₦)</label>
                  <input
                    type="number" value={threshold} onChange={e => setThreshold(e.target.value)} min="100"
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl text-white focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Top up by (₦)</label>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)} min="500"
                    placeholder="e.g. 10000"
                    className="w-full px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl text-white focus:border-blue-500/50 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">A Flutterwave payment link will be sent to your email when triggered.</p>
                </div>
              </motion.div>
            )}

            <button
              onClick={save}
              disabled={saving || loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {msg && <p className={`text-center text-sm ${msg === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
