'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Tab = 'proofs' | 'refills' | 'requests' | 'partnerships';

interface Order {
  id: string; serviceType: string; targetUrl: string; quantity: number;
  completedQuantity: number | null; status: string; createdAt: string;
  user?: { email: string; name: string } | null;
}
interface ProofFlag { status: string; reason: string | null; reuploadedAt: string | null; }
interface Proof { id: string; proofUrl: string | null; proofText: string | null; status: string; createdAt: string; flag?: ProofFlag | null; }
interface Refill {
  id: string; orderId: string; serviceType: string; targetUrl: string;
  refillQuantity: number; reason: string | null; status: string; createdAt: string;
}
interface CustomReq {
  id: string; category?: string; status: string; description: string;
  name: string; email: string; whatsapp: string; targetUrl?: string | null;
  targetPlatform?: string | null; quantity?: number | null; budget?: string | null; createdAt: string;
}

const isImg = (u?: string | null) => !!u && /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(u);
const fmtSvc = (s?: string | null) => (s || 'request').replace(/_/g, ' ');

// Auth is by login session cookie — owner (admin-email account) or staff. No
// token needed; same-origin cookies are sent automatically.
function af(url: string, opts: RequestInit = {}) {
  return fetch(url, opts);
}

export default function StaffConsole() {
  const [role, setRole] = useState<'owner' | 'staff' | null | 'loading'>('loading');
  const [tab, setTab] = useState<Tab>('proofs');

  const checkRole = useCallback(() => {
    setRole('loading');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000); // never hang on "Loading…"
    fetch('/api/sabi/admin/whoami', { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRole(d?.role || null))
      .catch(() => setRole(null))
      .finally(() => clearTimeout(t));
  }, []);

  useEffect(() => { checkRole(); }, [checkRole]);

  // Live "re-uploads waiting for re-review" count — refreshed on load + every 60s.
  const [resub, setResub] = useState(0);
  useEffect(() => {
    if (!role || role === 'loading') return;
    const poll = () => af('/api/sabi/admin/resubmitted').then(r => (r.ok ? r.json() : null)).then(d => d && setResub(d.count || 0)).catch(() => {});
    poll();
    const i = setInterval(poll, 60000);
    return () => clearInterval(i);
  }, [role]);

  if (role === 'loading') return <div className="min-h-screen bg-[#030507] text-slate-400 flex items-center justify-center">Loading…</div>;
  if (!role) return (
    <div className="min-h-screen bg-[#030507] text-slate-300 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-black text-white mb-2">Staff access only</h1>
        <p className="text-sm text-slate-500 mb-4">Sign in with the SABI account that&apos;s registered as admin or staff, then reload.</p>
        <div className="flex gap-2 justify-center">
          <Link href="/sabi/login" className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm">Sign in</Link>
          <button onClick={checkRole} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm">Retry</button>
        </div>
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
        <p className="text-xs text-slate-500 mb-4">Review delivery proofs, confirm coherence, and handle refill & custom requests.</p>

        {resub > 0 && (
          <button onClick={() => setTab('proofs')}
            className="w-full text-left mb-4 rounded-xl px-4 py-3 flex items-center gap-2 transition hover:brightness-110"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)' }}>
            <span className="text-lg">🔁</span>
            <span className="text-sm font-bold text-yellow-300">{resub} re-upload{resub > 1 ? 's' : ''} waiting for re-review</span>
            <span className="text-xs text-yellow-200/70 ml-auto">Open Orders &amp; Proofs →</span>
          </button>
        )}

        <div className="flex gap-2 mb-5">
          {([['proofs', '🧾 Orders & Proofs'], ['refills', '🔁 Refills'], ['requests', '📋 Requests'], ['partnerships', '🤝 Partnerships']] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'proofs' && <ProofsTab />}
        {tab === 'refills' && <RefillsTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'partnerships' && <PartnershipsTab />}
      </div>
    </div>
  );
}

