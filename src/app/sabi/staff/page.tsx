'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Tab = 'proofs' | 'reuploads' | 'checked' | 'refunds' | 'refills' | 'requests' | 'partnerships';

interface Order {
  id: string; serviceType: string; targetUrl: string; quantity: number;
  completedQuantity: number | null; status: string; createdAt: string;
  staffChecked?: boolean; staffCheckedAt?: string | null; staffCheckedBy?: string | null;
  startCount?: number | null; startScreenshotUrl?: string | null;
  user?: { email: string; name: string } | null;
}
interface ProofFlag { status: string; reason: string | null; reuploadedAt: string | null; }
interface Proof {
  id: string; proofUrl: string | null; proofText: string | null; status: string; createdAt: string;
  flag?: ProofFlag | null; staffApproved?: boolean;
  username?: string | null; bankName?: string | null; accountName?: string | null;
}
interface Refill {
  id: string; orderId: string; serviceType: string; targetUrl: string;
  refillQuantity: number; reason: string | null; status: string; createdAt: string;
  startCount?: number | null; startScreenshotUrl?: string | null;
  originalQuantity?: number | null; completedQuantity?: number | null; estimatedCount?: number | null;
}
interface CustomReq {
  id: string; category?: string; status: string; description: string;
  name: string; email: string; whatsapp: string; targetUrl?: string | null;
  targetPlatform?: string | null; quantity?: number | null; budget?: string | null; createdAt: string;
}

const isImg = (u?: string | null) => !!u && /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(u);
const fmtSvc = (s?: string | null) => (s || 'request').replace(/_/g, ' ');

// Preset flag reasons staff can pick (plus a free-text box for anything else).
const FLAG_REASONS = [
  'Wrong account/page — proof is for a different target',
  'Screenshot does not show the action completed',
  'Fake, edited or reused screenshot',
  'Action not actually performed (no like/follow/comment visible)',
  'Engagement dropped / was undone',
  'Comment does not match the buyer’s brief',
  'Mentioned Gamerz / revealed the source',
  'Low quality or spammy engagement',
  'Blurry or unreadable screenshot',
];

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
          <button onClick={() => setTab('reuploads')}
            className="w-full text-left mb-4 rounded-xl px-4 py-3 flex items-center gap-2 transition hover:brightness-110"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)' }}>
            <span className="text-lg">🔁</span>
            <span className="text-sm font-bold text-yellow-300">{resub} re-upload{resub > 1 ? 's' : ''} waiting for re-review</span>
            <span className="text-xs text-yellow-200/70 ml-auto">Open Re-uploads →</span>
          </button>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            ['proofs', '🧾 Orders & Proofs'],
            ['reuploads', `🔁 Re-uploads${resub > 0 ? ` (${resub})` : ''}`],
            ['checked', '✅ Checked Orders'],
            ['refunds', '↩️ Refunds'],
            ['refills', '🔁 Refills'],
            ['requests', '📋 Requests'],
            ['partnerships', '🤝 Partnerships'],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'proofs' && <ProofsTab />}
        {tab === 'reuploads' && <ReuploadsTab />}
        {tab === 'checked' && <CheckedOrdersTab />}
        {tab === 'refunds' && <StaffRefundsTab />}
        {tab === 'refills' && <RefillsTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'partnerships' && <PartnershipsTab />}
      </div>
    </div>
  );
}

