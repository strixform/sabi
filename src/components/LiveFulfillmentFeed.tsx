'use client';

import React, { useState, useEffect } from 'react';

type Item = { service: string; quantity: number; at: string };

/**
 * Live fulfillment feed — a rotating social-proof ticker of recent real orders.
 * Pulls /api/sabi/stats/public (cached 5 min) which returns sanitized items
 * (service + quantity + time only — no user identity, no source). Hides itself
 * if there's nothing to show, so it never renders an empty/awkward bar.
 */
export function LiveFulfillmentFeed({ className = '' }: { className?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/sabi/stats/public')
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d?.recent)) setItems(d.recent.filter((x: Item) => x?.service && x?.quantity)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const it = items[idx % items.length];

  const ago = (iso: string) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 bg-emerald-500/[0.07] border border-emerald-500/20 overflow-hidden ${className}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span key={idx} className="text-[11px] sm:text-xs text-slate-300 truncate animate-[fadeIn_0.4s_ease]">
        <b className="text-emerald-300">{it.quantity.toLocaleString()}</b> {it.service}
        <span className="text-slate-500"> · delivered {ago(it.at)}</span>
      </span>
      <span className="ml-auto text-[9px] uppercase tracking-wider text-emerald-400/60 font-bold shrink-0">Live</span>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
