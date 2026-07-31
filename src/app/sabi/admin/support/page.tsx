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

type Ctx = { wallet: { balanceNaira: number; totalSpentNaira: number }; orders: { id: string; serviceType: string; status: string; quantity: number; delivered: number; targetUrl: string; priceNaira: number; createdAt: string }[] };
type Conv = { id: string; subject: string; status: string; needsHuman: boolean; assignedAdmin?: string | null; lastMessage?: string; customer?: { name?: string; email?: string }; context?: Ctx | null; ratingStars?: number | null; ratingFeedback?: string | null };
type Msg = { id: string; authorName: string; fromAdmin: number; internal: number; body: string; createdAt: string };

// Quick replies for the questions that come up every day — one tap fills the box.
const CANNED: { label: string; text: string }[] = [
  { label: 'Looking into it', text: "Thanks for reaching out! I'm checking this for you right now and will update you shortly. 🙏" },
  { label: 'Started / be patient', text: 'Your order has started and is being delivered gradually by real people — it should complete soon. Thanks for your patience!' },
  { label: 'Send the link', text: 'Could you share the exact link you ordered for so I can check it? A screenshot of your profile helps too.' },
  { label: 'Private profile', text: 'It looks like your account may be set to private — please switch it to public so delivery can go through, then let me know. 🙏' },
  { label: 'Resolved?', text: 'This should be sorted now — is everything looking good on your end?' },
];
const ngn = (n: number) => '₦' + Math.round(n || 0).toLocaleString();

