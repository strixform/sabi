'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUploadCloud, FiLoader } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { getServiceById, computePricing } from '@/lib/servicesCatalog';

interface Row { serviceId: string; targetUrl: string; quantity: number; }

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: Row[] = [];
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 3) continue;
    const [serviceId, targetUrl, qty] = parts;
    // skip a header row
    if (serviceId.toLowerCase() === 'serviceid' || serviceId.toLowerCase() === 'service') continue;
    const quantity = parseInt(qty);
    if (!serviceId || !targetUrl || !Number.isFinite(quantity)) continue;
    out.push({ serviceId, targetUrl, quantity });
  }
  return out;
}

export default function BulkOrderPage() {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const rows = useMemo(() => parseCSV(text), [text]);
  const priced = useMemo(() => rows.map(r => {
    const svc = getServiceById(r.serviceId);
    const valid = !!svc && r.quantity >= (svc?.minQuantity || 1) && r.quantity <= (svc?.maxQuantity || Infinity);
    const cost = svc ? computePricing(svc.pricePerUnit, r.quantity).totalKobo : 0;
    return { ...r, name: svc?.name || '(unknown service)', valid, cost };
  }), [rows]);

  const totalKobo = priced.filter(p => p.valid).reduce((s, p) => s + p.cost, 0);
  const validCount = priced.filter(p => p.valid).length;

  const submit = async () => {
    setSubmitting(true); setResult(null);
    try {
      const res = await fetch('/api/sabi/orders/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: priced.filter(p => p.valid).map(p => ({ serviceId: p.serviceId, targetUrl: p.targetUrl, quantity: p.quantity })) }),
      });
      const d = await res.json().catch(() => null);
      setResult(d);
    } finally { setSubmitting(false); }
  };

  const template = 'serviceId,targetUrl,quantity\nig_followers,https://instagram.com/yourhandle,1000\ntiktok_views,https://tiktok.com/@you/video/123,5000';

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/sabi/order">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-4 py-2 mb-8 bg-white/[0.025] hover:bg-slate-700/50 text-slate-300 rounded-lg transition flex items-center gap-2 border border-white/[0.06]">
            <FiArrowLeft className="w-4 h-4" /> Single order
          </motion.button>
        </Link>

        <h1 className="text-4xl sm:text-5xl font-black mb-2 flex items-center gap-3"><FiUploadCloud className="text-blue-400" /> <GradientText>Bulk order</GradientText></h1>
        <p className="text-slate-400 mb-6">Place up to 100 orders at once. One row per order: <code className="text-blue-300">serviceId, targetUrl, quantity</code>. Find service IDs on the <Link href="/sabi/services" className="underline">services page</Link>.</p>

        <InteractiveCard glowColor="blue">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">Paste CSV</span>
              <button onClick={() => setText(template)} className="text-xs text-blue-400 hover:underline">Load example</button>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
              placeholder={template}
              className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500/40 resize-y" />
            <div className="mt-2">
              <input type="file" accept=".csv,text/csv,text/plain" onChange={e => { const f = e.target.files?.[0]; if (f) f.text().then(setText); }}
                className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-500/20 file:text-blue-300 file:text-xs file:font-bold" />
            </div>

            {priced.length > 0 && (
              <div className="mt-5">
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-white/[0.03] text-slate-400">
                      <th className="text-left p-2">Service</th><th className="text-left p-2">Target</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Cost</th>
                    </tr></thead>
                    <tbody>
                      {priced.map((p, i) => (
                        <tr key={i} className={`border-t border-white/[0.04] ${p.valid ? '' : 'bg-red-500/5'}`}>
                          <td className="p-2 text-slate-300">{p.name}</td>
                          <td className="p-2 text-slate-500 font-mono truncate max-w-[140px]">{p.targetUrl}</td>
                          <td className="p-2 text-right text-slate-300">{p.quantity.toLocaleString()}</td>
                          <td className="p-2 text-right">{p.valid ? `₦${(p.cost / 100).toLocaleString()}` : <span className="text-red-400">invalid</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-400">{validCount} valid order{validCount !== 1 ? 's' : ''} · total <b className="text-emerald-400">₦{(totalKobo / 100).toLocaleString()}</b></span>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={submitting || validCount === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <><FiLoader className="w-4 h-4 animate-spin" /> Placing…</> : `Place ${validCount} orders`}
                  </motion.button>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-5 rounded-xl p-4 bg-black/25 border border-white/[0.06]">
                <p className="text-sm font-bold text-white mb-2">✅ {result.placed} placed · {result.failed} failed</p>
                {result.results?.filter((r: any) => !r.success).slice(0, 10).map((r: any) => (
                  <p key={r.row} className="text-xs text-red-300">Row {r.row} ({r.serviceId}): {r.error}</p>
                ))}
                <Link href="/sabi/orders" className="text-xs text-blue-400 underline mt-2 inline-block">View my orders →</Link>
              </div>
            )}
          </div>
        </InteractiveCard>
      </div>
    </div>
  );
}
