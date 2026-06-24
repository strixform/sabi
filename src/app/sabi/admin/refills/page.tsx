'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Refill {
  id: string; orderId: string; userId: string; serviceType: string; targetUrl: string;
  refillQuantity: number; reason: string | null; status: string; adminNote: string | null; createdAt: string;
}

export default function AdminRefillsPage() {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newOrderId, setNewOrderId] = useState('');
  const [newQty, setNewQty] = useState('');
  const [createMsg, setCreateMsg] = useState('');
  const [creating, setCreating] = useState(false);

  const createDirect = async () => {
    const q = Math.floor(Number(newQty) || 0);
    if (!newOrderId.trim() || q < 1) { setCreateMsg('Enter an order ID and a quantity.'); return; }
    setCreating(true); setCreateMsg('');
    try {
      const res = await fetch('/api/sabi/admin/refills', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: newOrderId.trim(), quantity: q }),
      });
      const d = await res.json().catch(() => ({}));
      setCreateMsg(res.ok && d.success ? `✓ ${d.message}` : (d.error || 'Failed'));
      if (res.ok) { setNewOrderId(''); setNewQty(''); }
    } finally { setCreating(false); }
  };

  const load = (status: string) => {
    setLoading(true);
    fetch(`/api/sabi/admin/refills?status=${status}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.success) setRefills(d.refills || []); else setRefills([]); })
      .catch(() => setRefills([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const res = await fetch('/api/sabi/admin/refills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: notes[id] || '' }),
      });
      if (res.ok) setRefills(prev => prev.filter(r => r.id !== id));
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">🔁 Refill Requests</h1>
          <Link href="/sabi/admin" className="text-sm text-blue-400 hover:underline">← Admin</Link>
        </div>

        {/* Staff direct-create refill (type order ID + quantity) */}
        <div className="rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/20 mb-5">
          <div className="text-sm font-bold text-emerald-300 mb-2">🔄 Create a refill directly</div>
          <div className="flex gap-2 flex-wrap items-center">
            <input value={newOrderId} onChange={e => setNewOrderId(e.target.value)} placeholder="Order ID"
              className="flex-1 min-w-[160px] bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
            <input type="number" min={1} value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty"
              className="w-24 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
            <button onClick={createDirect} disabled={creating}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create refill'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Free top-up — buyer isn&apos;t charged. Goes to fresh, non-banned taskers (anyone who already did the order is blocked).</p>
          {createMsg && <div className="text-xs mt-2 text-emerald-400">{createMsg}</div>}
        </div>

        <div className="flex gap-2 mb-5">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s === 'all' ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                (filter === s || (s === 'all' && filter === '')) ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading…</p>
        ) : refills.length === 0 ? (
          <p className="text-slate-500 py-10 text-center">No {filter || ''} refill requests.</p>
        ) : (
          <div className="space-y-3">
            {refills.map(r => (
              <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold capitalize">{r.serviceType.replace(/_/g, ' ')} · <span className="text-cyan-400">{r.refillQuantity.toLocaleString()}</span> refill</div>
                    <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{r.targetUrl}</a>
                    <div className="text-xs text-slate-500 mt-1">Order {r.orderId.slice(0, 8)} · {new Date(r.createdAt).toLocaleString()}</div>
                    {r.reason && <div className="text-sm text-slate-300 mt-2 bg-black/30 rounded-lg p-2">“{r.reason}”</div>}
                    {r.adminNote && <div className="text-xs text-slate-400 mt-1">Note: {r.adminNote}</div>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300'
                    : r.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                    {r.status}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                      placeholder="Optional note to buyer…"
                      className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
                    <div className="flex gap-2">
                      <button onClick={() => act(r.id, 'approve')} disabled={busy === r.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Approve</button>
                      <button onClick={() => act(r.id, 'reject')} disabled={busy === r.id}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Reject</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