export default function AdminSupportPage() {
  const [tab, setTab] = useState<'human' | 'open'>('human');
  const [convs, setConvs] = useState<Conv[]>([]);
  const [counts, setCounts] = useState({ openCount: 0, humanCount: 0 });
  const [active, setActive] = useState<Conv | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [threadRating, setThreadRating] = useState<{ stars: number | null; feedback: string | null }>({ stars: null, feedback: null });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { if (new URLSearchParams(location.search).get('human') === '1') setTab('human'); } catch {} }, []);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    af(`/api/sabi/admin/support?${tab === 'human' ? 'human=1' : ''}`).then(r => r.ok ? r.json() : null).then(d => {
      // Only replace the list when the fetch actually succeeded. A transient/expired-auth
      // poll returns null — KEEP what's on screen instead of blanking it to "No tickets"
      // every 12s (that flash-to-empty is what read as "it bounced back").
      if (d) { setConvs(d.conversations || []); setCounts({ openCount: d.openCount || 0, humanCount: d.humanCount || 0 }); }
    }).catch(() => {}).finally(() => { if (!silent) setLoading(false); });
  }, [tab]);
  useEffect(() => { load(); const t = setInterval(() => load(true), 12000); return () => clearInterval(t); }, [load]);

  const openThread = useCallback((c: Conv) => {
    // Switching threads clears the draft + note toggle so a half-typed reply can never
    // land on the wrong customer (the box is shared across conversations).
    setActive(c); setReply(''); setNote(false); setCtx(null); setThreadRating({ stars: null, feedback: null });
    af(`/api/sabi/admin/support?conversationId=${c.id}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setMessages(d.messages || []); setCtx(d.conversation?.context || null); setThreadRating({ stars: d.conversation?.ratingStars ?? null, feedback: d.conversation?.ratingFeedback ?? null }); }
    }).catch(() => {});
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [messages]);

  const act = async (action: string, body?: string) => {
    if (!active) return;
    setBusy(true);
    // Optimistic reply bubble so sending feels instant (and, on failure, we can roll it back
    // AND tell the agent WHY — the old code swallowed failures silently, which read as
    // "I hit send and nothing happened / it glitched").
    const isNote = action === 'reply' ? note : false;
    const optimistic: Msg | null = action === 'reply' && body
      ? { id: 'tmp' + Date.now(), authorName: isNote ? 'Note' : 'SABI Support', fromAdmin: 1, internal: isNote ? 1 : 0, body, createdAt: new Date().toISOString() }
      : null;
    if (optimistic) setMessages(m => [...m, optimistic]);
    try {
      const res = await af('/api/sabi/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active.id, action, body, internal: action === 'reply' ? note : undefined }) });
      if (res.ok) {
        if (action === 'reply') { setReply(''); setNote(false); openThread(active); }
        if (action === 'resolve') { setActive(null); }
        load(true);
      } else {
        // Surface the real reason instead of failing silently — this is what made staff
        // think the inbox was "still glitching / can't respond".
        if (optimistic) setMessages(m => m.filter(x => x.id !== optimistic.id));
        const d = await res.json().catch(() => ({} as any));
        alert(res.status === 401 || res.status === 403
          ? 'Your admin session has expired or isn’t recognized here. Reload this page (and sign in again if asked), then send your reply.'
          : (d?.error || `Couldn’t send — server error ${res.status}. Please try again.`));
      }
    } catch {
      if (optimistic) setMessages(m => m.filter(x => x.id !== optimistic.id));
      alert('Network problem — your reply didn’t send. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  // AI-drafted reply: reads the customer's real orders/payments + the thread and fills the
  // box with a grounded draft the agent reviews and sends. Never sends on its own.
  const suggest = async () => {
    if (!active || suggesting) return;
    setSuggesting(true);
    try {
      const res = await af('/api/sabi/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active.id, action: 'suggest' }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.draft) { setReply(d.draft); setNote(false); } else alert(d?.error || "Couldn't draft a reply.");
    } catch { alert("Couldn't reach the AI. Try again."); }
    finally { setSuggesting(false); }
  };

  // Re-verify this customer's pending deposits with Flutterwave and credit any that landed —
  // the "I paid but it's not in my wallet" recovery. Idempotent + provider-verified.
  const recheck = async () => {
    if (!active || rechecking) return;
    setRechecking(true);
    try {
      const res = await af('/api/sabi/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active.id, action: 'recheck' }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) alert(d?.error || 'Recheck failed.');
      else alert(d.summary || (d.found > 0 ? `Credited ${d.found} payment(s).` : 'Nothing new confirmed yet.'));
      openThread(active);
    } catch { alert("Couldn't reach the server. Try again."); }
    finally { setRechecking(false); }
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
                  <button onClick={recheck} disabled={rechecking} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600/20 text-blue-300 disabled:opacity-40" title="Re-check this customer's payments with Flutterwave and credit any that landed">{rechecking ? 'Rechecking…' : '🔄 Recheck pay'}</button>
                  <button onClick={() => act('resolve')} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/20 text-emerald-300 disabled:opacity-40">✓ Resolve</button>
                  <button onClick={() => act('release')} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-slate-300 disabled:opacity-40" title="Hand back to the AI">↩ To AI</button>
                </div>
              </div>

              {/* Customer context — wallet + recent orders inline, so the agent answers from
                  facts (their real orders/payments) instead of guessing. */}
              {ctx && (
                <div className="px-3.5 py-2 border-b border-white/[0.06] bg-white/[0.015]">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 font-bold text-slate-300">Wallet {ngn(ctx.wallet.balanceNaira)}</span>
                    <span className="text-slate-500">lifetime {ngn(ctx.wallet.totalSpentNaira)}</span>
                  </div>
                  {ctx.orders.length > 0 && (
                    <details className="mt-1.5">
                      <summary className="text-[11px] text-slate-400 cursor-pointer select-none">🧾 Recent orders ({ctx.orders.length})</summary>
                      <div className="mt-1.5 space-y-1">
                        {ctx.orders.map(o => (
                          <a key={o.id} href={/^https?:\/\//.test(o.targetUrl) ? o.targetUrl : `https://${o.targetUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] px-2 py-1.5 text-[11px]">
                            <span className="font-bold text-slate-200 truncate">{o.serviceType}</span>
                            <span className="text-slate-500 shrink-0">×{o.quantity.toLocaleString()} · {ngn(o.priceNaira)} · {o.delivered}/{o.quantity}</span>
                            <span className={`shrink-0 px-1.5 py-0.5 rounded font-black ${o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : o.status === 'partial' ? 'bg-amber-500/15 text-amber-300' : o.status === 'refunded' || o.status === 'cancelled' ? 'bg-red-500/15 text-red-300' : 'bg-blue-500/15 text-blue-300'}`}>{o.status}</span>
                          </a>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
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
              {threadRating.stars != null && (
                <div className="px-3.5 py-1.5 text-[11px] text-amber-300 border-t border-white/[0.06]">
                  Customer rated this <span className="font-black">{'★'.repeat(threadRating.stars)}</span>{threadRating.feedback ? <span className="text-slate-400"> — “{threadRating.feedback}”</span> : null}
                </div>
              )}
              {/* AI-suggest + canned quick replies — one tap fills the box; the agent reviews then sends. */}
              <div className="flex flex-wrap gap-1.5 px-2.5 pt-2">
                <button onClick={suggest} disabled={suggesting} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-500/20 text-violet-200 disabled:opacity-40" title="Draft a reply from this customer's orders, payments and message">
                  {suggesting ? '✨ Reading their account…' : '✨ AI reply'}
                </button>
                {CANNED.map(q => (
                  <button key={q.label} onClick={() => setReply(q.text)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-slate-300 hover:bg-white/10">{q.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2.5 border-t border-white/[0.06]">
                <label className={`shrink-0 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer select-none ${note ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'}`} title="Internal note — the customer never sees this">
                  <input type="checkbox" checked={note} onChange={e => setNote(e.target.checked)} className="hidden" /> 🔒 Note
                </label>
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && reply.trim()) act('reply', reply.trim()); }}
                  placeholder={note ? "Private note (customer won't see this)…" : 'Reply as SABI Support…'} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                <button onClick={() => reply.trim() && act('reply', reply.trim())} disabled={busy || !reply.trim()} className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: note ? '#f59e0b' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>{note ? 'Add note' : 'Send'}</button>
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
