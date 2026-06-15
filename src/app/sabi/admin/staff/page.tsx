'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StaffRow { email: string; addedBy: string | null; active: boolean; createdAt: string; }
interface AuditRow { staffEmail: string; action: string; target: string | null; detail: string | null; createdAt: string; }
interface Flagged { orderId: string; note: string | null; reviewedBy: string; reviewedAt: string; serviceType?: string; targetUrl?: string; orderStatus?: string; }

// Auth is by your admin-login session cookie (owner-email account). No token.
function af(url: string, opts: RequestInit = {}) {
  return fetch(url, opts);
}

export default function StaffManagerPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [flagged, setFlagged] = useState<Flagged[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    af('/api/sabi/admin/staff')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) { setStaff(d.staff || []); setAudit(d.audit || []); } })
      .catch(() => {})
      .finally(() => setLoading(false));
    af('/api/sabi/admin/proof-review?flagged=1')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setFlagged(d.flagged || []); })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await af('/api/sabi/admin/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) { setEmail(''); setMsg({ ok: true, text: 'Staff added' }); load(); }
      else setMsg({ ok: false, text: d.error || 'Could not add' });
    } finally { setBusy(false); }
  };

  const remove = async (e: string) => {
    if (!confirm(`Remove staff access for ${e}?`)) return;
    await af(`/api/sabi/admin/staff?email=${encodeURIComponent(e)}`, { method: 'DELETE' }).catch(() => {});
    load();
  };

  const clearFlag = async (orderId: string) => {
    // Mark verified to clear the flag once you've resolved it.
    await af('/api/sabi/admin/proof-review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'verified', note: 'Resolved by owner' }),
    }).catch(() => {});
    setFlagged(f => f.filter(x => x.orderId !== orderId));
  };

  const activeStaff = staff.filter(s => s.active);

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black flex items-center gap-2">🛡️ Staff Access</h1>
          <Link href="/sabi/admin" className="text-sm text-blue-400 hover:underline">← Admin</Link>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Staff are existing SABI accounts you trust to moderate <b>Orders, delivery proofs and Requests</b>.
          They cannot touch payments, refunds, wallets or settings. Every action they take is logged below.
        </p>

        {/* Flagged proofs — what staff marked as incoherent */}
        <div className="rounded-xl p-4 border mb-6"
          style={{ background: flagged.length ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.025)', borderColor: flagged.length ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: flagged.length ? '#fca5a5' : '#94a3b8' }}>
            ⚠️ Flagged proofs ({flagged.length})
          </div>
          {flagged.length === 0 ? (
            <p className="text-sm text-slate-500">No flagged proofs — everything staff reviewed looks coherent.</p>
          ) : (
            <div className="space-y-2">
              {flagged.map(f => (
                <div key={f.orderId} className="flex items-start justify-between gap-3 rounded-lg p-3 bg-black/20">
                  <div className="min-w-0">
                    <div className="font-bold text-sm capitalize">{(f.serviceType || 'order').replace(/_/g, ' ')} · <span className="text-slate-400 font-mono text-xs">{f.orderId.slice(0, 8)}</span></div>
                    {f.targetUrl && <a href={f.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{f.targetUrl}</a>}
                    {f.note && <div className="text-sm text-red-300 mt-1">“{f.note}”</div>}
                    <div className="text-[11px] text-slate-500 mt-0.5">flagged by {f.reviewedBy} · {new Date(f.reviewedAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => clearFlag(f.orderId)} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold shrink-0">Mark resolved</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add staff */}
        <div className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07] mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Add a staff member</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="their SABI account email"
              className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40" />
            <button onClick={add} disabled={busy || !email.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">
              {busy ? 'Adding…' : 'Add staff'}
            </button>
          </div>
          {msg && <div className={`mt-2 text-xs font-bold ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</div>}
          <div className="text-[11px] text-slate-600 mt-2">They must already have a SABI account with this email. Send them to <b>/sabi/staff</b> after adding.</div>
        </div>

        {/* Current staff */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active staff ({activeStaff.length})</div>
        {loading ? <p className="text-slate-500 py-4">Loading…</p> : activeStaff.length === 0 ? (
          <p className="text-slate-500 py-4 text-sm">No staff yet.</p>
        ) : (
          <div className="space-y-2 mb-8">
            {activeStaff.map(s => (
              <div key={s.email} className="flex items-center justify-between rounded-lg p-3 bg-white/[0.025] border border-white/[0.07]">
                <div>
                  <div className="font-bold text-sm">{s.email}</div>
                  <div className="text-[11px] text-slate-500">added {new Date(s.createdAt).toLocaleDateString()}{s.addedBy ? ` by ${s.addedBy}` : ''}</div>
                </div>
                <button onClick={() => remove(s.email)} className="text-xs text-red-400 hover:text-red-300 font-bold">Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Audit log */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent staff activity</div>
        {audit.length === 0 ? (
          <p className="text-slate-500 py-4 text-sm">No activity yet.</p>
        ) : (
          <div className="space-y-1.5">
            {audit.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-white/[0.02] text-xs">
                <div className="min-w-0">
                  <span className="text-cyan-400 font-bold">{a.staffEmail}</span>
                  <span className="text-slate-400"> · {a.action}</span>
                  {a.target && <span className="text-slate-500"> · {a.target.slice(0, 14)}</span>}
                  {a.detail && <span className="text-slate-600"> — {a.detail}</span>}
                </div>
                <span className="text-slate-600 shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
