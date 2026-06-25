'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const PLATFORMS = ['all', 'instagram', 'tiktok', 'twitter', 'youtube', 'facebook', 'snapchat', 'threads'];

interface Creator {
  id: string; platform: string; handle: string; followers: number;
  niche: string | null; priceNaira: number;
  profileScreenshotUrl: string | null; analyticsScreenshotUrl: string | null;
}

/**
 * UGC marketplace gallery (stage b) — buyers browse approved real creators and
 * pick one before booking. Shows the creator's own social profile + stats; the
 * fulfillment source is never revealed.
 */
export default function UGCMarketplacePage() {
  const [platform, setPlatform] = useState('all');
  const [niche, setNiche] = useState('');
  const [minFollowers, setMinFollowers] = useState(0);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Creator | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (platform !== 'all') qs.set('platform', platform);
    if (niche.trim()) qs.set('niche', niche.trim());
    if (minFollowers) qs.set('minFollowers', String(minFollowers));
    fetch(`/api/sabi/ugc/creators?${qs.toString()}`)
      .then(r => r.json())
      .then(d => setCreators(d.creators || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform, niche, minFollowers]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black">🌟 UGC Creators</h1>
          <Link href="/sabi/order" className="text-xs text-slate-400 hover:text-white">New order →</Link>
        </div>
        <p className="text-sm text-slate-400 mb-4">Book real Nigerian creators for authentic shoutouts & content. Pick who you want, then request a booking.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none">
            {PLATFORMS.map(p => <option key={p} value={p}>{p === 'all' ? 'All platforms' : p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
          <input value={niche} onChange={e => setNiche(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Niche (e.g. fashion)" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none" />
          <select value={minFollowers} onChange={e => setMinFollowers(Number(e.target.value))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none">
            <option value={0}>Any size</option>
            <option value={1000}>1k+ followers</option>
            <option value={10000}>10k+ followers</option>
            <option value={50000}>50k+ followers</option>
            <option value={100000}>100k+ followers</option>
          </select>
        </div>

        {loading ? <p className="text-slate-500 text-sm">Loading creators…</p> : creators.length === 0 ? (
          <p className="text-slate-500 text-sm">No creators match your filters yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {creators.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                {c.profileScreenshotUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.profileScreenshotUrl} alt={c.handle} loading="lazy" className="w-full h-36 object-cover" />
                ) : <div className="w-full h-36 grid place-items-center text-4xl bg-slate-800">🌟</div>}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black">@{c.handle}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{c.platform}</span>
                  </div>
                  <div className="text-xs text-emerald-300 font-bold mt-0.5">{c.followers.toLocaleString()} followers</div>
                  {c.niche && <div className="text-[11px] text-slate-400 mt-0.5">{c.niche}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black">{c.priceNaira > 0 ? `₦${c.priceNaira.toLocaleString()}` : 'Ask'}<span className="text-[10px] text-slate-500 font-normal">/post</span></span>
                    <button onClick={() => setSelected(c)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold">View & book</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail / book modal */}
        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}>
            <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-700 p-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-lg">@{selected.handle}</span>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
              </div>
              <div className="text-xs text-emerald-300 font-bold mb-2">{selected.followers.toLocaleString()} followers · {selected.platform}{selected.niche ? ` · ${selected.niche}` : ''}</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {selected.profileScreenshotUrl && <a href={selected.profileScreenshotUrl} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.profileScreenshotUrl} alt="profile" className="w-full h-28 object-cover rounded-lg" /></a>}
                {selected.analyticsScreenshotUrl && <a href={selected.analyticsScreenshotUrl} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.analyticsScreenshotUrl} alt="analytics" className="w-full h-28 object-cover rounded-lg" /></a>}
              </div>
              <div className="text-sm font-black mb-3">{selected.priceNaira > 0 ? `₦${selected.priceNaira.toLocaleString()} / post` : 'Price on request'}</div>
              <button disabled className="w-full py-2.5 rounded-xl bg-emerald-600/40 text-white/70 font-black text-sm cursor-not-allowed">Booking coming soon</button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5">Secure booking + escrow is rolling out next.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
