"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Msg { from: "me" | "bot"; text: string; chips?: { label: string; href: string }[] }
const SUGGESTIONS = ["What's my balance?", "Where is my order?", "How do I place an order?", "How do refunds work?"];

/**
 * Floating SABI assistant — answers buyers from their real wallet/order data. Rule-based, instant.
 * Only shown to logged-in users. Never reveals how fulfilment works beyond "real people".
 */
export default function SabiAssistant() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Hi 👋 Ask me about your wallet, orders, refunds, or how to place an order." }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hidden = !pathname || pathname.startsWith("/sabi/admin");

  useEffect(() => {
    if (hidden) return;
    fetch("/api/sabi/auth/me").then(r => r.ok ? r.json() : null).then(d => setAuthed(!!(d && (d.id || d.user))))
      .catch(() => setAuthed(false));
  }, [hidden]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send(text: string) {
    const query = text.trim(); if (!query || busy) return;
    setMsgs(m => [...m, { from: "me", text: query }]); setQ(""); setBusy(true);
    try {
      const d = await fetch("/api/sabi/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) }).then(r => r.json());
      setMsgs(m => [...m, { from: "bot", text: d.answer || "I'm not sure — try Support.", chips: d.chips }]);
    } catch { setMsgs(m => [...m, { from: "bot", text: "Network hiccup — try again." }]); } finally { setBusy(false); }
  }

  if (hidden || !authed) return null;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Ask SABI" className="fixed z-[55] right-4 bottom-20 sm:bottom-6 h-14 w-14 rounded-full grid place-items-center shadow-2xl text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>
          <span className="text-2xl">💬</span>
        </button>
      )}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(env(safe-area-inset-bottom)+4px)]">
          <div className="mx-auto max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl bg-slate-900 border border-cyan-500/25" style={{ maxHeight: "70vh" }}>
            <div className="flex items-center justify-between px-4 py-3 bg-cyan-500/10">
              <div className="flex items-center gap-2"><span className="text-lg">🤖</span><div className="text-sm font-black text-white">SABI Assistant</div></div>
              <button onClick={() => setOpen(false)} className="text-slate-400 px-2">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${m.from === "me" ? "text-white" : "text-slate-100 bg-white/[0.06]"}`} style={m.from === "me" ? { background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" } : undefined}>{m.text}</div>
                    {m.chips && m.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {m.chips.map((ch, j) => (
                          <Link key={j} href={ch.href} onClick={() => setOpen(false)} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">{ch.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="text-[11px] text-slate-500 px-1">typing…</div>}
              <div ref={endRef} />
            </div>
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">{s}</button>)}
              </div>
            )}
            <div className="flex gap-2 p-3 border-t border-white/[0.06]">
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(q); }} placeholder="Ask anything…" className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" />
              <button onClick={() => send(q)} disabled={busy} className="px-4 rounded-xl font-black text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0ea5e9)" }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
