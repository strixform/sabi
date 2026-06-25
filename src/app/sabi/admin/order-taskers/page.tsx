'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Command-area tasker traceability — search who did an order, or what a tasker has
 * done. Owner-only (the API is admin-gated and proxies to gamerz360 with the token).
 */
export default function OrderTaskersPage() {
  const [orderId, setOrderId] = useState('');
  const [taskerQ, setTaskerQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState<any>(null);

  const run = async (qs: string) => {
    setBusy(true); setErr(''); setData(null);
    try {
      const res = await fetch(`/api/sabi/admin/order-taskers?${qs}`);
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) setData(d);
      else setErr(d.error || 'Lookup failed');
    } catch { setErr('Lookup failed'); }
    finally { setBusy(false); }
  };

  const badge = (s: string) => (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : s === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{s}</span>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black">🔎 Tasker Traceability</h1>
          <Link href="/sabi/admin" className="text-xs text-slate-400 hover:text-white">← Command</Link>
        </div>
        <p className="text-sm text-slate-400 mb-5">See who performed an order, or search everything a person has done.</p>

        {/* By order */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3 mb-3">
          <label className="block text-xs font-bold text-slate-400 mb-1">Who worked this order?</label>
          <div className="flex gap-2">
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="SABI order ID"
              className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-slate-700 text-sm outline-none focus:border-blue-500" />
            <button onClick={() => orderId.trim() && run(`sabiOrderId=${encodeURIComponent(orderId.trim())}`)} disabled={busy}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold disabled:opacity-40">Search</button>
          </div>
        </div>

        {/* By tasker */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3 mb-4">
          <label className="block text-xs font-bold text-slate-400 mb-1">What has this person done?</label>
          <div className="flex gap-2">
            <input value={taskerQ} onChange={e => setTaskerQ(e.target.value)} placeholder="Tasker email or username"
              className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-slate-700 text-sm outline-none focus:border-blue-500" />
            <button onClick={() => taskerQ.trim() && run(`tasker=${encodeURIComponent(taskerQ.trim())}`)} disabled={busy}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold disabled:opacity-40">Search</button>
          </div>
        </div>

        {busy && <p className="text-sm text-slate-400">Searching…</p>}
        {err && <p className="text-sm text-red-400">{err}</p>}

        {/* By-order results */}
        {data?.mode === 'by-order' && (
          <div>
            <p className="text-xs text-slate-400 mb-2">{data.count} tasker(s) worked order <b className="text-white">{data.sabiOrderId}</b></p>
            <div className="space-y-1.5">
              {data.taskers.map((t: any) => (
                <div key={t.completionId} className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs">
                  <span className="flex-1 truncate"><b>{t.username}</b> <span className="text-slate-500">{t.email}</span></span>
                  {t.proofText && <span className="text-slate-400 truncate max-w-[30%]">{t.proofText}</span>}
                  {t.proofUrl && <a href={t.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">proof ↗</a>}
                  {badge(t.status)}
                  <span className="text-slate-600">{new Date(t.completedAt).toLocaleDateString()}</span>
                </div>
              ))}
              {data.count === 0 && <p className="text-slate-500 text-sm">No tasker completions found for that order.</p>}
            </div>
          </div>
        )}

        {/* By-tasker results */}
        {data?.mode === 'by-tasker' && (
          data.found === false ? <p className="text-slate-500 text-sm">No tasker found for that email/username.</p> : (
            <div>
              <p className="text-xs text-slate-400 mb-2"><b className="text-white">{data.tasker.username}</b> ({data.tasker.email}) — {data.count} job(s)</p>
              <div className="space-y-1.5">
                {data.jobs.map((j: any) => (
                  <div key={j.completionId} className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs">
                    <span className="flex-1 truncate">{j.title || 'Order'} <span className="text-slate-500">· {j.sabiOrderId}</span></span>
                    {j.proofUrl && <a href={j.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">proof ↗</a>}
                    {badge(j.status)}
                    <span className="text-slate-600">{new Date(j.completedAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {data.count === 0 && <p className="text-slate-500 text-sm">This person hasn&apos;t completed any SABI jobs.</p>}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
