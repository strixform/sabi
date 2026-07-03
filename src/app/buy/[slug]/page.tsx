import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLanding, allLandingSlugs, landingFaqs, LANDINGS } from '@/lib/landingServices';
import { pageMetadata, serviceLd, breadcrumbLd, faqLd, SITE } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamicParams = false; // only the slugs we define; anything else = 404

export function generateStaticParams() {
  return allLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) return {};
  return pageMetadata({
    title: l.metaTitle,
    ogTitle: `${l.h1} · SABI`,
    description: l.metaDescription,
    path: `/buy/${l.slug}`,
    keywords: l.keywords,
  });
}

export default async function BuyLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLanding(slug);
  if (!l) notFound();

  const faqs = landingFaqs(l);
  const orderUrl = `/sabi/order?serviceId=${l.serviceId}`;
  // A few cross-links for internal linking / discovery.
  const related = LANDINGS.filter((x) => x.slug !== l.slug).slice(0, 6);

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <JsonLd
        data={[
          serviceLd(),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Buy', path: '/buy' },
            { name: l.h1, path: `/buy/${l.slug}` },
          ]),
          faqLd(faqs),
        ]}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/buy" className="hover:text-white">Buy</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{l.platform} {l.unit}</span>
      </nav>

      {/* Hero */}
      <header className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-300">
          Powered by 300,000 real Nigerians
        </div>
        <h1 className="text-[clamp(34px,6vw,64px)] font-black leading-[1.05] tracking-tight text-white">
          {l.h1}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">{l.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={orderUrl}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-90"
          >
            Start your order →
          </Link>
          <Link
            href="/sabi/calculator"
            className="rounded-xl border border-slate-700 bg-slate-800/40 px-7 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
          >
            See live pricing
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section className="mb-12 max-w-3xl">
        <p className="text-lg leading-relaxed text-slate-300">{l.intro}</p>
      </section>

      {/* Benefits */}
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-black text-white">Why buy {l.platform} {l.unit} from SABI</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {l.benefits.map((b, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <span className="mt-0.5 shrink-0 text-lg">✅</span>
              <p className="text-sm leading-relaxed text-slate-300">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-black text-white">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: '01', t: 'Choose & fund', b: `Pick your ${l.platform} ${l.unit} and fund your wallet in naira — takes a minute.` },
            { n: '02', t: 'Paste your link', b: `Drop your public ${l.platform} link. No password, ever. Target by state, city and gender.` },
            { n: '03', t: 'Watch it grow', b: 'Real Nigerians start acting within minutes, paced naturally so it stays safe.' },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-2 text-sm font-black text-blue-400">{s.n}</div>
              <div className="mb-1 font-bold text-white">{s.t}</div>
              <p className="text-sm leading-relaxed text-slate-400">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mb-14 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-4">
        {[
          ['Real Nigerians', 'Never bots'],
          ['Target', 'State · city · gender'],
          ['No password', 'Public link only'],
          ['Fair', 'Pay only for delivered'],
        ].map(([t, s]) => (
          <div key={t}>
            <div className="font-black text-white">{t}</div>
            <div className="text-xs text-slate-400">{s}</div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-black text-white">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <summary className="cursor-pointer list-none font-bold text-white marker:hidden">
                <span className="mr-2 text-blue-400 transition group-open:rotate-90 inline-block">▸</span>
                {f.q}
              </summary>
              <p className="mt-3 pl-6 text-sm leading-relaxed text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mb-14 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/15 to-purple-600/15 p-8 text-center">
        <h2 className="text-2xl font-black text-white">Ready to grow your {l.platform}?</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-300">
          Join thousands of Nigerian creators and brands growing with real engagement.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={orderUrl} className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 text-sm font-black text-white transition hover:opacity-90">
            Start your order →
          </Link>
          <Link href="/sabi/register" className="rounded-xl border border-slate-700 bg-slate-800/40 px-7 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-800">
            Create free account
          </Link>
        </div>
      </section>

      {/* Related / internal links */}
      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-400">More services</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/buy/${r.slug}`}
              className="rounded-full border border-slate-700 bg-slate-800/40 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              {r.platform} {r.unit}
            </Link>
          ))}
          <Link href="/sabi/services" className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">
            All 50+ services →
          </Link>
        </div>
      </section>

      <p className="mt-12 text-center text-xs text-slate-600">
        {SITE.name} — {SITE.tagline}
      </p>
    </main>
  );
}
