'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiSearch, FiClock, FiCheckCircle, FiArrowRight, FiStar, FiUsers, FiMapPin,
  FiMessageCircle, FiZap, FiShield, FiTrendingUp,
} from 'react-icons/fi';
import {
  SiInstagram, SiX, SiYoutube, SiTiktok, SiSnapchat, SiSpotify,
  SiWhatsapp, SiPinterest, SiThreads, SiTelegram, SiTwitch,
  SiFacebook, SiGoogle, SiApple, SiApplepodcasts, SiAudiomack, SiApplemusic,
} from 'react-icons/si';
import { FaLinkedinIn } from 'react-icons/fa';
import { FiGlobe, FiMusic } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { SERVICES_CATALOG, computePricing, getPlatformLabel } from '@/lib/servicesCatalog';

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: SiInstagram, twitter: SiX,       youtube:   SiYoutube,  tiktok:    SiTiktok,
  snapchat:  SiSnapchat,  spotify: SiSpotify, whatsapp:  SiWhatsapp, pinterest: SiPinterest,
  audiomack: SiAudiomack, boomplay: FiMusic, apple_music: SiApplemusic,
  threads:   SiThreads,   telegram: SiTelegram, twitch:  SiTwitch,
  facebook:  SiFacebook,  google:  SiGoogle,  linkedin:  FaLinkedinIn,
  app_store: SiApple,     podcast: SiApplepodcasts, website: FiGlobe,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-600',
  twitter: 'from-blue-400 to-blue-600',
  youtube: 'from-red-500 to-red-700',
  tiktok: 'from-slate-700 to-slate-900',
  snapchat: 'from-yellow-400 to-yellow-500',
  spotify: 'from-green-500 to-green-700',
  audiomack: 'from-orange-500 to-amber-600',
  boomplay: 'from-orange-500 to-red-600',
  apple_music: 'from-pink-500 to-rose-600',
  whatsapp: 'from-green-500 to-green-600',
  pinterest: 'from-red-500 to-red-700',
  threads: 'from-slate-600 to-slate-800',
  telegram: 'from-blue-400 to-blue-500',
  twitch:    'from-purple-600 to-purple-800',
  facebook:  'from-blue-600 to-blue-800',
  google:    'from-red-500 to-yellow-500',
  linkedin:  'from-blue-600 to-blue-700',
  app_store: 'from-gray-700 to-gray-900',
  podcast:   'from-purple-600 to-violet-800',
  website:   'from-cyan-500 to-blue-600',
};

