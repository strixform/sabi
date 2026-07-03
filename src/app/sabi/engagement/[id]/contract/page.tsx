'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', twitter: 'X (Twitter)', facebook: 'Facebook',
};
const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString()}`;

interface Pkg {
  id: string; platform: string; profileUrl: string; postsTotal: number; postsSubmitted: number;
  postsCompleted: number; engagersPerPost: number; amountKobo: number; releasedKobo: number;
  status: string; createdAt: string;
}

/**
 * SABI → Buyer service agreement for one Auto Engagement package. Anonymised by design:
 * fulfilment is described only as "a vetted network of real people" — never gamers360 or
 * taskers (see the no-reveal rule).
 */
export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'unauth'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/sabi/engagement/list');
        if (r.status === 401) { setState('unauth'); return; }
        const d = await r.json();
        const found = (d.packages || []).find((p: Pkg) => p.id === id);
        if (!found) { setState('notfound'); return; }
        setPkg(found); setState('ok');
      } catch { setState('notfound'); }
    })();
  }, [id]);

  if (state === 'loading') return <main className="mx-auto max-w-2xl px-5 py-24 text-center text-slate-500">Loading…</main>;
  if (state === 'unauth') return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <p className="text-slate-400">Sign in to view your agreement.</p>
      <Link href="/sabi/login" className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white">Sign in</Link>
    </main>
  );
  if (state === 'notfound' || !pkg) return <main className="mx-auto max-w-2xl px-5 py-24 text-center text-slate-500">Agreement not found.</main>;

  const platform = PLATFORM_LABEL[pkg.platform] || pkg.platform;
  const date = new Date(pkg.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/sabi/engagement" className="text-sm text-blue-400 hover:underline">← Back</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Print / Save PDF</button>
      </div>

      <article className="rounded-2xl border border-white/10 bg-white p-8 text-slate-800 print:border-0 print:p-0">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <div className="text-2xl font-black tracking-tight text-slate-900">SABI</div>
          <div className="text-xs text-slate-500">sability.io · Nigeria&apos;s Social Infrastructure</div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Auto Engagement Service Agreement</h1>
          <div className="mt-1 text-xs text-slate-500">Agreement ref: {pkg.id} · {date}</div>
        </header>

        <section className="space-y-4 text-sm leading-relaxed">
          <p>
            This agreement is between <b>SABI</b> (&quot;the Provider&quot;) and the account holder placing this
            order (&quot;the Client&quot;). By purchasing this package, the Client engages SABI to deliver the
            social engagement described below.
          </p>

          <div className="rounded-lg bg-slate-50 p-4 text-[13px]">
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-slate-500">Platform</span><span className="font-semibold text-right">{platform}</span>
              <span className="text-slate-500">Profile</span><span className="truncate font-semibold text-right">{pkg.profileUrl}</span>
              <span className="text-slate-500">Posts covered</span><span className="font-semibold text-right">{pkg.postsTotal}</span>
              <span className="text-slate-500">Engagers per post</span><span className="font-semibold text-right">{pkg.engagersPerPost}</span>
              <span className="text-slate-500">Total value (escrow)</span><span className="font-semibold text-right">{naira(pkg.amountKobo)}</span>
            </div>
          </div>

          <ol className="list-decimal space-y-2 pl-5">
            <li><b>Scope.</b> SABI will deliver engagement — follows, likes, comments and comment interactions — on the Client&apos;s next {pkg.postsTotal} published posts on the profile above, at up to {pkg.engagersPerPost} engagers per post.</li>
            <li><b>Fulfilment.</b> Engagement is carried out by a vetted network of real people. No bots, and no automated accounts, are used at any point.</li>
            <li><b>Timing.</b> Each post is worked as soon as the Client submits its link from their dashboard. The Client agrees to submit each new post promptly and to keep the account public for the duration.</li>
            <li><b>Escrow &amp; payment.</b> The full amount is held in escrow by SABI and recognised post-by-post as each post is delivered.</li>
            <li><b>Delivery guarantee.</b> The Client pays only for what is delivered. If any post under-delivers, the undelivered portion is automatically refunded to the Client&apos;s wallet, per post.</li>
            <li><b>Access.</b> SABI never requires the Client&apos;s password or login. Only public post/profile links are used.</li>
            <li><b>Unused slots.</b> Post slots not submitted within 30 days are refunded to the Client&apos;s wallet and the package is closed.</li>
            <li><b>Conduct.</b> The Client shall not use this service for content that is unlawful or violates the target platform&apos;s terms. SABI may decline or halt delivery for such content.</li>
          </ol>

          <p className="text-xs text-slate-500">
            This document is issued by SABI to the Client and records the terms of the Auto Engagement package
            referenced above. Delivery is subject to SABI&apos;s standard Terms of Service.
          </p>
        </section>

        <footer className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4">
          <div>
            <div className="text-xs text-slate-500">Provider</div>
            <div className="font-bold text-slate-900">SABI</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Issued</div>
            <div className="font-semibold text-slate-900">{date}</div>
          </div>
        </footer>
      </article>
    </main>
  );
}
