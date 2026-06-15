'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Tab = 'proofs' | 'refills' | 'requests';

interface Order {
  id: string; serviceType: string; targetUrl: string; quantity: number;
  completedQuantity: number | null; status: string; createdAt: string;
  user?: { email: string; name: string } | null;
}
interface Proof { id: string; proofUrl: string | null; proofText: string | null; status: string; createdAt: string; }
interface Review { status: string; note: string | null; reviewedBy: string; reviewedAt: string; }
interface Refill {
  id: string; orderId: string; serviceType: string; targetUrl: string;
  refillQuantity: number; reason: string | null; status: string; createdAt: string;
}
interface CustomReq {
  id: string; serviceType: string; status: string; description: string;
  name: string; email: string; whatsapp: string; targetUrl?: string | null; createdAt: string;
}

const isImg = (u?: string | null) => !!u && /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(u);
const fmtSvc = (s: string) => s.replace(/_/g, ' ');

// Auth is by login session cookie — owner (admin-email account) or staff. No
// token needed; same-origin cookies are sent automatically.
function af(url: string, opts: RequestInit = {}) {
  return fetch(url, opts);
}

export default function StaffConsole() {
  const [role, setRole] = useState<'owner' | 'staff' | null | 'loading'>('loading');
  const [tab, setTab] = useState<Tab>('proofs');

  useEffect(() => {
    af('/api/sabi/admin/whoami')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRole(d?.role || null))
      .catch(() => setRole(null));
  }, []);

  if (role === 'loading') return <div className="min-h-screen bg-[#030507] text-slate-400 flex items-center justify-center">Loading…</div>;
  if (!role) return (
    <div className="min-h-screen bg-[#030507] text-slate-300 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-black text-white mb-2">Staff access only</h1>
        <p className="text-sm text-slate-500 mb-4">Sign in with the SABI account your admin added as staff.</p>
        <Link href="/sabi/login" className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm">Sign in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black flex items-center gap-2">🛡️ Staff Console</h1>
          {role === 'owner' && <Link href="/sabi/admin/staff" className="text-sm text-blue-400 hover:underline">Manage staff →</Link>}
        </div>
        <p className="text-xs text-slate-500 mb-5">Review delivery proofs, confirm coherence, and handle refill & custom requests.</p>

        <div className="flex gap-2 mb-5">
          {([['proofs', '🧾 Orders & Proofs'], ['refills', '🔁 Refills'], ['requests', '📋 Requests']] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'proofs' && <ProofsTab />}
        {tab === 'refills' && <RefillsTab />}
        {tab === 'requests' && <RequestsTab />}
      </div>
    </div>
  );
}

