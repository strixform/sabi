'use client';

import { useEffect, useState } from 'react';

/**
 * The activation anchor for new signups: real, recent deliveries + trust numbers,
 * front and centre. It says "this already works, right now" without a single
 * word of sales pressure — discovered value, not desperation. Pure social proof
 * from /api/sabi/stats/public (anonymised: service + quantity + time only).
 */

type Stats = {
  actionsDelivered: number;
  ordersDelivered: number;
  totalOrders: number;
  recent: { service: string; quantity: number; at: string }[];
};

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);
const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function SabiProofAnchor() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/sabi/stats/public')
      .then((r) => r.json())
      .then((d) => { if (alive && d?.success) setS(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!s || (s.actionsDelivered === 0 && s.ordersDelivered === 0)) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0d1420] to-[#0a0d14] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-black uppercase tracking-wider mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
        </span>
        Real Nigerians, working right now
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat n={fmt(s.actionsDelivered)} l="real actions" />
        <Stat n={fmt(s.ordersDelivered)} l="delivered" />
        <Stat n="Proof ✓" l="on every order" />
      </div>

      <div className="space-y-2">
        {s.recent.slice(0, 4).map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-300 truncate">
              <span className="text-emerald-400 mr-1.5">●</span>
              {r.quantity.toLocaleString()} · {r.service}
            </span>
            <span className="text-slate-500 text-xs shrink-0">{ago(r.at)}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500 font-medium">
        Every action is done by a real person and comes with a screenshot. See it for yourself on your first order.
      </p>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center rounded-xl bg-white/[0.03] border border-white/[0.05] py-3">
      <div className="text-xl sm:text-2xl font-black text-white leading-none">{n}</div>
      <div className="text-[10.5px] text-slate-400 font-semibold mt-1">{l}</div>
    </div>
  );
}