// What real Nigerian engagement uniquely unlocks
const AUDIENCE_TYPES = [
  {
    icon: FiMapPin,
    title: 'State-Level Targeting',
    desc: 'Choose Lagos, Abuja, Port Harcourt, or any of Nigeria\'s 36 states. Your audience comes from the exact region your brand needs.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: FiUsers,
    title: 'Gender-Specific Engagement',
    desc: 'Get engagement from male, female, or mixed audiences. Useful for brands with gender-targeted products or campaigns.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: FiMessageCircle,
    title: 'Custom Comment Briefs',
    desc: 'For comment services, tell taskers exactly what to say — tone, topic, hashtags, Pidgin or formal English. Real people, real words.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: FiStar,
    title: 'Niche Communities',
    desc: 'Our taskers span gamers, fashion lovers, food enthusiasts, students, entrepreneurs, and professionals — real sub-cultures, not bots.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    icon: FiZap,
    title: 'WhatsApp Group Amplification',
    desc: 'Content that gets shared by real Nigerians travels fast through WhatsApp groups. Shares and saves trigger organic chain reactions.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    icon: FiShield,
    title: 'Algorithm-Safe Delivery',
    desc: 'Real accounts with activity history won\'t trigger spam filters. Engagement is paced naturally — no sudden spikes that get flagged.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: FiTrendingUp,
    title: 'Depth of Engagement',
    desc: 'Beyond likes: saves, comments, shares, and watch time. Real people complete the actions that algorithms reward the most.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: FiCheckCircle,
    title: 'Refillable Guarantees',
    desc: 'Many services include a refill window. If followers drop within the guarantee period, they\'re replaced at no extra cost.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
];

const SPEED_LABEL: Record<string, string> = {
  instant: '< 1 hour',
  fast: '1–3 hours',
  medium: '1–24 hours',
  slow: '1–7 days',
};

const SPEED_COLOR: Record<string, string> = {
  instant: 'text-green-400',
  fast: 'text-blue-400',
  medium: 'text-yellow-400',
  slow: 'text-orange-400',
};

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const platforms = Array.from(new Set(SERVICES_CATALOG.map(s => s.category)));
  const filtered = SERVICES_CATALOG.filter(s => {
    const matchSearch = search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.action.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platform === 'all' || s.category === platform;
    return matchSearch && matchPlatform;
  });

  // Group by platform for display
  const grouped = platforms.reduce<Record<string, typeof SERVICES_CATALOG>>((acc, p) => {
    const services = filtered.filter(s => s.category === p);
    if (services.length > 0) acc[p] = services;
    return acc;
  }, {});

  if (!mounted) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <GradientText>Real People. Real Results.</GradientText>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Every order is fulfilled by verified Nigerian social media users — not bots.
            Get engagement that passes platform detection, looks organic, and actually converts.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-400" /> Real Nigerian accounts</span>
            <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-400" /> Algorithm-safe delivery</span>
            <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-400" /> Gender + state targeting</span>
            <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-400" /> {SERVICES_CATALOG.length}+ services</span>
          </div>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-3xl mx-auto space-y-4 mb-10"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services (e.g. TikTok followers, Instagram comments...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setPlatform('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${platform === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}
            >
              All Platforms
            </button>
            {platforms.map(p => {
              const Icon = PLATFORM_ICONS[p];
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${platform === p ? 'bg-blue-500 text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {getPlatformLabel(p)}
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Audience Types */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">
            <GradientText>What Real Engagement Unlocks</GradientText>
          </h2>
          <p className="text-slate-400 text-center mb-8 max-w-xl mx-auto">
            Because every tasker is a real Nigerian person, you get targeting and depth that no bot service can offer.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIENCE_TYPES.map((at, i) => {
              const Icon = at.icon;
              return (
                <motion.div
                  key={at.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className={`rounded-xl border p-5 ${at.bg}`}
                >
                  <Icon className={`w-6 h-6 mb-3 ${at.color}`} />
                  <h3 className="text-white font-bold text-sm mb-1">{at.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{at.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Services grouped by platform */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-slate-400">No services match your search.</div>
        ) : (
          Object.entries(grouped).map(([plat, services]) => {
            const Icon = PLATFORM_ICONS[plat];
            const gradient = PLATFORM_COLORS[plat] || 'from-slate-600 to-slate-800';
            return (
              <motion.div
                key={plat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-14"
              >
                {/* Platform header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    {Icon && <Icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{getPlatformLabel(plat)}</h2>
                    <p className="text-xs text-slate-400">{services.length} service{services.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service, i) => {
                    const pricing = computePricing(service.pricePerUnit, service.minQuantity);
                    const unitPrice = (service.pricePerUnit / 100).toFixed(2);
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/70 transition flex flex-col"
                      >
                        {/* Action badge */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold">
                            {service.action}
                          </span>
                          {service.refillable && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-semibold">
                              Refillable
                            </span>
                          )}
                        </div>

                        <h3 className="text-white font-bold text-base mb-2">{service.name}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                          {service.description.replace(/\*\*|✓|📊|→|#/g, '').split('\n')[0].trim()}
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                          <div className="bg-slate-800/60 rounded-lg py-2">
                            <p className="text-emerald-400 font-black text-sm">₦{unitPrice}</p>
                            <p className="text-slate-500 text-[10px]">per unit</p>
                          </div>
                          <div className="bg-slate-800/60 rounded-lg py-2">
                            <p className="text-blue-400 font-black text-sm">{service.minQuantity.toLocaleString()}+</p>
                            <p className="text-slate-500 text-[10px]">min qty</p>
                          </div>
                          <div className={`bg-slate-800/60 rounded-lg py-2`}>
                            <p className={`font-black text-sm ${SPEED_COLOR[service.speed]}`}>{SPEED_LABEL[service.speed]}</p>
                            <p className="text-slate-500 text-[10px]">delivery</p>
                          </div>
                        </div>

                        {/* Min order price */}
                        <p className="text-xs text-slate-500 text-center mb-4">
                          Starts from <span className="text-slate-300 font-semibold">₦{(pricing.totalKobo / 100).toLocaleString()}</span> incl. fees
                        </p>

                        <Link
                          href={`/sabi/order?reorder=1&serviceId=${service.id}&quantity=${service.minQuantity}`}
                          className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-sm transition"
                        >
                          Order Now <FiArrowRight className="inline w-4 h-4 ml-1" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center p-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
        >
          <h3 className="text-2xl font-black text-white mb-2">Need a custom order?</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Can't find exactly what you need? Our team can source custom engagement packages for specific campaigns.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/sabi/order"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:brightness-110 transition"
            >
              Place an Order
            </Link>
            <Link
              href="/sabi/docs"
              className="px-8 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold hover:border-slate-500 hover:text-white transition"
            >
              API Documentation
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
