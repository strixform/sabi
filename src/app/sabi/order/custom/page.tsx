'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiSend, FiLoader,
  FiUsers, FiMessageCircle, FiPhone, FiMail, FiAlignLeft,
  FiLink, FiHash, FiClock, FiDollarSign, FiStar, FiZap, FiMusic, FiFilm,
} from 'react-icons/fi';
import {
  SiInstagram, SiYoutube, SiTiktok, SiTelegram, SiWhatsapp,
  SiGooglemaps, SiGoogleplay, SiAppstore,
} from 'react-icons/si';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow: string;
  examples: { title: string; desc: string }[];
}

// ─── Category data with real-world examples ───────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'social_growth',
    label: 'Social Media Growth',
    icon: SiInstagram,
    color: 'from-pink-500 to-purple-600',
    glow: 'shadow-pink-500/20',
    examples: [
      { title: 'Instagram followers', desc: 'Grow from 500 to 10,000 real Nigerian followers on your brand page' },
      { title: 'TikTok views', desc: 'Push your product video to 100,000 views to trigger the algorithm' },
      { title: 'YouTube subscribers', desc: 'Get 5,000 subscribers for your channel to hit monetisation threshold' },
      { title: 'Twitter/X engagement', desc: 'Make a tweet go viral — retweets, quotes, and replies with keywords' },
    ],
  },
  {
    id: 'app_reviews',
    label: 'App Reviews & Ratings',
    icon: SiGoogleplay,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    examples: [
      { title: 'Google Play ratings', desc: 'Boost your app from 2.8★ to 4.5★ with 1,000 verified reviews' },
      { title: 'App Store ratings', desc: 'Get 500 genuine 5-star iOS reviews before your product launch' },
      { title: 'Keyword reviews', desc: 'Reviews that mention specific features: "easy to use", "fast delivery"' },
      { title: 'Review responses', desc: 'Counter negative reviews with 200 detailed positive ones' },
    ],
  },
  {
    id: 'website_traffic',
    label: 'Website Traffic & Leads',
    icon: FiLink,
    color: 'from-blue-500 to-cyan-600',
    glow: 'shadow-blue-500/20',
    examples: [
      { title: 'Real website visitors', desc: '10,000 unique visitors from Nigerian IPs to boost Alexa ranking' },
      { title: 'Form submissions', desc: 'Get 2,000 people to fill your lead capture form or sign up' },
      { title: 'Long session visits', desc: 'Visitors that spend 3+ minutes on your landing page' },
      { title: 'Product page clicks', desc: 'Drive targeted traffic to a specific product before a promo' },
    ],
  },
  {
    id: 'community',
    label: 'Community Building',
    icon: SiTelegram,
    color: 'from-sky-500 to-blue-700',
    glow: 'shadow-sky-500/20',
    examples: [
      { title: 'Telegram group growth', desc: 'Build your Telegram community from 100 to 50,000 active members' },
      { title: 'WhatsApp group joins', desc: 'Fill your WhatsApp broadcast/group to capacity before a launch' },
      { title: 'Discord server', desc: 'Grow your brand\'s Discord to 5,000 members ahead of a drop' },
      { title: 'Facebook group', desc: '10,000 people join and engage in your Facebook group weekly' },
    ],
  },
  {
    id: 'content_amp',
    label: 'Content Amplification',
    icon: FiZap,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    examples: [
      { title: 'Trend a hashtag', desc: 'Make #YourBrand trend on Twitter/X in Nigeria for 24 hours' },
      { title: 'Comment campaigns', desc: '500 comments mentioning your brand under a competitor\'s viral post' },
      { title: 'LinkedIn thought leadership', desc: 'Boost a post to 50,000 impressions with shares + comments' },
      { title: 'Spotify streams', desc: 'Push your new music release to 100,000 streams in the first week' },
    ],
  },
  {
    id: 'music_artistes',
    label: 'Music & Artistes',
    icon: FiMusic,
    color: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/20',
    examples: [
      { title: 'Real streams', desc: 'Boomplay, Audiomack, Spotify & Apple Music plays from real paid Nigerian fans — never bots' },
      { title: 'TikTok sound promotion', desc: 'Real creators film videos using your sound to trigger a viral trend' },
      { title: 'Shazam + chart push', desc: 'Genuine Shazam tags and playlist placements to climb the charts' },
      { title: 'Award & chart voting', desc: 'Mobilise real voters for the Headies, awards and music polls' },
    ],
  },
  {
    id: 'film_nollywood',
    label: 'Film & Nollywood',
    icon: FiFilm,
    color: 'from-indigo-500 to-violet-700',
    glow: 'shadow-indigo-500/20',
    examples: [
      { title: 'Trailer & premiere push', desc: 'Real watch-time and views on your trailer or YouTube film from genuine viewers' },
      { title: 'WhatsApp Status premiere promo', desc: 'Real people post your poster/clip to their Status — seen by their actual contacts' },
      { title: 'UGC reactions & reviews', desc: 'Creators make real reaction and review videos about your film' },
      { title: 'IMDb / blog reviews & voting', desc: 'Authentic written reviews and votes for film awards (AMVCA, festivals)' },
    ],
  },
  {
    id: 'business',
    label: 'Business Promotions',
    icon: SiGooglemaps,
    color: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/20',
    examples: [
      { title: 'Google Maps reviews', desc: '500 verified 5-star reviews for your restaurant, salon, or office' },
      { title: 'App installs + usage', desc: '2,000 real installs of your app with first-session activity' },
      { title: 'Newsletter sign-ups', desc: '3,000 people subscribe to your email list before a product drop' },
      { title: 'Survey completions', desc: '1,000 people complete your market research survey fully' },
    ],
  },
  {
    id: 'voting',
    label: 'Voting & Petitions',
    icon: FiStar,
    color: 'from-violet-500 to-purple-700',
    glow: 'shadow-violet-500/20',
    examples: [
      { title: 'Online poll votes', desc: 'Win a brand competition or online award with 50,000 votes' },
      { title: 'Petition signatures', desc: 'Get 10,000 people to sign an online petition or survey' },
      { title: 'Competition voting', desc: 'Vote your entry to top 3 in a public online competition' },
      { title: 'Award nominations', desc: 'Nominate and vote your brand in an industry awards category' },
    ],
  },
  {
    id: 'other',
    label: 'Something Else',
    icon: FiMessageCircle,
    color: 'from-slate-500 to-slate-700',
    glow: 'shadow-slate-500/20',
    examples: [
      { title: 'Anything digital', desc: 'If 300,000 humans can click, type, or interact with it — we can do it' },
      { title: 'Influencer outreach', desc: 'Have our network contact micro-influencers on your behalf' },
      { title: 'Classified listings', desc: 'Get your Jiji, OLX, or marketplace listing seen by thousands' },
      { title: 'Custom campaign', desc: 'Tell us your goal — we\'ll design the exact campaign for you' },
    ],
  },
];

