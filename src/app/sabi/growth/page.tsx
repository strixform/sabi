'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getServiceById } from '@/lib/servicesCatalog';

interface Row { targetUrl: string; serviceType: string; delivered: number; ordered: number; orders: number; lastAt: string; }

export default function GrowthPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ delivered: 0, profiles: 0, services: 0 });
  const [rows, setRows] = useState<Row[]>([]);
  const [timeline, setTimeline] = useState<{ month: string; delivered: number }[]>([]);

  useEffect(() => {
    fetch('/api/sabi/growth').then(r => r.json()).then(d => {
      if (d.success) { setTotals(d.totals); setRows(d.perProfile || []); setTimeline(d.timeline || []); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Group service rows under each profile (targetUrl).
  const profiles = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) { (map.get(r.targetUrl) || map.set(r.targetUrl, []).get(r.targetUrl)!).push(r); }
    return Array.from(map.entries())
      .map(([url, items]) => ({ url, items, total: items.reduce((s, i) => s + i.delivered, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const maxMonth = Math.max(...timeline.map(t => t.delivered), 1);
  const prettyUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 48);
  const svcLabel = (id: string) => getServiceById(id)?.name || id.replace(/_/g, ' ');
  const svcIcon = (id: string) => getServiceById(id)?.icon || '📈';

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-black text-white">📈 Your Growth</h1>
          <p className="text-sm text-slate-400 mt-1">Everything we&apos;ve delivered to your profiles — see your momentum and top it up.</p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total delivered', value: totals.delivered.toLocaleString(), color: 'text-emerald-400' },
            { label: 'Profiles grown', value: totals.profiles.toLocaleString(), color: 'text-blue-400' },
            { label: 'Services used', value: totals.services.toLocaleString(), color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{s.label}</div>
              <div className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Monthly delivered trend */}
        {timeline.length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-6">
            <div className="text-xs font-bold text-slate-400 mb-3">Delivered per month</div>
            <div className="flex items-end gap-2 h-28">
              {timeline.map(t => (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="text-[9px] text-emerald-300 opacity-0 group-hover:opacity-100 transition">{t.delivered.toLocaleString()}</div>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-green-400"
                    style={{ height: `${Math.max((t.delivered / maxMonth) * 96, 3)}px` }} />
                  <span className="text-[8px] text-slate-600">{t.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-profile breakdown */}
        {loading ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center text-sm text-slate-500">Loading your growth…</div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-10 text-center">
            <div className="text-4xl mb-2 opacity-60">🌱</div>
            <p className="text-white font-bold">No delivered orders yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">Place your first order and watch your profiles grow here.</p>
            <Link href="/sabi/order" className="inline-flex px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-sm font-bold hover:bg-emerald-500/25 transition">Start an order →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map(p => (
              <div key={p.url} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-bold text-white truncate hover:text-emerald-300 transition">{prettyUrl(p.url)}</a>
                  <span className="text-xs font-black text-emerald-400 shrink-0">{p.total.toLocaleString()} delivered</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.items.map(it => (
                    <div key={it.serviceType} className="flex items-center gap-2.5 rounded-xl bg-black/30 px-3 py-2">
                      <span className="text-lg shrink-0">{svcIcon(it.serviceType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate capitalize">{svcLabel(it.serviceType)}</div>
                        <div className="text-[10px] text-slate-500">{it.orders} order{it.orders !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-400">{it.delivered.toLocaleString()}</div>
                        {it.ordered > it.delivered && <div className="text-[9px] text-slate-500">of {it.ordered.toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/sabi/order?reorder=1&serviceId=${encodeURIComponent(p.items[0].serviceType)}&quantity=${p.items[0].ordered}&url=${encodeURIComponent(p.url)}`}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/25 transition">
                  ↻ Top up this profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
