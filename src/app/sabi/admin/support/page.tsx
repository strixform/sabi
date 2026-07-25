'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';

// Auth works two ways for SABI admins: the owner's token-based main-admin login
// (x-admin-token) OR a staff SabiSession cookie. Send the token when present so the
// owner reaches this inbox from /sabi/admin, and fall back to the cookie for staff.
function af(url: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('sabi_admin_token') : null;
  return fetch(url, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { 'x-admin-token': token } : {}) } });
}

type Conv = { id: string; subject: string; status: string; needsHuman: boolean; assignedAdmin?: string | null; lastMessage?: string; customer?: { name?: string; email?: string } };
type Msg = { id: string; authorName: string; fromAdmin: number; internal: number; body: string; createdAt: string };

export default function AdminSupportPage() {
  const [tab, setTab] = useState<'human' | 'open'>('human');
  const [convs, setConvs] = useState<Conv[]>([]);
  const [counts, setCounts] = useState({ openCount: 0, humanCount: 0 });
  const [active, setActive] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { if (new URLSearchParams(location.search).get('human') === '1') setTab('human'); } catch {} }, []);

  const load = useCallback(() => {
    setLoading(true);
    af(`/api/sabi/admin/support?${tab === 'human' ? 'human=1' : ''}`).then(r => r.ok ? r.json() : null).then(d => {
      setConvs(d?.conversations || []); setCounts({ openCount: d?.openCount || 0, humanCount: d?.humanCount || 0 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); const t = setInterval(load, 12000); return () => clearInterval(t); }, [load]);

  const openThread = useCallback((c: Conv) => {
    setActive(c);
    af(`/api/sabi/admin/support?conversationId=${c.id}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setMessages(d.messages || []); }).catch(() => {});
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [messages]);

  const act = async (action: string, body?: string) => {
    if (!active) return;
    setBusy(true);
    try {
      const res = await af('/api/sabi/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active.id, action, body }) });
      if (res.ok) {
        if (action === 'reply') { setReply(''); openThread(active); }
        if (action === 'resolve') { setActive(null); }
        load();
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black mb-1">💬 Support Inbox</h1>
        <p className="text-xs text-slate-500 mb-4">The AI answers most tickets. This is what needs a human. Every <span className="text-violet-300 font-bold">🤖 AI</span> reply is shown in-thread.</p>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('human')} className={`px-3.5 py-2 rounded-xl text-sm font-bold ${tab === 'human' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400'}`}>🙋 Needs human <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-black/30">{counts.humanCount}</span></button>
          <button onClick={() => setTab('open')} className={`px-3.5 py-2 rounded-xl text-sm font-bold ${tab === 'open' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-slate-400'}`}>All open <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-black/30">{counts.openCount}</span></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-4">
          {/* List */}
          <div className="space-y-2">
            {loading ? <div className="text-slate-500 text-sm py-8 text-center">Loading…</div>
              : convs.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-500">{tab === 'human' ? '✨ Nothing needs a human — the AI has it.' : 'No open tickets.'}</div>
              : convs.map(c => (
                <button key={c.id} onClick={() => openThread(c)} className={`w-full text-left rounded-xl border p-3 transition ${active?.id === c.id ? 'border-blue-500/50 bg-blue-500/[0.06]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold truncate">{c.customer?.name || 'Customer'}</span>
                    {c.needsHuman && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0">🙋 human</span>}
                    {c.status === 'resolved' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 shrink-0">resolved</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{c.subject}</div>
                  {c.lastMessage && <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMessage}</div>}
                </button>
              ))}
          </div>

          {/* Thread */}
          {active ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col" style={{ height: '72vh' }}>
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{active.customer?.name || 'Customer'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{active.customer?.email}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => act('resolve')} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/20 text-emerald-300 disabled:opacity-40">✓ Resolve</button>
                  <button onClick={() => act('release')} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-slate-300 disabled:opacity-40" title="Hand back to the AI">↩ To AI</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto px-3.5 py-3 space-y-2">
                {messages.map(m => (
                  Number(m.internal) === 1 ? (
                    <div key={m.id} className="text-center text-[10px] text-slate-500 italic py-1">{m.body}</div>
                  ) : (
                    <div key={m.id} className={`flex ${Number(m.fromAdmin) === 1 ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${Number(m.fromAdmin) === 1 ? 'bg-blue-600/25 text-slate-100' : 'bg-white/[0.06] text-slate-100'}`}>
                        <div className="text-[9px] font-black mb-0.5 flex items-center gap-1" style={{ color: '#64748b' }}>
                          {Number(m.fromAdmin) === 1 ? m.authorName : (active.customer?.name || 'Customer')}
                          {m.authorName === 'SABI Support' && <span className="px-1 py-0.5 rounded bg-violet-500/20 text-violet-300">🤖 AI</span>}
                        </div>
                        {(m as any).imageUrl && <a href={(m as any).imageUrl} target="_blank" rel="noreferrer"><img src={(m as any).imageUrl} alt="attachment" className="rounded-lg mb-1 max-h-56 object-contain" /></a>}
                        {m.body}
                      </div>
                    </div>
                  )
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex items-center gap-2 p-2.5 border-t border-white/[0.06]">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && reply.trim()) act('reply', reply.trim()); }}
                  placeholder="Reply as SABI Support…" className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                <button onClick={() => reply.trim() && act('reply', reply.trim())} disabled={busy || !reply.trim()} className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>Send</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-sm text-slate-500" style={{ height: '72vh' }}>Select a ticket</div>
          )}
        </div>
      </div>
    </div>
  );
}
