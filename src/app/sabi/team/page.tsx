'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';

interface Member { id: string; memberEmail: string; role: string; status: string; invitedAt: string; acceptedAt: string | null }
interface Workspace { ownerId: string; role: string; name: string }
interface Order { id: string; serviceType: string; quantity: number; completedQuantity: number | null; status: string; createdAt: string }
interface Acting { accountId: string; role: string }

const fmtSvc = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const badge = (s: string) => {
  const x = (s || '').toLowerCase();
  if (['active', 'completed', 'admin'].includes(x)) return 'bg-emerald-500/15 text-emerald-300';
  if (['invited', 'pending', 'processing', 'executing', 'member'].includes(x)) return 'bg-yellow-500/15 text-yellow-300';
  return 'bg-slate-600/30 text-slate-300';
};
const canSpend = (role: string) => role === 'member' || role === 'admin';

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [acting, setActing] = useState<Acting | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<Workspace | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, w] = await Promise.all([
        fetch('/api/sabi/team').then((r) => r.json()),
        fetch('/api/sabi/team/workspaces').then((r) => r.json()),
      ]);
      setMembers(m.members || []);
      setWorkspaces(w.workspaces || []);
      setActing(w.acting || null);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/sabi/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), role }) });
      const d = await res.json();
      setMsg(res.ok ? d.message : d.error);
      if (res.ok) { setEmail(''); load(); }
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm('Remove this person’s access?')) return;
    await fetch(`/api/sabi/team?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    load();
  }

  async function switchTo(ownerId: string | null) {
    const res = await fetch('/api/sabi/team/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId }) });
    if (res.ok) {
      // Cookie changed for the whole app — reload so wallet/orders/dashboard reflect it.
      window.location.href = ownerId ? '/sabi/dashboard' : '/sabi/team';
    } else {
      const d = await res.json(); setMsg(d.error || 'Could not switch');
    }
  }

  async function openWorkspace(w: Workspace) {
    setViewing(w); setOrders([]); setOrdersLoading(true);
    try {
      const d = await fetch(`/api/sabi/team/orders?ownerId=${encodeURIComponent(w.ownerId)}`).then((r) => r.json());
      setOrders(d.orders || []);
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  }

  const actingName = acting ? (workspaces.find((w) => w.ownerId === acting.accountId)?.name || 'another account') : null;

  return (
    <div className="mx-auto max-w-3xl p-4 text-slate-100 sm:p-6">
      <h1 className="text-2xl font-bold">Team</h1>
      <p className="mt-1 text-sm text-slate-400">Invite teammates to your account. <b>Viewers</b> can only see activity; <b>Members</b> can place orders (spends your balance); <b>Admins</b> can also manage the team.</p>

      {/* Acting-as banner */}
      {acting && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-600/50 bg-amber-950/30 p-3">
          <div className="text-sm text-amber-200">⚡ You are acting as <b>{actingName}</b> ({acting.role}). New orders &amp; wallet activity affect <b>their</b> account.</div>
          <button onClick={() => switchTo(null)} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold hover:bg-slate-600">Switch back to my account</button>
        </div>
      )}

      {/* Owner: your team */}
      <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Your team</h2>
        <form onSubmit={invite} className="mt-3 flex flex-wrap gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@email.com"
            className="min-w-[180px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500" />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500">
            <option value="viewer">Viewer</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button disabled={busy || !email.trim()} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold disabled:opacity-40">
            {busy ? '…' : 'Invite'}
          </button>
        </form>
        {msg && <div className="mt-2 text-xs text-slate-300">{msg}</div>}
        <div className="mt-4 space-y-2">
          {members.length === 0 && <div className="text-sm text-slate-600">No teammates yet.</div>}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div>
                <div className="text-sm">{m.memberEmail}</div>
                <div className="text-[11px] text-slate-500">invited {new Date(m.invitedAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge(m.role)}`}>{m.role}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge(m.status)}`}>{m.status}</span>
                <button onClick={() => remove(m.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Member: shared with you */}
      <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Shared with you</h2>
        {workspaces.length === 0 && <div className="mt-3 text-sm text-slate-600">No accounts have shared access with you.</div>}
        <div className="mt-3 space-y-2">
          {workspaces.map((w) => (
            <div key={w.ownerId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-sm">{w.name} <span className={`ml-2 rounded px-2 py-0.5 text-[10px] font-bold ${badge(w.role)}`}>{w.role}</span></div>
              <div className="flex gap-2">
                <button onClick={() => openWorkspace(w)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-slate-500">👁 View orders</button>
                {canSpend(w.role) && acting?.accountId !== w.ownerId && (
                  <button onClick={() => switchTo(w.ownerId)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500">Switch in →</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {viewing && (
          <div className="mt-4">
            <div className="mb-2 text-xs text-slate-400">Viewing <b>{viewing.name}</b> · read-only</div>
            {ordersLoading ? <div className="text-sm text-slate-500">Loading…</div> : (
              <div className="space-y-2">
                {orders.length === 0 && <div className="text-sm text-slate-600">No orders.</div>}
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{fmtSvc(o.serviceType)} · {(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge(o.status)}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
