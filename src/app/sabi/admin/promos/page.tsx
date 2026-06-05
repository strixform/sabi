'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiPlus, FiToggleLeft, FiToggleRight, FiTrash2,
  FiLoader, FiTag, FiPercent, FiDollarSign, FiCheck,
} from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderNaira, setMinOrderNaira] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/sabi/admin/promos');
    const data = await res.json();
    if (data.success) setPromos(data.promos);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await fetch('/api/sabi/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, description, discountType, discountValue: Number(discountValue), minOrderNaira: Number(minOrderNaira) || 0, maxUses: maxUses ? Number(maxUses) : null, expiresAt: expiresAt || null }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg('Code created!'); setShowForm(false);
      setCode(''); setDescription(''); setDiscountValue(''); setMinOrderNaira(''); setMaxUses(''); setExpiresAt('');
      load();
    } else { setMsg(data.error || 'Failed'); }
    setSaving(false);
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch('/api/sabi/admin/promos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
    setPromos(p => p.map(x => x.id === id ? { ...x, active: !active } : x));
  };

  const del = async (id: string, code: string) => {
    if (!confirm(`Delete code "${code}"?`)) return;
    await fetch('/api/sabi/admin/promos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setPromos(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={false} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <Link href="/sabi/admin" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm transition">
          <FiArrowLeft /> Admin Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Promo Codes</h1>
            <p className="text-slate-400 text-sm">{promos.filter(p => p.active).length} active · {promos.length} total</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:brightness-110 transition"
          >
            <FiPlus className="w-4 h-4" /> New Code
          </button>
        </div>

        {msg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
            <FiCheck className="w-4 h-4 shrink-0" /> {msg}
          </motion.div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              onSubmit={create}
              className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 mb-6 space-y-4"
            >
              <h3 className="text-white font-bold mb-2">Create Promo Code</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Code *</label>
                  <div className="relative">
                    <FiTag className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                    <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="e.g. SABI20"
                      className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono focus:border-blue-500/60 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="20% off first order"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500/60 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Discount Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['percent', 'fixed'] as const).map(t => (
                      <button type="button" key={t} onClick={() => setDiscountType(t)}
                        className={`py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition ${discountType === t ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {t === 'percent' ? <FiPercent className="w-3.5 h-3.5" /> : <FiDollarSign className="w-3.5 h-3.5" />}
                        {t === 'percent' ? 'Percent' : 'Fixed (₦)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Discount Value * {discountType === 'percent' ? '(1–100%)' : '(₦)'}
                  </label>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required
                    min={1} max={discountType === 'percent' ? 100 : undefined} placeholder={discountType === 'percent' ? '20' : '500'}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500/60 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Min Order (₦, optional)</label>
                  <input type="number" value={minOrderNaira} onChange={e => setMinOrderNaira(e.target.value)} placeholder="0 = no minimum"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500/60 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Uses (optional)</label>
                  <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Leave blank = unlimited"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500/60 outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Expires At (optional)</label>
                  <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500/60 outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><FiLoader className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Code'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-slate-700 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-600 transition">
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Promos list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-700/50 bg-slate-900/30">
            <FiTag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No promo codes yet</p>
            <p className="text-slate-500 text-sm mt-1">Click "New Code" to create your first discount.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map(p => (
              <motion.div key={p.id} layout
                className={`bg-slate-900/60 border rounded-xl p-5 flex items-center gap-4 ${p.active ? 'border-slate-700/50' : 'border-slate-800/50 opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-black text-white font-mono text-lg">{p.code}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${p.active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/20 rounded-full font-bold">
                      {p.discountType === 'percent' ? `${p.discountValue}% off` : `₦${(p.discountValue / 100).toLocaleString()} off`}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{p.description || '—'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1">
                    <span>{p.usages}/{p.maxUses ?? '∞'} uses</span>
                    {p.minOrderKobo > 0 && <span>Min ₦{(p.minOrderKobo / 100).toLocaleString()}</span>}
                    {p.expiresAt && <span>Expires {new Date(p.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(p.id, p.active)} title={p.active ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-lg transition ${p.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700/50'}`}>
                    {p.active ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => del(p.id, p.code)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