// ─── Orders & Proofs ─────────────────────────────────────────────────────────
function ProofsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all'); // show every order by default
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, { loading: boolean; items: Proof[]; total: number; approved: number }>>({});
  const [proofBusy, setProofBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = status === 'all' ? '' : `&status=${status}`;
    const s = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    af(`/api/sabi/admin/orders?limit=50${q}${s}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setOrders(d?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status, search]);
  useEffect(() => { load(); }, [load]);

  const loadProofs = (id: string) => {
    setProofs(p => ({ ...p, [id]: { loading: true, items: [], total: 0, approved: 0 } }));
    af(`/api/sabi/orders/proofs?orderId=${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setProofs(p => ({ ...p, [id]: { loading: false, items: d?.proofs || [], total: d?.total || 0, approved: d?.approved || 0 } })))
      .catch(() => setProofs(p => ({ ...p, [id]: { loading: false, items: [], total: 0, approved: 0 } })));
  };

  const toggle = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!proofs[id]) loadProofs(id);
  };

  // Flag (or clear) a SPECIFIC proof → gamerz360 notifies that exact tasker.
  const flagProof = async (orderId: string, completionId: string, action: 'flag' | 'clear') => {
    let reason = '';
    if (action === 'flag') {
      reason = (window.prompt("Why doesn't this proof match? The tasker will see this and must re-upload within 12h.") || '').trim();
      if (!reason) return;
    }
    setProofBusy(completionId);
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action, reason }),
      });
      if (res.ok) {
        setProofs(p => {
          const cur = p[orderId]; if (!cur) return p;
          return { ...p, [orderId]: { ...cur, items: cur.items.map(it => it.id === completionId
            ? { ...it, flag: action === 'clear' ? null : { status: 'flagged', reason, reuploadedAt: null } } : it) } };
        });
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Could not flag this proof.');
      }
    } finally { setProofBusy(null); }
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        👉 Tap an order to open its delivery proofs. Check each proof matches the target account. If one doesn&apos;t, tap <b className="text-red-300">⚠️ Flag</b> on that proof — the tasker is told to re-upload within 12h. When they re-upload (🔁), re-check and <b className="text-emerald-300">✅ Clear</b> it.
      </p>
      {/* Search by customer email, name, or order ID */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2 mb-3">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by customer email, name, or order ID…"
          className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-2 rounded-lg text-sm font-bold bg-white/10 text-slate-300">Clear</button>}
      </form>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'executing', 'completed', 'processing'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${status === s ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>{s}</button>
        ))}
      </div>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : orders.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No {status} orders.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const pf = proofs[o.id];
            const flaggedCount = pf?.items.filter(it => it.flag && it.flag.status !== 'cleared').length || 0;
            const resubCount = pf?.items.filter(it => it.flag?.status === 'resubmitted').length || 0;
            return (
              <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] overflow-hidden">
                <button onClick={() => toggle(o.id)} className="w-full text-left p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold capitalize text-sm">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                    <span role="link" tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); } }}
                      className="block text-xs text-blue-400 hover:underline cursor-pointer truncate max-w-[240px]">{o.targetUrl} ↗</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">{o.user?.email || '—'} · {o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{o.status}</span>
                    {resubCount > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">🔁 {resubCount} re-uploaded</span>
                      : flaggedCount > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">⚠️ {flaggedCount} flagged</span>
                      : <span className="text-[10px] font-bold text-blue-400">{expanded === o.id ? 'Hide ▴' : 'Review proof ▾'}</span>}
                  </div>
                </button>
                {expanded === o.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.06]">
                    {/* Target link — open it in a new tab to confirm the proofs are for THIS account */}
                    <div className="mt-3 flex items-center gap-2 bg-blue-500/[0.07] border border-blue-500/20 rounded-lg px-3 py-2">
                      <span className="text-[11px] text-slate-400 shrink-0">🎯 Target:</span>
                      <a href={o.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline break-all flex-1 min-w-0">{o.targetUrl}</a>
                      <a href={o.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-300 hover:text-white shrink-0 whitespace-nowrap">Open ↗</a>
                      <button onClick={() => { navigator.clipboard?.writeText(o.targetUrl); }}
                        className="text-[10px] text-slate-400 hover:text-white shrink-0">Copy</button>
                    </div>
                    {!pf || pf.loading ? <p className="text-slate-500 text-sm py-4">Loading proofs…</p> : (
                      <>
                        <div className="text-[11px] text-slate-500 my-3">{pf.total} proof(s) · {pf.approved} approved</div>
                        {pf.items.length === 0 ? <p className="text-slate-600 text-xs pb-2">No proof uploaded yet.</p> : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-1">
                            {pf.items.map(p => {
                              const fl = p.flag && p.flag.status !== 'cleared' ? p.flag : null;
                              const resub = fl?.status === 'resubmitted';
                              return (
                              <div key={p.id} className={`rounded-lg overflow-hidden bg-black/30 border ${fl ? (resub ? 'border-yellow-500/40' : 'border-red-500/40') : 'border-white/[0.06]'}`}>
                                {isImg(p.proofUrl) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <a href={p.proofUrl!} target="_blank" rel="noopener noreferrer"><img src={p.proofUrl!} alt="proof" loading="lazy" className="w-full h-24 object-cover hover:opacity-90" /></a>
                                ) : p.proofUrl ? (
                                  <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 text-[10px] text-blue-400 hover:underline px-1 text-center break-all">View ↗</a>
                                ) : <div className="flex items-center justify-center h-24 text-xl">✅</div>}
                                <div className="px-1.5 py-1 text-[9px] text-slate-400 truncate">{p.proofText || p.status}</div>
                                {fl && <div className={`px-1.5 text-[9px] font-bold ${resub ? 'text-yellow-300' : 'text-red-300'}`}>{resub ? '🔁 re-uploaded' : '⚠️ flagged'}{fl.reason ? ` · ${fl.reason}` : ''}</div>}
                                <div className="p-1.5 flex gap-1">
                                  {!fl && (
                                    <button onClick={() => flagProof(o.id, p.id, 'flag')} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag</button>
                                  )}
                                  {fl && (
                                    <button onClick={() => flagProof(o.id, p.id, 'clear')} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50">✅ {resub ? 'Re-verify' : 'Clear'}</button>
                                  )}
                                  {resub && (
                                    <button onClick={() => flagProof(o.id, p.id, 'flag')} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag again</button>
                                  )}
                                </div>
                              </div>
                            );})}
                          </div>
                        )}
                        <button onClick={() => loadProofs(o.id)} className="text-[10px] text-blue-400 hover:underline mt-2">↻ Refresh proofs</button>
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
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true); setErr('');
    af('/api/sabi/admin/custom-requests?limit=50')
      .then(async r => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => {
        if (!ok || (d && d.success === false)) { setErr(d?.error || 'Could not load requests. Try again.'); setReqs([]); return; }
        setReqs(d?.requests || []);
      })
      .catch(() => setErr('Network error loading requests.'))
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
  if (err) return (
    <div className="py-10 text-center">
      <p className="text-red-300 text-sm mb-3">⚠️ {err}</p>
      <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white hover:bg-white/20">Retry</button>
    </div>
  );
  if (reqs.length === 0) return <p className="text-slate-500 py-10 text-center">No requests.</p>;
  return (
    <div className="space-y-3">
      {reqs.map(r => (
        <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold capitalize text-sm">{fmtSvc(r.category)}{r.targetPlatform ? ` · ${r.targetPlatform}` : ''}{r.quantity ? ` · ${r.quantity.toLocaleString()}` : ''}</div>
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

// ─── Partnership / Reseller Requests (read-only for staff) ───────────────────
interface Partnership {
  id: string; brandName?: string | null; domain?: string | null;
  contactPhone?: string | null; notes?: string | null;
  status: string; paidKobo?: number | null; createdAt: string;
}
function PartnershipsTab() {
  const [items, setItems] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true); setErr('');
    af('/api/sabi/admin/partnerships')
      .then(async r => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => {
        if (!ok) { setErr('Could not load partnership requests.'); setItems([]); return; }
        setItems(d?.partnerships || []);
      })
      .catch(() => setErr('Network error loading partnership requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const statusColor = (s: string) =>
    s === 'live' ? 'bg-emerald-500/20 text-emerald-300'
    : s === 'cancelled' ? 'bg-red-500/20 text-red-300'
    : 'bg-yellow-500/15 text-yellow-300';

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  if (err) return (
    <div className="py-10 text-center">
      <p className="text-red-300 text-sm mb-3">⚠️ {err}</p>
      <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white hover:bg-white/20">Retry</button>
    </div>
  );
  if (items.length === 0) return <p className="text-slate-500 py-10 text-center">No partnership requests.</p>;
  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        🤝 Reseller &amp; partnership requests. View-only — the owner approves and changes status from the admin dashboard.
      </p>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-sm">{p.brandName || 'Unnamed brand'}</div>
                {p.domain && <a href={/^https?:\/\//i.test(p.domain) ? p.domain : `https://${p.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{p.domain}</a>}
                <div className="text-[11px] text-slate-500 mt-1">
                  {p.contactPhone && <a href={`https://wa.me/${p.contactPhone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{p.contactPhone}</a>}
                  {p.contactPhone && ' · '}{new Date(p.createdAt).toLocaleDateString()}
                  {typeof p.paidKobo === 'number' && p.paidKobo > 0 && <> · <span className="text-slate-300">₦{(p.paidKobo / 100).toLocaleString()}</span></>}
                </div>
                {p.notes && <div className="text-xs text-slate-300 mt-2 bg-black/30 rounded-lg p-2">{p.notes}</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${statusColor(p.status)}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