const BUDGETS = ['Under ₦50,000', '₦50,000 – ₦200,000', '₦200,000 – ₦500,000', '₦500,000 – ₦1,000,000', 'Above ₦1,000,000', 'Flexible / Not sure'];
const TIMELINES = ['ASAP (24–48 hours)', '1 week', '2 weeks', '1 month', 'Ongoing / Flexible'];
const STATUS_COLORS: Record<string, string> = {
  new:       'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  reviewing: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  contacted: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  quoted:    'bg-purple-500/20 text-purple-300 border-purple-500/40',
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  completed: 'bg-green-500/20 text-green-300 border-green-500/40',
  rejected:  'bg-red-500/20 text-red-300 border-red-500/40',
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomOrderPage() {
  const router = useRouter();

  // Step 0: pick category | Step 1: fill form | Step 2: success
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [form, setForm] = useState({
    name: '', email: '', whatsapp: '',
    description: '', targetPlatform: '', targetUrl: '',
    quantity: '', budget: '', timeline: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);

  // Pre-fill from session
  useEffect(() => {
    fetch('/api/sabi/auth/me').then(r => r.json()).then(d => {
      if (d.user) {
        setSession(d.user);
        setForm(f => ({ ...f, name: d.user.name || '', email: d.user.email || '' }));
      }
    }).catch(() => {});
  }, []);

  const selectedCategory = CATEGORIES.find(c => c.id === selectedCat);

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim())        { setError('Your name is required'); return; }
    if (!form.email.trim())       { setError('Your email is required'); return; }
    if (!form.whatsapp.trim())    { setError('Your WhatsApp number is required'); return; }
    if (!form.description.trim()) { setError('Please describe what you need'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sabi/orders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category: selectedCat,
          quantity: form.quantity ? parseInt(form.quantity) : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Submission failed'); return; }
      setRequestId(d.requestId);
      setStep(2);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      <AnimatedBackground />
      <ModernSabiHeader />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">

        {/* ── Step 0: Category picker ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}>

              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 text-sm text-violet-400 mb-6">
                  <FiUsers className="w-4 h-4" />
                  <span>300,000+ taskers ready to work for you</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                  What do you need{' '}
                  <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    done?
                  </span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Our network of 300,000+ verified digital workers can execute almost any
                  online action at scale. Pick a category — we'll quote you in 24 hours.
                </p>
              </div>

              {/* Category grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCat === cat.id;
                  return (
                    <motion.button key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedCat(cat.id)}
                      className={`relative text-left p-5 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? `bg-gradient-to-br ${cat.color} bg-opacity-10 border-white/20 shadow-lg ${cat.glow}`
                          : 'bg-slate-900/60 border-white/[0.06] hover:border-white/20 hover:bg-slate-800/60'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="font-semibold text-sm mb-2">{cat.label}</div>
                      <div className="space-y-1">
                        {cat.examples.slice(0, 2).map(ex => (
                          <div key={ex.title} className="text-xs text-slate-500 leading-tight">• {ex.title}</div>
                        ))}
                        <div className="text-xs text-slate-600">+{cat.examples.length - 2} more…</div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <FiCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Examples panel for selected category */}
              <AnimatePresence>
                {selectedCategory && (
                  <motion.div key={selectedCategory.id}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
                    <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6">
                      <div className="text-sm text-slate-400 font-semibold mb-4 uppercase tracking-wide">
                        Popular requests in this category
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {selectedCategory.examples.map(ex => (
                          <div key={ex.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-gradient-to-br ${selectedCategory.color}`} />
                            <div>
                              <div className="text-sm font-semibold text-white mb-0.5">{ex.title}</div>
                              <div className="text-xs text-slate-500 leading-relaxed">{ex.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center">
                <Link href="/sabi/order" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <FiArrowLeft className="w-4 h-4" />
                  Back to regular orders
                </Link>
                <button
                  disabled={!selectedCat}
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20">
                  Continue <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Brief form ──────────────────────────────────── */}
          {step === 1 && selectedCategory && (
            <motion.div key="step1"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}>

              {/* Progress */}
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center`}>
                  {React.createElement(selectedCategory.icon, { className: 'w-4 h-4 text-white' })}
                </div>
                <div>
                  <div className="text-xs text-slate-500">Category</div>
                  <div className="text-sm font-semibold">{selectedCategory.label}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="md:col-span-2 space-y-5">

                  <div>
                    <h2 className="text-2xl font-black mb-1">Tell us what you need</h2>
                    <p className="text-slate-400 text-sm">Be as specific as possible — the more detail, the better we can quote you.</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      <FiAlignLeft className="inline w-4 h-4 mr-1.5" />
                      Describe your request <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={5}
                      placeholder={`Example: "I need 5,000 real Instagram followers on my fashion brand page @yourbrand within 2 weeks. I want genuine Nigerian accounts that match my audience (women 18–35). Comments are welcome but not required."`}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 resize-none placeholder-slate-600"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Platform */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiHash className="inline w-4 h-4 mr-1.5" />
                        Platform / Service
                      </label>
                      <input
                        value={form.targetPlatform}
                        onChange={e => setForm(f => ({ ...f, targetPlatform: e.target.value }))}
                        placeholder="e.g. Instagram, Google Play"
                        className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                      />
                    </div>
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiUsers className="inline w-4 h-4 mr-1.5" />
                        Estimated quantity
                      </label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                        placeholder="e.g. 5000"
                        min={1}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* Target URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      <FiLink className="inline w-4 h-4 mr-1.5" />
                      Target URL or link (optional)
                    </label>
                    <input
                      value={form.targetUrl}
                      onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))}
                      placeholder="https://instagram.com/yourbrand"
                      className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiDollarSign className="inline w-4 h-4 mr-1.5" />
                        Budget range
                      </label>
                      <select
                        value={form.budget}
                        onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50">
                        <option value="">Select budget</option>
                        {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    {/* Timeline */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        <FiClock className="inline w-4 h-4 mr-1.5" />
                        Timeline
                      </label>
                      <select
                        value={form.timeline}
                        onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50">
                        <option value="">Select timeline</option>
                        {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-5">
                    <div className="text-sm font-semibold text-slate-300 mb-4">Contact details — how we'll reach you</div>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Full name <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <FiUsers className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                            <input
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="Your name"
                              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Email address <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                            <input
                              type="email"
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              placeholder="you@example.com"
                              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">WhatsApp number <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <SiWhatsapp className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                          <input
                            value={form.whatsapp}
                            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                            placeholder="+2348012345678"
                            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/[0.08] text-white text-sm rounded-xl focus:outline-none focus:border-violet-500/50 placeholder-slate-600"
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">We'll send your quote and campaign brief via WhatsApp for faster communication.</p>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      <span>⚠ {error}</span>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 text-lg">
                    {submitting ? <><FiLoader className="w-5 h-5 animate-spin" /> Submitting…</> : <><FiSend className="w-5 h-5" /> Send My Request</>}
                  </button>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FiZap className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-sm">How it works</span>
                    </div>
                    {[
                      { n: '1', t: 'Submit your brief', d: 'Describe what you need — as detailed as you can be' },
                      { n: '2', t: 'Get a quote', d: 'We review and send a custom quote within 24 hours' },
                      { n: '3', t: 'Approve & pay', d: 'Pay securely via your SABI wallet or direct transfer' },
                      { n: '4', t: 'Campaign runs', d: '300,000+ taskers execute your campaign in real time' },
                      { n: '5', t: 'Track progress', d: 'Live updates in your SABI dashboard' },
                    ].map(s => (
                      <div key={s.n} className="flex gap-3 mb-3 last:mb-0">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                        <div>
                          <div className="text-sm font-semibold">{s.t}</div>
                          <div className="text-xs text-slate-500">{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                    <div className="text-emerald-400 font-semibold text-sm mb-2">✅ No upfront payment</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You only pay after we review and you approve the quote. No hidden fees — the price you see is the price you pay.
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5">
                    <div className="text-sm font-semibold mb-3">Need help?</div>
                    <a href="https://wa.me/2349012345678" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-emerald-400 text-sm hover:underline">
                      <SiWhatsapp className="w-4 h-4" />
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Success ─────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto text-center">
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-3xl p-10">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
                  <FiCheck className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-black mb-3">Request Sent! 🎉</h2>
                <p className="text-slate-400 mb-2">
                  We've received your custom order request and will reach out within <strong className="text-white">24 hours</strong>.
                </p>
                <p className="text-slate-500 text-sm mb-6">
                  Check your WhatsApp and email — our team will send your quote and ask any follow-up questions there.
                </p>
                <div className="bg-slate-800/60 rounded-xl p-4 mb-8 text-left">
                  <div className="text-xs text-slate-500 mb-1">Request reference</div>
                  <div className="font-mono text-sm text-violet-400 break-all">{requestId}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/sabi/orders"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-white/[0.06] text-sm font-semibold hover:bg-slate-700 transition-colors">
                    View My Orders
                  </Link>
                  <Link href="/sabi/order"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-bold hover:from-violet-500 hover:to-blue-500 transition-colors">
                    Place Regular Order
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
