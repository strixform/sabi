import Link from 'next/link';
import { LANDINGS } from '@/lib/landingServices';
import { pageMetadata, breadcrumbLd, serviceLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Buy Real Nigerian Engagement',
  ogTitle: 'Buy Real Nigerian Followers, Likes & Views · SABI',
  description:
    'Buy real followers, likes, views and more from verified Nigerians across Instagram, TikTok, YouTube, X, Facebook, Spotify and more. Target by state, city and gender. Live naira pricing.',
  path: '/buy',
  keywords:
    'buy followers Nigeria, buy likes Nigeria, buy views Nigeria, SMM Nigeria, social media growth Nigeria, real Nigerian engagement',
});

// Group landings by platform for a tidy directory.
function grouped() {
  const map = new Map<string, typeof LANDINGS>();
  for (const l of LANDINGS) {
    const arr = map.get(l.platform) || [];
    arr.push(l);
    map.set(l.platform, arr as typeof LANDINGS);
  }
  return Array.from(map.entries());
}

export default function BuyHubPage() {
  return (
    <main className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <JsonLd data={[serviceLd(), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Buy', path: '/buy' }])]} />

      <nav className="mb-8 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Buy</span>
      </nav>

      <header className="mb-12">
        <h1 className="text-[clamp(34px,6vw,60px)] font-black leading-[1.05] tracking-tight text-white">
          Buy real Nigerian engagement
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Real followers, likes, views and more — delivered by 300,000 verified Nigerians across every
          major platform. Target by state, city and gender. You only pay for what&apos;s delivered.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sabi/services" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 text-sm font-black text-white transition hover:opacity-90">
            Browse all 50+ services →
          </Link>
          <Link href="/sabi/calculator" className="rounded-xl border border-slate-700 bg-slate-800/40 px-7 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-800">
            See live pricing
          </Link>
        </div>
      </header>

      <div className="space-y-10">
        {grouped().map(([platform, items]) => (
          <section key={platform}>
            <h2 className="mb-4 text-lg font-black text-white">{platform}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((l) => (
                <Link
                  key={l.slug}
                  href={`/buy/${l.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-blue-500/40 hover:bg-slate-900"
                >
                  <div>
                    <div className="font-bold text-white capitalize">{l.platform} {l.unit}</div>
                    <div className="text-xs text-slate-400">{l.tagline}</div>
                  </div>
                  <span className="text-blue-400 transition group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