// ─── Orders & Proofs ─────────────────────────────────────────────────────────
// Staff refill — type a quantity to top up THIS order with fresh, non-banned taskers.
function StaffRefillControl({ orderId }: { orderId: string }) {
  const [qty, setQty]   = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState('');
  const submit = async () => {
    const q = Math.floor(Number(qty) || 0);
    if (q < 1) { setMsg('Enter a quantity'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await af('/api/sabi/admin/refills', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, quantity: q }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok && d.success ? `✅ ${d.message}` : `❌ ${d.error || 'Failed'}`);
      if (res.ok) setQty('');
    } catch { setMsg('❌ Network error'); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-emerald-300 font-bold shrink-0">🔄 Refill to new taskers:</span>
        <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty"
          className="w-20 bg-[#0F1420] border border-white/10 rounded px-2 py-1 text-xs" />
        <button onClick={submit} disabled={busy}
          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50">
          {busy ? '…' : 'Create refill'}
        </button>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">Free top-up — buyer not charged · goes to fresh taskers (anyone who did this order is blocked).</div>
      {msg && <div className={`text-[10px] mt-1 ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</div>}
    </div>
  );
}

function ProofsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all'); // show every order by default
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, { loading: boolean; items: Proof[]; total: number; approved: number }>>({});
  const [proofBusy, setProofBusy] = useState<string | null>(null);
  // Flag-reason modal
  const [flagTarget, setFlagTarget] = useState<{ orderId: string; completionId: string } | null>(null);
  const [flagPresets, setFlagPresets] = useState<string[]>([]);
  const [flagNote, setFlagNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = status === 'all' ? '' : `&status=${status}`;
    const s = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    // Only orders NOT yet marked checked — checked ones live in the "Checked Orders" tab.
    af(`/api/sabi/admin/staff-orders?checked=0&limit=50${q}${s}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setOrders(d?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status, search]);
  useEffect(() => { load(); }, [load]);

  // Approve a single proof (staff confirms it's correct → won't be re-checked).
  const approveProof = async (orderId: string, completionId: string) => {
    setProofBusy(completionId);
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action: 'approve' }),
      });
      if (res.ok) setProofs(p => {
        const cur = p[orderId]; if (!cur) return p;
        return { ...p, [orderId]: { ...cur, items: cur.items.map(it => it.id === completionId ? { ...it, staffApproved: true } : it) } };
      });
    } finally { setProofBusy(null); }
  };

  // Bulk selection per order → approve or flag many proofs at once.
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const toggleSel = (orderId: string, cid: string) => setSelected(s => {
    const cur = new Set(s[orderId] || []);
    cur.has(cid) ? cur.delete(cid) : cur.add(cid);
    return { ...s, [orderId]: cur };
  });
  const selCount = (orderId: string) => (selected[orderId]?.size || 0);
  const setAllSel = (orderId: string, ids: string[]) => setSelected(s => ({ ...s, [orderId]: new Set(ids) }));
  const clearSel = (orderId: string) => setSelected(s => ({ ...s, [orderId]: new Set() }));

  const bulkAct = async (orderId: string, action: 'approve' | 'flag') => {
    const ids = [...(selected[orderId] || [])];
    if (!ids.length) return;
    let reason = '';
    if (action === 'flag') { reason = prompt('Flag reason for the selected proofs (tasker sees this):') || ''; if (!reason) return; }
    setProofBusy('bulk:' + orderId);
    try {
      await Promise.all(ids.map(cid => af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId: cid, action, reason }),
      })));
      setProofs(p => {
        const cur = p[orderId]; if (!cur) return p;
        return { ...p, [orderId]: { ...cur, items: cur.items.map(it => !ids.includes(it.id) ? it
          : action === 'approve' ? { ...it, staffApproved: true }
          : { ...it, flag: { status: 'flagged', reason, reuploadedAt: null } }) } };
      });
      clearSel(orderId);
    } finally { setProofBusy(null); }
  };

  // Mark the whole order reviewed → it leaves this list and moves to Checked Orders.
  const [checking, setChecking] = useState<string | null>(null);
  const markChecked = async (orderId: string) => {
    setChecking(orderId);
    try {
      const res = await af('/api/sabi/admin/order-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, checked: true }),
      });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== orderId));
    } finally { setChecking(null); }
  };

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

  // Open the reason picker for a flag. Clearing skips it (no reason needed).
  const openFlag = (orderId: string, completionId: string) => {
    setFlagTarget({ orderId, completionId });
    setFlagPresets([]);
    setFlagNote('');
  };

  // Flag (or clear) a SPECIFIC proof → gamerz360 notifies that exact tasker, and
  // surfaces whether this flag triggered a final warning or auto-suspension.
  const doFlag = async (orderId: string, completionId: string, action: 'flag' | 'clear', reason = '') => {
    setProofBusy(completionId);
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action, reason }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.success) {
        setProofs(p => {
          const cur = p[orderId]; if (!cur) return p;
          return { ...p, [orderId]: { ...cur, items: cur.items.map(it => it.id === completionId
            ? { ...it, flag: action === 'clear' ? null : { status: 'flagged', reason, reuploadedAt: null } } : it) } };
        });
        if (action === 'flag') {
          if (d.suspended) alert('🚫 This was the final strike — the tasker has been AUTO-SUSPENDED.');
          else if (d.finalWarning) alert('🚨 Final warning sent — the tasker will be suspended on their next flag.');
        }
      } else {
        alert(d.error || 'Could not flag this proof.');
      }
    } finally { setProofBusy(null); }
  };

  const submitFlag = async () => {
    if (!flagTarget) return;
    const reason = [...flagPresets, flagNote.trim()].filter(Boolean).join(' · ');
    if (!reason) { alert('Pick at least one reason or type one.'); return; }
    const { orderId, completionId } = flagTarget;
    setFlagTarget(null);
    await doFlag(orderId, completionId, 'flag', reason);
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
                    <div className="text-[10px] font-mono text-violet-300 mb-0.5">SABI #{o.id}</div>
                    <div className="font-bold capitalize text-sm">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                    <span role="link" tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); } }}
                      className="block text-xs text-blue-400 hover:underline cursor-pointer truncate max-w-[240px]">{o.targetUrl} ↗</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">{o.user?.email || '—'} · {new Date(o.createdAt).toLocaleDateString()}</div>
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
                    {/* Buyer's starting count + "before" screenshot (compulsory at order time). */}
                    {(o.startCount != null || o.startScreenshotUrl) && (
                      <div className="mt-3 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                        <span className="text-[11px] text-slate-400 shrink-0">📊 Start count:</span>
                        <span className="text-xs font-bold text-white">{o.startCount != null ? o.startCount.toLocaleString() : '—'}</span>
                        {o.startScreenshotUrl && <a href={o.startScreenshotUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-400 hover:underline ml-auto shrink-0">view before-shot ↗</a>}
                      </div>
                    )}
                    <StaffRefillControl orderId={o.id} />
                    {!pf || pf.loading ? <p className="text-slate-500 text-sm py-4">Loading proofs…</p> : (
                      <>
                        <div className="flex items-center justify-between gap-2 my-3 flex-wrap">
                          <div className="text-[11px] text-slate-500">{pf.total} proof(s) · {pf.approved} approved{selCount(o.id) > 0 ? ` · ${selCount(o.id)} selected` : ''}</div>
                          {pf.items.length > 0 && (() => {
                            const selectable = pf.items.filter(it => !(it.flag && it.flag.status !== 'cleared')).map(it => it.id);
                            const allSel = selectable.length > 0 && selectable.every(id => selected[o.id]?.has(id));
                            return (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => allSel ? clearSel(o.id) : setAllSel(o.id, selectable)}
                                  className="px-2 py-1 rounded bg-white/10 text-slate-300 text-[10px] font-bold hover:bg-white/20">{allSel ? 'Unselect all' : 'Select all'}</button>
                                <button disabled={selCount(o.id) === 0 || !!proofBusy} onClick={() => bulkAct(o.id, 'approve')}
                                  className="px-2 py-1 rounded bg-emerald-600/80 text-white text-[10px] font-bold disabled:opacity-40">✓ Approve sel.</button>
                                <button disabled={selCount(o.id) === 0 || !!proofBusy} onClick={() => bulkAct(o.id, 'flag')}
                                  className="px-2 py-1 rounded bg-red-600/80 text-white text-[10px] font-bold disabled:opacity-40">⚠️ Flag sel.</button>
                              </div>
                            );
                          })()}
                        </div>
                        {pf.items.length === 0 ? <p className="text-slate-600 text-xs pb-2">No proof uploaded yet.</p> : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-1">
                            {pf.items.map(p => {
                              const fl = p.flag && p.flag.status !== 'cleared' ? p.flag : null;
                              const resub = fl?.status === 'resubmitted';
                              return (
                              <div key={p.id} className={`relative rounded-lg overflow-hidden bg-black/30 border ${selected[o.id]?.has(p.id) ? 'border-blue-500/70 ring-1 ring-blue-500/40' : fl ? (resub ? 'border-yellow-500/40' : 'border-red-500/40') : 'border-white/[0.06]'}`}>
                                {!fl && (
                                  <label className="absolute top-1 left-1 z-10 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!selected[o.id]?.has(p.id)} onChange={() => toggleSel(o.id, p.id)}
                                      className="w-4 h-4 accent-blue-500" />
                                  </label>
                                )}
                                {isImg(p.proofUrl) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <a href={p.proofUrl!} target="_blank" rel="noopener noreferrer"><img src={p.proofUrl!} alt="proof" loading="lazy" className="w-full h-24 object-cover hover:opacity-90" /></a>
                                ) : p.proofUrl ? (
                                  <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 text-[10px] text-blue-400 hover:underline px-1 text-center break-all">View ↗</a>
                                ) : <div className="flex items-center justify-center h-24 text-xl">✅</div>}
                                <div className="px-1.5 py-1 text-[9px] text-slate-400 truncate">{p.proofText || p.status}</div>
                                {/* Tasker identity — spot two screenshots from the SAME person (double account) */}
                                {(p.username || p.bankName) && (
                                  <div className="px-1.5 pb-1 text-[8.5px] leading-tight text-slate-500">
                                    {p.username && <div className="truncate">👤 {p.username}</div>}
                                    {(p.bankName || p.accountName) && <div className="truncate text-amber-400/80">🏦 {[p.bankName, p.accountName].filter(Boolean).join(' · ')}</div>}
                                  </div>
                                )}
                                {p.staffApproved && !fl && <div className="px-1.5 text-[9px] font-bold text-emerald-400">✓ approved</div>}
                                {fl && <div className={`px-1.5 text-[9px] font-bold ${resub ? 'text-yellow-300' : 'text-red-300'}`}>{resub ? '🔁 re-uploaded' : '⚠️ flagged'}{fl.reason ? ` · ${fl.reason}` : ''}</div>}
                                <div className="p-1.5 flex gap-1">
                                  {!fl && !p.staffApproved && (
                                    <button onClick={() => approveProof(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50">✓ Approve</button>
                                  )}
                                  {!fl && (
                                    <button onClick={() => openFlag(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag</button>
                                  )}
                                  {fl && (
                                    <button onClick={() => doFlag(o.id, p.id, 'clear')} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50">✅ {resub ? 'Re-verify' : 'Clear'}</button>
                                  )}
                                  {resub && (
                                    <button onClick={() => openFlag(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag again</button>
                                  )}
                                </div>
                              </div>
                            );})}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.05]">
                          <button onClick={() => loadProofs(o.id)} className="text-[10px] text-blue-400 hover:underline">↻ Refresh proofs</button>
                          {/* Done reviewing this order → moves it to Checked Orders, shrinking the queue */}
                          <button onClick={() => markChecked(o.id)} disabled={checking === o.id}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black disabled:opacity-50">
                            {checking === o.id ? 'Saving…' : '✓ Mark order checked'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Flag-reason picker */}
      {flagTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setFlagTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#0b0f1a] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-black text-white mb-1">Why are you flagging this proof?</h3>
            <p className="text-xs text-slate-400 mb-3">The tasker sees this and must re-upload within 12h. Pick all that apply, and/or add a note.</p>
            <div className="space-y-1.5 mb-3 max-h-[42vh] overflow-y-auto">
              {FLAG_REASONS.map(r => {
                const on = flagPresets.includes(r);
                return (
                  <button key={r} type="button"
                    onClick={() => setFlagPresets(prev => on ? prev.filter(x => x !== r) : [...prev, r])}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition border ${on ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:border-white/20'}`}>
                    {on ? '☑ ' : '☐ '}{r}
                  </button>
                );
              })}
            </div>
            <textarea value={flagNote} onChange={e => setFlagNote(e.target.value.slice(0, 280))} rows={2}
              placeholder="Add a specific note (or type your own reason)…"
              className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/40 resize-none mb-3" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setFlagTarget(null)} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-slate-300 hover:bg-white/20">Cancel</button>
              <button onClick={submitFlag} className="px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white">Flag proof</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Re-uploads (flagged → resubmitted, awaiting re-review) ─────────────────────
function ReuploadsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    af('/api/sabi/admin/resubmitted').then(r => (r.ok ? r.json() : null))
      .then(d => setItems(d?.items || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (completionId: string, action: 'clear' | 'flag', reason = '') => {
    setBusy(completionId); setMsg('');
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action, reason }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.success) { setItems(prev => prev.filter(i => i.completionId !== completionId)); setMsg(action === 'clear' ? 'Approved.' : 'Flagged again — tasker must re-upload.'); }
      else setMsg(d?.error || 'Action failed');
    } finally { setBusy(null); }
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
        🔁 Proofs taskers RE-UPLOADED after you flagged them — review each one here as it comes. <b className="text-emerald-300">✅ Re-verify</b> if it&apos;s now correct, or <b className="text-red-300">⚠️ Flag again</b> if still wrong. They stay out of the main &quot;Orders &amp; Proofs&quot; list so nothing gets buried.
      </p>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : items.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No re-uploads waiting. ✅</p>
      ) : (
        <div className="space-y-2.5">
          {msg && <p className="text-[11px] font-bold text-emerald-300">{msg}</p>}
          {items.map(it => (
            <div key={it.completionId} className="rounded-xl bg-white/[0.025] border border-yellow-500/30 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {it.sabiOrderId && <div className="text-[10px] font-mono text-violet-300">SABI #{it.sabiOrderId}</div>}
                  <div className="text-sm font-bold text-white truncate mt-0.5">{fmtSvc(it.campaignTitle) || 'Re-uploaded proof'}</div>
                  {/* Target link — staff cross-check the re-upload against THIS account */}
                  {it.targetUrl && (
                    <div className="flex items-center gap-2 mt-1 bg-blue-500/[0.07] border border-blue-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] text-slate-400 shrink-0">🎯</span>
                      <a href={it.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline break-all flex-1 min-w-0">{it.targetUrl}</a>
                      <a href={it.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-300 shrink-0">Open ↗</a>
                    </div>
                  )}
                  {it.reason && <p className="text-[11px] mt-1 text-red-300/90">Original flag: {it.reason}</p>}
                  <div className="text-[10px] text-slate-600 mt-1">re-uploaded {it.reuploadedAt ? new Date(it.reuploadedAt).toLocaleString() : '—'}</div>
                </div>
                {it.newProofUrl && (isImg(it.newProofUrl)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <a href={it.newProofUrl} target="_blank" rel="noreferrer" className="shrink-0"><img src={it.newProofUrl} alt="re-upload" loading="lazy" className="w-20 h-20 object-cover rounded-lg" /></a>
                  : <a href={it.newProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline shrink-0">view ↗</a>)}
              </div>
              <div className="flex gap-2 mt-2.5">
                <button disabled={busy === it.completionId} onClick={() => act(it.completionId, 'clear')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">✅ Re-verify (approve)</button>
                <button disabled={busy === it.completionId} onClick={() => { const r = prompt('Why is it still wrong? (tasker sees this)'); if (r) act(it.completionId, 'flag', r); }} className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs font-bold disabled:opacity-50">⚠️ Flag again</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Checked Orders (already reviewed) ──────────────────────────────────────────
function CheckedOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const s = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    af(`/api/sabi/admin/staff-orders?checked=1&limit=100${s}`).then(r => (r.ok ? r.json() : null))
      .then(d => setOrders(d?.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const undo = async (orderId: string) => {
    setBusy(orderId);
    try {
      const res = await af('/api/sabi/admin/order-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, checked: false }) });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== orderId));
    } finally { setBusy(null); }
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✅ Orders you&apos;ve marked fully checked. Use &quot;Re-open&quot; to send one back to the to-review list.</p>
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order id / email…" className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none" />
      </div>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : orders.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No checked orders yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-violet-300">SABI #{o.id}</div>
                <div className="text-sm font-bold capitalize truncate">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                <div className="text-[10px] text-slate-500">{o.user?.email || '—'} · checked {o.staffCheckedAt ? new Date(o.staffCheckedAt).toLocaleDateString() : ''}{o.staffCheckedBy ? ` by ${o.staffCheckedBy}` : ''}</div>
              </div>
              <button disabled={busy === o.id} onClick={() => undo(o.id)} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20 disabled:opacity-50 shrink-0">↩ Re-open</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Refunds (customer complaints) ──────────────────────────────────────────────
function StaffRefundsTab() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => { af('/api/sabi/admin/refunds').then(r => (r.ok ? r.json() : null)).then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  const runSearch = async () => {
    if (!search.trim()) { setResults(null); return; }
    const r = await af(`/api/sabi/admin/refunds?search=${encodeURIComponent(search.trim())}`);
    const j = await r.json().catch(() => ({}));
    setResults(j.results || []);
  };
  const card = (o: any) => (
    <div key={o.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-violet-300">SABI #{o.id}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${o.status === 'failed' ? 'bg-red-500/15 text-red-300' : o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>{o.status}</span>
        <span className="text-slate-300 capitalize">{fmtSvc(o.serviceType)}</span>
        <span className="text-slate-500">· {o.delivered.toLocaleString()}/{o.quantity.toLocaleString()} · ₦{o.totalNaira.toLocaleString()}</span>
      </div>
      {(o.email || o.name) && <div className="text-[10px] text-slate-500 mt-1">{o.name || ''} {o.email ? `· ${o.email}` : ''}</div>}
      {o.refundReason && <p className="text-[11px] text-amber-200/90 mt-1">{o.refundReason}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">When a customer complains about a refund, search their order id or email to see its exact status &amp; reason.</p>
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder="Order id or customer email…" className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none" />
        <button onClick={runSearch} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">Search</button>
        {results !== null && <button onClick={() => { setSearch(''); setResults(null); }} className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 text-sm">Clear</button>}
      </div>
      {results !== null ? (
        <div className="space-y-2">{results.length === 0 ? <p className="text-sm text-slate-500">No matching orders.</p> : results.map(card)}</div>
      ) : loading ? <p className="text-slate-500 py-6 text-center">Loading…</p> : (
        <>
          <div>
            <div className="text-[11px] font-bold text-amber-300 mb-2">⏳ About to partial-refund (stalled past 72h) · {d?.pending?.length ?? 0}</div>
            <div className="space-y-2">{(d?.pending?.length ?? 0) === 0 ? <p className="text-xs text-slate-500">Nothing stalled. ✅</p> : d.pending.map(card)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 mb-2">↩️ Recent auto-refunds · {d?.recent?.length ?? 0}</div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">{(d?.recent?.length ?? 0) === 0 ? <p className="text-xs text-slate-500">No refunds. ✅</p> : d.recent.map(card)}</div>
          </div>
        </>
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
  const [qty, setQty] = useState<Record<string, string>>({}); // staff-decided top-up

  const load = () => {
    setLoading(true);
    af('/api/sabi/admin/refills?status=pending')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { const list = d?.refills || []; setRefills(list); setQty(Object.fromEntries(list.map((r: Refill) => [r.id, String(r.refillQuantity)]))); })
      .catch(() => setRefills([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    // Approving uses the EXACT quantity the staff typed — nothing else gets topped up.
    const q = Math.floor(Number(qty[id]) || 0);
    if (action === 'approve' && q < 1) { alert('Enter the refill quantity to approve.'); return; }
    setBusy(id);
    try {
      const res = await af('/api/sabi/admin/refills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: notes[id] || '', quantity: q }),
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
          <div className="text-[10px] font-mono text-violet-300">SABI #{r.orderId}</div>
          <div className="font-bold capitalize text-sm mt-0.5">{fmtSvc(r.serviceType)} · <span className="text-cyan-400">buyer asked {r.refillQuantity.toLocaleString()}</span></div>
          <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{r.targetUrl} ↗</a>
          <div className="text-[11px] text-slate-500 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>

          {/* Original-order baseline so staff can size the top-up correctly */}
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { l: 'Start count', v: r.startCount != null ? r.startCount.toLocaleString() : '—' },
              { l: 'Bought', v: r.originalQuantity != null ? r.originalQuantity.toLocaleString() : '—' },
              { l: 'Est. final', v: r.estimatedCount != null ? r.estimatedCount.toLocaleString() : '—' },
              { l: 'Delivered', v: r.completedQuantity != null ? r.completedQuantity.toLocaleString() : '—' },
            ].map(s => (
              <div key={s.l} className="rounded-lg bg-black/30 px-2.5 py-1.5">
                <div className="text-[9px] text-slate-500 uppercase">{s.l}</div>
                <div className="text-sm font-bold text-white">{s.v}</div>
              </div>
            ))}
          </div>
          {r.startScreenshotUrl && <a href={r.startScreenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] font-bold text-blue-400 hover:underline mt-1.5">📸 view buyer&apos;s before-shot ↗</a>}
          {r.reason && <div className="text-sm text-slate-300 mt-2 bg-black/30 rounded-lg p-2">“{r.reason}”</div>}

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-400 shrink-0">Refill to approve:</label>
              <input type="number" min={1} value={qty[r.id] ?? ''} onChange={e => setQty(p => ({ ...p, [r.id]: e.target.value }))}
                className="w-28 bg-[#0F1420] border border-emerald-500/30 rounded-lg px-3 py-2 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-500/60" />
              <span className="text-[10px] text-slate-500">only this exact amount is topped up</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                placeholder="Optional note to buyer…"
                className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
              <div className="flex gap-2">
                <button onClick={() => act(r.id, 'approve')} disabled={busy === r.id} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Approve {qty[r.id] ? Number(qty[r.id]).toLocaleString() : ''}</button>
                <button onClick={() => act(r.id, 'reject')} disabled={busy === r.id} className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Reject</button>
              </div>
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
