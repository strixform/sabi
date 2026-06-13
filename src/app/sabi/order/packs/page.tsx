'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiCheck, FiX } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BUNDLES, computeBundleTotal, getServiceById, type Bundle } from '@/lib/servicesCatalog';

const ngn = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString()}`;

export default function PacksPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ created: number; total: number } | null>(null);

  const buy = async () => {
    if (!selected || !url.trim()) { setError('Paste your link first.'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/sabi/orders/bundle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: selected.id, targetUrl: url.trim() }),
      });
      const d = await res.json();
      if (res.status === 401) { router.push('/sabi/login'); return; }
      if (!res.ok || !d.success) {
        setError(d.shortBy ? `Not enough balance — you need ${ngn(d.shortBy)} more.` : (d.error || 'Could not place pack.'));
        return;
      }
      setDone({ created: d.ordersCreated, total: d.ordersTotal });
    } catch { setError('Network error. Try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/sabi/order" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6">
          <FiArrowLeft className="w-4 h-4" /> Single service instead
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">🎁 Power Packs</h1>
          <p className="text-slate-400 text-sm">Everything one link needs, in a single order — fulfilled by real Nigerians, with receipts.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUNDLES.map(b => {
            const cost = computeBundleTotal(b);
            return (
              <button key={b.id} onClick={() => { setSelected(b); setUrl(''); setError(''); setDone(null); }}
                className="text-left rounded-2xl p-5 transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-3xl mb-2">{b.emoji}</div>
                <div className="text-white font-black text-lg leading-tight">{b.name}</div>
                <div className="text-slate-400 text-xs mt-1 mb-3">{b.tagline}</div>
                <div className="space-y-1 mb-4">
                  {b.items.map(it => {
                    const svc = getServiceById(it.serviceId);
                    return <div key={it.serviceId} className="text-[11px] text-slate-300 flex justify-between gap-2">
                      <span className="truncate">{svc?.name || it.serviceId}</span>
                      <span className="text-slate-500 shrink-0">×{it.quantity.toLocaleString()}</span>
                    </div>;
                  })}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-emerald-400 font-black text-xl">{ngn(cost.total)}</span>
                  <span className="text-xs font-bold text-purple-300">Get pack →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkout sheet */}
      {selected && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }} onClick={() => !busy && setSelected(null)} />
          <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
            <div className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6" style={{ background: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)' }}>
              {done ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"><FiCheck className="w-7 h-7 text-emerald-400" /></div>
                  <h2 className="text-xl font-black text-white mb-1">Pack ordered! 🎉</h2>
                  <p className="text-slate-400 text-sm mb-5">{done.created} of {done.total} orders placed — they're now with the crowd. Track receipts on each order.</p>
                  <div className="flex gap-2">
                    <Link href="/sabi/orders" className="flex-1 py-3 rounded-xl font-black text-sm text-white text-center" style={{ background: 'linear-gradient(135deg,#1D4ED8,#7C3AED)' }}>View my orders</Link>
                    <button onClick={() => setSelected(null)} className="px-4 py-3 rounded-xl text-sm font-bold text-slate-300" style={{ background: 'rgba(255,255,255,0.06)' }}>Close</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selected.emoji}</span>
                      <div>
                        <div className="text-white font-black">{selected.name}</div>
                        <div className="text-emerald-400 font-black text-lg">{ngn(computeBundleTotal(selected).total)}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white"><FiX className="w-5 h-5" /></button>
                  </div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">{selected.urlLabel}</label>
                  <input value={url} onChange={e => { setUrl(e.target.value); setError(''); }} placeholder="https://…"
                    className="w-full px-4 py-3 rounded-xl bg-[#0F1420] border border-white/[0.08] text-white text-sm placeholder-slate-600 focus:border-purple-500/60 outline-none mb-2" />
                  <p className="text-[11px] text-slate-500 mb-4">All {selected.items.length} services run on this one link, each with its own proof receipts.</p>
                  {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{error}</div>}
                  <button onClick={buy} disabled={busy || !url.trim()}
                    className="w-full py-3.5 rounded-xl font-black text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#1D4ED8,#7C3AED)' }}>
                    {busy ? <><FiLoader className="w-4 h-4 animate-spin" /> Placing pack…</> : `Buy pack — ${ngn(computeBundleTotal(selected).total)}`}
                  </button>
                  <p className="text-[10px] text-slate-600 text-center mt-2">Paid from your wallet balance</p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
