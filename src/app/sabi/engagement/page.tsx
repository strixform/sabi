'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import {
  priceAutoEngagement, AE_LIMITS, AUTO_ENGAGEMENT_PLATFORMS,
  type AutoEngagementPlatform,
} from '@/lib/autoEngagement';

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', twitter: 'X (Twitter)', facebook: 'Facebook',
};
const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString()}`;

interface Post { id: string; postUrl: string; idx: number; status: string; }
interface Pkg {
  id: string; platform: string; profileUrl: string; postsTotal: number; postsSubmitted: number;
  postsCompleted: number; engagersPerPost: number; amountKobo: number; releasedKobo: number;
  status: string; createdAt: string; posts: Post[];
}

export default function EngagementPage() {
  // ── Configurator ──
  const [platform, setPlatform] = useState<AutoEngagementPlatform>('instagram');
  const [profileUrl, setProfileUrl] = useState('');
  const [posts, setPosts] = useState(3);
  const [engagers, setEngagers] = useState(20);
  const [comment, setComment] = useState(true);
  const [commentLikes, setCommentLikes] = useState(2);
  const [buying, setBuying] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const pricing = useMemo(() => priceAutoEngagement({
    platform, posts, engagersPerPost: engagers, mix: { like: true, comment, commentLikes },
  }), [platform, posts, engagers, comment, commentLikes]);

  // ── Packages ──
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sabi/engagement/list');
      if (r.status === 401) { setUnauth(true); return; }
      const d = await r.json();
      setPackages(d.packages || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const buy = async () => {
    setErr(''); setMsg('');
    if (!profileUrl.trim()) { setErr('Paste the link to your profile first.'); return; }
    setBuying(true);
    try {
      const r = await fetch('/api/sabi/engagement/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, profileUrl: profileUrl.trim(), posts, engagersPerPost: engagers, comment, commentLikes }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.needTopUp ? 'Not enough wallet balance — top up and try again.' : (d.error || 'Could not buy')); return; }
      setMsg(`Package created — ${naira(d.chargedKobo)} held in escrow for your next ${d.posts} posts.`);
      setProfileUrl('');
      load();
    } catch { setErr('Something went wrong. Try again.'); } finally { setBuying(false); }
  };

  if (unauth) {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-black text-white">Auto Engagement</h1>
        <p className="mt-3 text-slate-400">Sign in to buy engagement for your next posts.</p>
        <Link href="/sabi/login" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Sign in</Link>
      </main>
    );
  }

  return (
    <>
    <ModernSabiHeader showNavigation={true} />
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white">Auto Engagement</h1>
        <p className="mt-2 text-slate-400">
          Fund real engagement for your <b className="text-white">next few posts</b> in one go. Real Nigerians
          follow you and — each time you publish — like, comment and engage the comments to build organic-looking
          buzz. You only pay per post as it&apos;s delivered and staff-approved.
        </p>
      </header>

      {/* Configurator */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-400">Platform</span>
            <select value={platform} onChange={e => setPlatform(e.target.value as AutoEngagementPlatform)}
              className="w-full rounded-lg border border-white/10 bg-[#0F1420] px-3 py-2.5 text-sm text-white outline-none">
              {AUTO_ENGAGEMENT_PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-400">Your profile link</span>
            <input value={profileUrl} onChange={e => setProfileUrl(e.target.value)}
              placeholder="https://instagram.com/yourusername"
              className="w-full rounded-lg border border-white/10 bg-[#0F1420] px-3 py-2.5 text-sm text-white outline-none" />
          </label>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Number of posts</span><span className="text-white">{posts}</span>
            </span>
            <input type="range" min={AE_LIMITS.minPosts} max={AE_LIMITS.maxPosts} value={posts}
              onChange={e => setPosts(Number(e.target.value))} className="w-full accent-blue-500" />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Engagers per post</span><span className="text-white">{engagers}</span>
            </span>
            <input type="range" min={AE_LIMITS.minEngagers} max={AE_LIMITS.maxEngagers} step={5} value={engagers}
              onChange={e => setEngagers(Number(e.target.value))} className="w-full accent-blue-500" />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={comment} onChange={e => setComment(e.target.checked)} className="h-4 w-4 accent-blue-500" />
            Add comments
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Like other comments:
            <input type="number" min={0} max={10} value={commentLikes}
              onChange={e => setCommentLikes(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              className="w-16 rounded-lg border border-white/10 bg-[#0F1420] px-2 py-1 text-sm text-white outline-none" />
          </label>
        </div>

        {/* Price + buy */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-4">
          <div>
            <div className="text-2xl font-black text-white">{naira(pricing.totalKobo)}</div>
            <div className="text-xs text-slate-400">
              {engagers} engagers × {posts} posts · each does a like{comment ? ' + comment' : ''}{commentLikes ? ` + ${commentLikes} comment-likes` : ''} · {pricing.totalActions.toLocaleString()} actions
            </div>
          </div>
          <button onClick={buy} disabled={buying}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 text-sm font-black text-white disabled:opacity-50">
            {buying ? 'Creating…' : 'Buy package'}
          </button>
        </div>
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}
      </section>

      {/* Active packages */}
      <section>
        <h2 className="mb-4 text-lg font-black text-white">Your packages</h2>
        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading…</p>
        ) : packages.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No packages yet. Buy one above to get started.</p>
        ) : (
          <div className="space-y-4">
            {packages.map(p => <PackageCard key={p.id} pkg={p} onChange={load} />)}
          </div>
        )}
      </section>
    </main>
    </>
  );
}

function PackageCard({ pkg, onChange }: { pkg: Pkg; onChange: () => void }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const canAdd = pkg.status === 'active' && pkg.postsSubmitted < pkg.postsTotal;

  const addPost = async () => {
    setErr('');
    if (!url.trim()) { setErr('Paste your new post link.'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/sabi/engagement/${pkg.id}/add-post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Could not add post'); return; }
      setUrl('');
      onChange();
    } catch { setErr('Something went wrong.'); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-white capitalize">{PLATFORM_LABEL[pkg.platform] || pkg.platform} · {pkg.engagersPerPost} engagers/post</div>
          <a href={pkg.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{pkg.profileUrl}</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sabi/engagement/${pkg.id}/contract`} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/5">
            📄 Contract
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${pkg.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
            {pkg.status}
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-300">
        Posts used <b className="text-white">{pkg.postsSubmitted}/{pkg.postsTotal}</b> · completed <b className="text-white">{pkg.postsCompleted}</b>
        <span className="text-slate-500"> · {naira(pkg.releasedKobo)} of {naira(pkg.amountKobo)} released</span>
      </div>

      {pkg.posts.length > 0 && (
        <ol className="mt-3 space-y-1 text-xs">
          {pkg.posts.map(po => (
            <li key={po.id} className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">#{po.idx}</span>
              <a href={po.postUrl} target="_blank" rel="noreferrer" className="truncate text-blue-400 hover:underline">{po.postUrl}</a>
              <span className="ml-auto shrink-0 rounded px-2 py-0.5 text-[10px] font-bold text-slate-300 bg-white/5">{po.status}</span>
            </li>
          ))}
        </ol>
      )}

      {canAdd ? (
        <div className="mt-4 flex gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPost()}
            placeholder="Paste your new post link as you publish…"
            className="flex-1 rounded-lg border border-white/10 bg-[#0F1420] px-3 py-2 text-sm text-white outline-none" />
          <button onClick={addPost} disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? '…' : '➕ Add post'}
          </button>
        </div>
      ) : pkg.status === 'active' ? (
        <p className="mt-4 text-xs text-slate-500">All {pkg.postsTotal} posts submitted — engagement in progress.</p>
      ) : null}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
