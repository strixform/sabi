'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';

type Conv = { id: string; subject: string; status: string; needsHuman: boolean; lastMessage?: string; updatedAt?: string; lastMessageFromAdmin?: boolean };

// Remember the last reply the customer has actually seen, per conversation, so the list
// can flag "● new reply" when staff/AI answers while they're away (localStorage, no server).
const seenKey = (id: string) => `sabi:support:seen:${id}`;
const markSeen = (id: string, at?: string) => { try { localStorage.setItem(seenKey(id), at || new Date().toISOString()); } catch {} };
const isUnseen = (c: Conv) => { if (!c.lastMessageFromAdmin || !c.updatedAt) return false; try { const seen = localStorage.getItem(seenKey(c.id)); return !seen || seen < c.updatedAt; } catch { return false; } };
type Msg = { id: string; authorName: string; fromAdmin: number; body: string; createdAt: string };

// What's this about? — a quick tap routes the ticket and gives the AI a head-start.
const TOPICS = [
  { emoji: '📦', label: 'My order', subject: 'Order help' },
  { emoji: '💳', label: 'Payment / funding', subject: 'Payment / funding' },
  { emoji: '🚀', label: 'Delivery is slow', subject: 'Slow delivery' },
  { emoji: '↩️', label: 'Refund', subject: 'Refund request' },
  { emoji: '💬', label: 'Something else', subject: 'General question' },
];

