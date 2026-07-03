'use client';

import Link from 'next/link';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { FiHeart, FiStar, FiBookmark, FiUsers, FiArrowRight, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';

/**
 * Studio — a premium launcher for SABI's flagship "products". Pulls Auto Engagement,
 * Book Creators, My Profiles and Team out of the crowded flat nav into big, seen cards
 * so each feels like a destination, not a menu row.
 */
const TOOLS = [
  {
    href: '/sabi/engagement', icon: FiHeart, name: 'Auto Engagement', badge: 'New',
    tagline: 'Fund likes & comments for your next few posts — real Nigerians on every post you publish.',
    from: 'from-pink-500/25', to: 'to-purple-600/25', ring: 'group-hover:border-pink-400/40', chip: 'from-pink-500 to-purple-600',
  },
  {
    href: '/sabi/ugc', icon: FiStar, name: 'Book Creators', badge: 'UGC',
    tagline: 'Hire real Nigerian creators for authentic content, booked and paid safely through SABI.',
    from: 'from-amber-500/25', to: 'to-orange-600/25', ring: 'group-hover:border-amber-400/40', chip: 'from-amber-500 to-orange-600',
  },
  {
    href: '/sabi/profiles', icon: FiBookmark, name: 'My Profiles', badge: null,
    tagline: 'Save the accounts you grow and reorder for any of them in one tap.',
    from: 'from-blue-500/25', to: 'to-cyan-600/25', ring: 'group-hover:border-blue-400/40', chip: 'from-blue-500 to-cyan-600',
  },
  {
    href: '/sabi/team', icon: FiUsers, name: 'Team', badge: null,
    tagline: 'Invite teammates to view activity and place orders on your account.',
    from: 'from-emerald-500/25', to: 'to-teal-600/25', ring: 'group-hover:border-emerald-400/40', chip: 'from-emerald-500 to-teal-600',
  },
  {
    href: '/sabi/growth', icon: FiTrendingUp, name: 'My Growth', badge: null,
    tagline: 'See what you\'ve delivered over time across every platform.',
    from: 'from-violet-500/25', to: 'to-indigo-600/25', ring: 'group-hover:border-violet-400/40', chip: 'from-violet-500 to-indigo-600',
  },
  {
    href: '/sabi/subscriptions', icon: FiRefreshCw, name: 'Auto-Reorders', badge: null,
    tagline: 'Keep the momentum — schedule engagement to repeat automatically.',
    from: 'from-rose-500/25', to: 'to-pink-600/25', ring: 'group-hover:border-rose-400/40', chip: 'from-rose-500 to-pink-600',
  },
];

export default function StudioPage() {
  return (
    <>
      <ModernSabiHeader showNavigation={true} />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Studio
          </div>
          <h1 className="text-[clamp(30px,8vw,44px)] font-black leading-[1.05] tracking-tight text-white">
            Your growth toolkit
          </h1>
          <p className="mt-3 max-w-lg text-slate-400">
            Everything beyond a single order — packages, creators and the tools that keep your growth compounding.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${t.from} ${t.to} p-5 transition-all duration-200 hover:-translate-y-0.5 ${t.ring}`}>
                <div className="absolute inset-0 bg-slate-950/40" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.chip} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {t.badge && (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">{t.badge}</span>
                    )}
                  </div>
                  <div className="mb-1 flex items-center gap-2 text-lg font-black text-white">
                    {t.name}
                    <FiArrowRight className="h-4 w-4 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300/90">{t.tagline}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