// ─── Orders & Proofs ─────────────────────────────────────────────────────────
function ProofsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('executing');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, { loading: boolean; items: Proof[]; total: number; approved: number }>>({});
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = status === 'all' ? '' : `&status=${status}`;
    af(`/api/sabi/admin/orders?limit=50${q}`)
      .then(r => (r.ok ? r.json() : null))
      .then(async d => {
        const os: Order[] = d?.orders || [];
        setOrders(os);
        if (os.length) {
          const rv = await af(`/api/sabi/admin/proof-review?orderIds=${os.map(o => o.id).join(',')}`)
            .then(r => (r.ok ? r.json() : null)).catch(() => null);
          if (rv?.reviews) setReviews(rv.reviews);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!proofs[id]) {
      setProofs(p => ({ ...p, [id]: { loading: true, items: [], total: 0, approved: 0 } }));
      af(`/api/sabi/orders/proofs?orderId=${encodeURIComponent(id)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => setProofs(p => ({ ...p, [id]: { loading: false, items: d?.proofs || [], total: d?.total || 0, approved: d?.approved || 0 } })))
        .catch(() => setProofs(p => ({ ...p, [id]: { loading: false, items: [], total: 0, approved: 0 } })));
    }
  };

  const review = async (orderId: string, verdict: 'verified' | 'flagged') => {
    setBusy(orderId + verdict);
    try {
      const res = await af('/api/sabi/admin/proof-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: verdict, note: notes[orderId] || '' }),
      });
      if (res.ok) setReviews(r => ({ ...r, [orderId]: { status: verdict, note: notes[orderId] || '', reviewedBy: 'you', reviewedAt: new Date().toISOString() } }));
    } finally { setBusy(null); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['executing', 'completed', 'processing', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${status === s ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>{s}</button>
        ))}
      </div>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : orders.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No {status} orders.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const rv = reviews[o.id];
            const pf = proofs[o.id];
            return (
              <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] overflow-hidden">
                <button onClick={() => toggle(o.id)} className="w-full text-left p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold capitalize text-sm">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                    <div className="text-xs text-blue-400 truncate max-w-[240px]">{o.targetUrl}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{o.user?.email || '—'} · {o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{o.status}</span>
                    {rv && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rv.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{rv.status === 'verified' ? '✅ verified' : '⚠️ flagged'}</span>}
                  </div>
                </button>
                {expanded === o.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.06]">
                    {!pf || pf.loading ? <p className="text-slate-500 text-sm py-4">Loading proofs…</p> : (
                      <>
                        <div className="text-[11px] text-slate-500 my-3">{pf.total} proof(s) · {pf.approved} approved</div>
                        {pf.items.length === 0 ? <p className="text-slate-600 text-xs pb-2">No proof uploaded yet.</p> : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                            {pf.items.map(p => (
                              <div key={p.id} className="rounded-lg overflow-hidden bg-black/30 border border-white/[0.06]">
                                {isImg(p.proofUrl) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <a href={p.proofUrl!} target="_blank" rel="noopener noreferrer"><img src={p.proofUrl!} alt="proof" loading="lazy" className="w-full h-20 object-cover hover:opacity-90" /></a>
                                ) : p.proofUrl ? (
                                  <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-20 text-[10px] text-blue-400 hover:underline px-1 text-center break-all">View ↗</a>
                                ) : <div className="flex items-center justify-center h-20 text-xl">✅</div>}
                                <div className="px-1.5 py-1 text-[9px] text-slate-400 truncate">{p.proofText || p.status}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Coherence verdict */}
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                          <input value={notes[o.id] ?? rv?.note ?? ''} onChange={e => setNotes(n => ({ ...n, [o.id]: e.target.value }))}
                            placeholder="Note (e.g. proof matches target / mismatch)…"
                            className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
                          <div className="flex gap-2">
                            <button onClick={() => review(o.id, 'verified')} disabled={busy === o.id + 'verified'}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs disabled:opacity-50">✅ Verify</button>
                            <button onClick={() => review(o.id, 'flagged')} disabled={busy === o.id + 'flagged'}
                              className="px-3 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-xs disabled:opacity-50">⚠️ Flag</button>
                          </div>
                        </div>
                        {rv && <div className="text-[10px] text-slate-500 mt-2">Last: {rv.status} by {rv.reviewedBy}{rv.note ? ` — “${rv.note}”` : ''}</div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Refills ─────────────────────────────────────────────────────────────────
function RefillsTab() {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    af('/api/sabi/admin/refills?status=pending')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRefills(d?.refills || []))
      .catch(() => setRefills([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const res = await af('/api/sabi/admin/refills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: notes[id] || '' }),
      });
      if (res.ok) setRefills(prev => prev.filter(r => r.id !== id));
    } finally { setBusy(null); }
  };

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  if (refills.length === 0) return <p className="text-slate-500 py-10 text-center">No pending refill requests.</p>;
  return (
    <div className="space-y-3">
      {refills.map(r => (
        <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
          <div className="font-bold capitalize text-sm">{fmtSvc(r.serviceType)} · <span className="text-cyan-400">{r.refillQuantity.toLocaleString()}</span> refill</div>
          <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{r.targetUrl}</a>
          <div className="text-[11px] text-slate-500 mt-0.5">Order {r.orderId.slice(0, 8)} · {new Date(r.createdAt).toLocaleString()}</div>
          {r.reason && <div className="text-sm text-slate-300 mt-2 bg-black/30 rounded-lg p-2">“{r.reason}”</div>}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
              placeholder="Optional note to buyer…"
              className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
            <div className="flex gap-2">
              <button onClick={() => act(r.id, 'approve')} disabled={busy === r.id} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Approve</button>
              <button onClick={() => act(r.id, 'reject')} disabled={busy === r.id} className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Requests ─────────────────────────────────────────────────────────
const REQ_STATUSES = ['new', 'reviewing', 'contacted', 'quoted', 'active', 'completed', 'rejected'];
function RequestsTab() {
  const [reqs, setReqs] = useState<CustomReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    af('/api/sabi/admin/custom-requests?limit=50')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setReqs(d?.requests || []))
      .catch(() => setReqs([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: { status?: string; adminNotes?: string }) => {
    setBusy(id);
    try {
      const res = await af('/api/sabi/admin/custom-requests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) load();
    } finally { setBusy(null); }
  };

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  if (reqs.length === 0) return <p className="text-slate-500 py-10 text-center">No requests.</p>;
  return (
    <div className="space-y-3">
      {reqs.map(r => (
        <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold capitalize text-sm">{fmtSvc(r.serviceType)}</div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {r.name} · <a href={`mailto:${r.email}`} className="text-blue-400 hover:underline">{r.email}</a>
                {r.whatsapp && <> · <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">WhatsApp</a></>}
              </div>
              {r.targetUrl && <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline break-all">{r.targetUrl}</a>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0 capitalize">{r.status}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REQ_STATUSES.map(s => (
              <button key={s} onClick={() => update(r.id, { status: s })} disabled={busy === r.id || r.status === s}
                className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition disabled:opacity-40 ${r.status === s ? 'bg-blue-600 text-white' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}>{s}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
              placeholder="Internal note…"
              className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
            <button onClick={() => update(r.id, { adminNotes: notes[r.id] || '' })} disabled={busy === r.id || !notes[r.id]}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm disabled:opacity-40">Save note</button>
          </div>
        </div>
      ))}
    </div>
  );
}
