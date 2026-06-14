'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface P {
  id: string; userId: string; brandName: string; domain: string | null; contactPhone: string | null;
  notes: string | null; status: string; paidKobo: number; createdAt: string;
}

export default function AdminPartnershipsPage() {
  const [items, setItems] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('building');
  const [busy, setBusy] = useState<string | null>(null);

  const load = (s: string) => {
    setLoading(true);
    fetch(`/api/sabi/admin/partnerships?status=${s}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setItems(d?.partnerships || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(filter); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await fetch('/api/sabi/admin/partnerships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      setItems(prev => prev.filter(p => p.id !== id));
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">🤝 Partnerships</h1>
          <Link href="/sabi/admin" className="text-sm text-blue-400 hover:underline">← Admin</Link>
        </div>
        <div className="flex gap-2 mb-5">
          {['building', 'live', 'cancelled', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s === 'all' ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${(filter === s || (s === 'all' && filter === '')) ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400'}`}>{s}</button>
          ))}
        </div>
        {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p>
        : items.length === 0 ? <p className="text-slate-500 py-10 text-center">No {filter || ''} partnerships.</p>
        : (
          <div className="space-y-3">
            {items.map(p => (
              <div key={p.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-bold">{p.brandName} <span className="text-emerald-400 text-xs">₦{Math.round(p.paidKobo / 100).toLocaleString()} paid</span></div>
                    <div className="text-xs text-slate-400 mt-1">{p.domain || 'no domain'} · {p.contactPhone || 'no phone'} · {new Date(p.createdAt).toLocaleDateString()}</div>
                    {p.notes && <div className="text-sm text-slate-300 mt-2 bg-black/30 rounded-lg p-2">“{p.notes}”</div>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' : p.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{p.status}</span>
                </div>
                {p.status === 'building' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setStatus(p.id, 'live')} disabled={busy === p.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Mark live</button>
                    <button onClick={() => setStatus(p.id, 'cancelled')} disabled={busy === p.id}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Cancel</button>
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
