'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Booking {
  id: string; creatorHandle: string; creatorPlatform: string; listedPriceKobo: number;
  offeredPriceKobo: number; counterPriceKobo: number | null; agreedPriceKobo: number | null;
  escrowKobo: number; brandUsername: string | null; brief: string | null; status: string;
  proofUrl: string | null; createdAt: string;
}

const naira = (k: number) => `₦${Math.round((k || 0) / 100).toLocaleString()}`;
const LABEL: Record<string, string> = {
  pending_creator: 'Sent — awaiting creator', negotiating: 'Negotiating', accepted: 'Accepted — creating content',
  delivered: 'Delivered — confirm to release payment', completed: 'Completed ✓', rejected: 'Declined (refunded)', cancelled: 'Cancelled (refunded)',
};

export default function BuyerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    fetch('/api/sabi/ugc/bookings').then(r => r.json()).then(d => setBookings(d.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (bookingId: string, action: string) => {
    if (action === 'cancel' && !confirm('Cancel this booking? Your escrow is refunded.')) return;
    if (action === 'confirm' && !confirm('Confirm the post is done? This releases your payment to the creator — it cannot be undone.')) return;
    setBusy(bookingId + action); setMsg('');
    try {
      const res = await fetch('/api/sabi/ugc/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action, bookingId }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(d.message || d.error || '');
      if (res.ok && d.success) load();
    } finally { setBusy(''); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black">My UGC Bookings</h1>
          <Link href="/sabi/ugc" className="text-xs text-slate-400 hover:text-white">← Browse creators</Link>
        </div>
        <p className="text-sm text-slate-400 mb-4">Track your bookings. Your money stays in escrow until you confirm the post is live.</p>
        {msg && <p className="text-xs text-emerald-300 mb-3">{msg}</p>}

        {loading ? <p className="text-slate-500 text-sm">Loading…</p> : bookings.length === 0 ? (
          <p className="text-slate-500 text-sm">No bookings yet. <Link href="/sabi/ugc" className="text-emerald-400 underline">Browse creators →</Link></p>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-black">@{b.creatorHandle} <span className="text-[10px] text-slate-500 uppercase">{b.creatorPlatform}</span></span>
                  <span className="text-[11px] text-slate-400">{LABEL[b.status] || b.status}</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">{naira(b.escrowKobo)} held</div>
                {b.brief && <p className="text-xs text-slate-400 mt-1">{b.brief}</p>}
                {b.brandUsername && <p className="text-[11px] text-slate-500 mt-0.5">Tag: {b.brandUsername}</p>}

                {b.status === 'negotiating' && b.counterPriceKobo ? (
                  <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                    <p className="text-[11px] text-blue-300 mb-1.5">Creator countered at <b>{naira(b.counterPriceKobo)}</b> (you offered {naira(b.offeredPriceKobo)}).</p>
                    <div className="flex gap-1.5">
                      <button disabled={!!busy} onClick={() => act(b.id, 'accept_counter')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40">Accept {naira(b.counterPriceKobo)}</button>
                      <button disabled={!!busy} onClick={() => act(b.id, 'cancel')} className="px-2.5 py-1 rounded-lg bg-red-600/15 text-red-300 text-xs font-bold disabled:opacity-40">Cancel · refund</button>
                    </div>
                  </div>
                ) : null}

                {b.status === 'delivered' && (
                  <div className="mt-2">
                    {b.proofUrl && <a href={b.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 underline">View the creator&apos;s post screenshot ↗</a>}
                    <div className="mt-1.5">
                      <button disabled={!!busy} onClick={() => act(b.id, 'confirm')} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-40">Confirm & pay creator</button>
                    </div>
                  </div>
                )}
                {(b.status === 'pending_creator' || b.status === 'negotiating') && !(b.status === 'negotiating' && b.counterPriceKobo) && (
                  <button disabled={!!busy} onClick={() => act(b.id, 'cancel')} className="mt-2 px-2.5 py-1 rounded-lg bg-red-600/15 text-red-300 text-xs font-bold disabled:opacity-40">Cancel · refund</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