export default function SupportPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [status, setStatus] = useState('open');
  const [ratingStars, setRatingStars] = useState<number | null>(null);
  const [rating, setRating] = useState(false);
  const [input, setInput] = useState('');
  const [attachUrl, setAttachUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [composingNew, setComposingNew] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(() => {
    fetch('/api/sabi/support').then(r => r.ok ? r.json() : null).then(d => { setConvs(d?.conversations || []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const loadThread = useCallback((id: string) => {
    fetch(`/api/sabi/support?conversationId=${id}`).then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      setMessages(d.messages || []); setNeedsHuman(!!d.conversation?.needsHuman); setStatus(d.conversation?.status || 'open');
      setRatingStars(d.conversation?.ratingStars ?? null);
      // Viewing the thread = everything in it is now seen (kills the list's "new reply" dot).
      markSeen(id);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  // Poll the open thread so the AI's reply appears within a couple seconds.
  useEffect(() => {
    if (!active) return;
    loadThread(active);
    const t = setInterval(() => loadThread(active), 3000);
    return () => clearInterval(t);
  }, [active, loadThread]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const uploadImage = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/sabi/upload', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (d.url) setAttachUrl(d.url); else alert(d.error || "Couldn't attach that image.");
    } finally { setUploading(false); }
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachUrl) || sending) return;
    setSending(true);
    const img = attachUrl;
    setMessages(m => [...m, { id: 'tmp', authorName: 'You', fromAdmin: 0, body: text || '(screenshot attached)', imageUrl: img || undefined, createdAt: new Date().toISOString() } as any]);
    setInput(''); setAttachUrl(null);
    try {
      const res = await fetch('/api/sabi/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active || undefined, body: text, imageUrl: img, subject: !active && topic ? topic : undefined }) });
      const d = await res.json();
      if (d.conversationId) { setActive(d.conversationId); setComposingNew(false); setTimeout(() => loadThread(d.conversationId), 900); }
      loadList();
    } finally { setSending(false); }
  };

  const talkToHuman = async () => {
    if (!active) return;
    await fetch('/api/sabi/support/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: active }) }).catch(() => {});
    loadThread(active);
  };

  const rate = async (stars: number) => {
    if (!active || rating) return;
    setRating(true); setRatingStars(stars); // optimistic
    try {
      await fetch('/api/sabi/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rate', conversationId: active, stars }) });
    } finally { setRating(false); }
  };

  const openNew = () => { setActive(null); setMessages([]); setComposingNew(true); setNeedsHuman(false); setStatus('open'); setTopic(null); setRatingStars(null); };

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black">💬 Support</h1>
            <p className="text-xs text-slate-500">Chat with us — we usually reply in seconds.</p>
          </div>
          <button onClick={openNew} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>+ New chat</button>
        </div>

        {!active && !composingNew ? (
          <div className="space-y-2">
            {loading ? <div className="text-slate-500 text-sm py-10 text-center">Loading…</div>
              : convs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm font-bold">No chats yet</p>
                  <p className="text-xs text-slate-500 mt-1">Have a question about an order or payment? Start a chat.</p>
                  <button onClick={openNew} className="mt-4 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>Start a chat</button>
                </div>
              ) : convs.map(c => (
                <button key={c.id} onClick={() => { markSeen(c.id, c.updatedAt); setActive(c.id); }} className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-3.5 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {isUnseen(c) && <span className="shrink-0 w-2 h-2 rounded-full bg-blue-400" title="New reply" />}
                      <span className={`text-sm truncate ${isUnseen(c) ? 'font-black text-white' : 'font-bold'}`}>{c.subject || 'Support chat'}</span>
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${c.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-300' : c.needsHuman ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'}`}>{c.status === 'resolved' ? 'resolved' : c.needsHuman ? 'with a teammate' : 'open'}</span>
                  </div>
                  {c.lastMessage && <p className={`text-[11px] truncate mt-1 ${isUnseen(c) ? 'text-slate-300' : 'text-slate-500'}`}>{c.lastMessageFromAdmin ? '↩ ' : ''}{c.lastMessage}</p>}
                </button>
              ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col" style={{ height: '70vh' }}>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.06]">
              <button onClick={() => { setActive(null); setComposingNew(false); loadList(); }} className="text-xs text-slate-400 hover:text-white">←</button>
              <span className="text-sm font-bold">{composingNew ? 'New chat' : 'Support'}</span>
              {needsHuman && <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">a teammate is on it</span>}
              {status === 'resolved' && <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">resolved</span>}
            </div>
            <div className="flex-1 overflow-auto px-3.5 py-3 space-y-2.5">
              {composingNew && messages.length === 0 && (
                <div className="py-4">
                  <p className="text-center text-xs text-slate-500 mb-3">What&apos;s this about? Tap one — then tell us what you need. Include your order link or payment reference if it helps.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {TOPICS.map(t => (
                      <button key={t.subject} onClick={() => setTopic(t.subject)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${topic === t.subject ? 'bg-blue-500/20 text-blue-200 border-blue-500/40' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.06]'}`}>{t.emoji} {t.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${m.fromAdmin ? 'bg-white/[0.06] text-slate-100' : 'text-white'}`} style={m.fromAdmin ? {} : { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                    {m.fromAdmin && <div className="text-[9px] font-black text-slate-400 mb-0.5">{m.authorName || 'SABI Support'}</div>}
                    {(m as any).imageUrl && <a href={(m as any).imageUrl} target="_blank" rel="noreferrer"><img src={(m as any).imageUrl} alt="attachment" className="rounded-lg mb-1 max-h-52 object-contain" /></a>}
                    {m.body}
                  </div>
                </div>
              ))}
              {/* "Typing" while a reply is on its way — the last message is the customer's,
                  the ticket is live, and no human has taken over (the AI answers on the next
                  poll). Reassures the customer someone's on it instead of dead air. */}
              {(sending || (messages.length > 0 && !messages[messages.length - 1].fromAdmin && status !== 'resolved' && !needsHuman && !composingNew)) && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] rounded-2xl px-3.5 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            {status !== 'resolved' && !needsHuman && active && (
              <div className="px-3.5 pb-1"><button onClick={talkToHuman} className="text-[10px] text-slate-500 hover:text-slate-300">🙋 Talk to a human</button></div>
            )}
            {/* Post-resolve rating — how did we do? One tap; disappears once rated. */}
            {status === 'resolved' && active && !composingNew && (
              <div className="px-3.5 py-2.5 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">{ratingStars ? 'Thanks for rating!' : 'How did we do?'}</span>
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => rate(n)} disabled={rating || !!ratingStars} className={`text-lg leading-none disabled:cursor-default ${ratingStars && n <= ratingStars ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'}`} aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>
                  ))}
                </span>
              </div>
            )}
            {attachUrl && (
              <div className="px-3.5 pb-1 flex items-center gap-2">
                <img src={attachUrl} alt="attachment" className="h-10 w-10 rounded object-cover" />
                <span className="text-[10px] text-slate-400">Screenshot attached</span>
                <button onClick={() => setAttachUrl(null)} className="text-[10px] text-red-400">remove</button>
              </div>
            )}
            <div className="flex items-center gap-2 p-2.5 border-t border-white/[0.06]">
              <label className="shrink-0 w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/5 text-lg" title="Attach a screenshot">
                {uploading ? '…' : '📎'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e => uploadImage(e.target.files?.[0])} />
              </label>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Type your message…" className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500/50" />
              <button onClick={send} disabled={sending || (!input.trim() && !attachUrl)} className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>{sending ? '…' : 'Send'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
