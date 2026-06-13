'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTrendingUp, FiArrowUpRight, FiInbox, FiAward, FiZap, FiTarget, FiShare2, FiCopy, FiBookmark, FiSettings, FiShoppingCart } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { FloatingElement } from '@/components/FloatingElement';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';

const TIER_SYSTEM = {
  NOVICE: { level: 0, minSpent: 0, label: '🆕 Novice', color: 'from-blue-400 to-cyan-500', badge: 'Just Started' },
  JUNIOR: { level: 1, minSpent: 50000, label: '🪶 Junior', color: 'from-blue-400 to-blue-500', badge: 'Growing' },
  EXPLORER: { level: 2, minSpent: 250000, label: '🔍 Explorer', color: 'from-cyan-400 to-blue-500', badge: 'Active' },
  MASTER: { level: 3, minSpent: 1000000, label: '⭐ Master', color: 'from-purple-400 to-purple-500', badge: 'Experienced' },
  ELITE: { level: 4, minSpent: 5000000, label: '💎 Elite', color: 'from-pink-400 to-rose-500', badge: 'Premium' },
  LEGEND: { level: 5, minSpent: 20000000, label: '👑 Legend', color: 'from-amber-400 to-orange-500', badge: 'Legendary' },
  MYTHIC: { level: 6, minSpent: 50000000, label: '🔥 Mythic', color: 'from-red-400 to-rose-600', badge: 'Unstoppable' },
};

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState({ balance: 0, spent: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [tier, setTier] = useState(TIER_SYSTEM.NOVICE);
  const [progress, setProgress] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [referral, setReferral] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch with retry — Google OAuth may hit the dashboard before Redis prewarm
        // completes on slow connections. One 1.5s retry eliminates the login loop.
        const tryFetch = async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch('/api/sabi/dashboard', { signal: controller.signal }).catch(() => null);
          clearTimeout(timeout);
          return res;
        };

        let res = await tryFetch();

        // One retry after 1.5s — covers race where prewarm hasn't hit Redis yet
        if (!res || !res.ok) {
          await new Promise(r => setTimeout(r, 1500));
          res = await tryFetch();
        }

        if (!res || !res.ok) {
          window.location.href = '/sabi/login';
          return;
        }

        const data = await res.json();
        if (!data.success) {
          // One more retry for transient failures (Turso 429 etc.)
          await new Promise(r => setTimeout(r, 1500));
          const res2 = await tryFetch();
          if (!res2?.ok) { window.location.href = '/sabi/login'; return; }
          const data2 = await res2.json();
          if (!data2.success) { window.location.href = '/sabi/login'; return; }
          Object.assign(data, data2);
        }

        const authData   = { user: data.user };
        const walletData = data.wallet;
        const ordersData = { orders: data.orders || [] };

        setSession(authData.user);

        const allOrders = ordersData.orders || [];
        const activeOrders = allOrders.filter(
          (o: any) => ['pending', 'processing', 'executing'].includes(o.status)
        ).length;
        setRecentOrders(allOrders.slice(0, 5));

        const spent = walletData.totalSpent || 0;

        // Calculate tier
        let currentTier = TIER_SYSTEM.NOVICE;
        let nextTier = TIER_SYSTEM.JUNIOR;

        const tiers = Object.values(TIER_SYSTEM).sort((a, b) => a.minSpent - b.minSpent);

        for (let i = 0; i < tiers.length; i++) {
          if (spent >= tiers[i].minSpent) {
            currentTier = tiers[i];
            nextTier = tiers[i + 1] || tiers[i];
          }
        }

        // Calculate progress to next tier
        const currentMin = currentTier.minSpent;
        const nextMin = nextTier.minSpent;
        const progressValue = nextMin > currentMin ? ((spent - currentMin) / (nextMin - currentMin)) * 100 : 100;

        setWallet({
          balance: walletData.balance || 0,
          spent: spent,
          active: activeOrders,
        });

        setTier(currentTier);
        setProgress(Math.min(progressValue, 100));
      } catch (err) {
        console.error('Dashboard load error:', err);
        // Still show the page even on error — don't leave loading forever
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Load analytics + referral in background
    fetch('/api/sabi/analytics').then(r => r.json()).then(d => { if (d.success) setAnalytics(d); }).catch(() => {});
    fetch('/api/sabi/referral').then(r => r.json()).then(d => { if (d.success) setReferral(d); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          {/* Row 1: heading + eye toggle */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl font-black">
              <GradientText>
                <AnimateInText type="blur" delay={0.1}>
                  Welcome Back
                </AnimateInText>
              </GradientText>
            </h1>
            <button
              onClick={() => setShowValues(prev => !prev)}
              className="p-2 mt-1 shrink-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition"
              title={showValues ? 'Hide balances' : 'Show balances'}
              type="button"
            >
              {showValues ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>

          {/* Row 2: subtitle + New Order button — properly aligned */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-slate-400"
            >
              <AnimateInText type="slide" delay={0.4}>
                Manage your account and track your orders in real-time
              </AnimateInText>
            </motion.p>

            <Link href="/sabi/order" className="shrink-0">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />
                <FiShoppingCart className="w-3.5 h-3.5 text-white relative z-10" />
                <span className="text-white relative z-10 whitespace-nowrap">New Order</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid - Animated */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Wallet Balance */}
            <StaggerItem>
              <InteractiveCard glowColor="blue" delay={0}>
                <motion.div
                  className="p-8 h-full flex flex-col"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <motion.span
                      className="text-slate-400 text-sm font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <AnimateInText type="typewriter" delay={0.3}>
                        WALLET BALANCE
                      </AnimateInText>
                    </motion.span>
                    <CuteIconAnimation type="bounce" duration={2}>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                        <FiCreditCard className="w-6 h-6 text-blue-400" />
                      </div>
                    </CuteIconAnimation>
                  </div>
                  <div className="space-y-2 flex-1">
                    <motion.div
                      className="text-4xl font-black bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {loading ? '...' : showValues ? `₦${(wallet.balance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '••••••'}
                    </motion.div>
                    <AnimateInText type="fade" delay={0.5}>
                      <p className="text-sm text-slate-400">Ready to spend</p>
                    </AnimateInText>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6"
                  >
                    <Link
                      href="/sabi/wallet"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition"
                    >
                      <AnimateInText type="fade" delay={0.6}>
                        + Fund Wallet
                      </AnimateInText>
                    </Link>
                  </motion.div>
                </motion.div>
              </InteractiveCard>
            </StaggerItem>

            {/* Total Spent */}
            <StaggerItem>
              <InteractiveCard glowColor="purple" delay={0}>
                <motion.div
                  className="p-8 h-full flex flex-col"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <motion.span
                      className="text-slate-400 text-sm font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <AnimateInText type="typewriter" delay={0.4}>
                        TOTAL SPENT
                      </AnimateInText>
                    </motion.span>
                    <CuteIconAnimation type="pulse_glow" duration={1.5}>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-purple-400" />
                      </div>
                    </CuteIconAnimation>
                  </div>
                  <div className="space-y-2 flex-1">
                    <motion.div
                      className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {loading ? '...' : showValues ? `₦${(wallet.spent / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '••••••'}
                    </motion.div>
                    <AnimateInText type="fade" delay={0.6}>
                      <p className="text-sm text-slate-400">All-time investment</p>
                    </AnimateInText>
                  </div>
                </motion.div>
              </InteractiveCard>
            </StaggerItem>

            {/* Active Orders */}
            <StaggerItem>
              <InteractiveCard glowColor="pink" delay={0}>
                <motion.div
                  className="p-8 h-full flex flex-col"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <motion.span
                      className="text-slate-400 text-sm font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <AnimateInText type="typewriter" delay={0.5}>
                        ACTIVE ORDERS
                      </AnimateInText>
                    </motion.span>
                    <CuteIconAnimation type="float" duration={3}>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center">
                        <FiArrowUpRight className="w-6 h-6 text-pink-400" />
                      </div>
                    </CuteIconAnimation>
                  </div>
                  <div className="space-y-2 flex-1">
                    <motion.div
                      className="text-4xl font-black bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {loading ? '...' : wallet.active}
                    </motion.div>
                    <AnimateInText type="fade" delay={0.7}>
                      <p className="text-sm text-slate-400">Running campaigns</p>
                    </AnimateInText>
                  </div>
                </motion.div>
              </InteractiveCard>
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Tier & Usage Level Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tier Card */}
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${tier.color} border border-white/20 backdrop-blur-xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{tier.label.split(' ')[0]}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tier.label.split(' ').slice(1).join(' ')}</h3>
                      <p className="text-sm text-white/80">{tier.badge}</p>
                    </div>
                  </div>
                  <CuteIconAnimation type="bounce" duration={2}>
                    <FiAward className="w-8 h-8 text-white/80" />
                  </CuteIconAnimation>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-white/90">Progress to Next Level</span>
                      <span className="text-xs font-bold text-white/70">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Total Spent:</span>
                    <span className="font-bold text-white">₦{loading ? '...' : (wallet.spent / 100).toLocaleString('en-NG')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Usage Level Card */}
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-amber-500/40 to-orange-500/40 border border-white/20 backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Usage Level</h3>
                    <p className="text-sm text-white/80">Based on your activity</p>
                  </div>
                  <CuteIconAnimation type="pulse_glow" duration={2}>
                    <FiZap className="w-8 h-8 text-white/80" />
                  </CuteIconAnimation>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                      <p className="text-xs text-white/70 font-semibold mb-1">Active Orders</p>
                      <p className="text-2xl font-black text-white">{loading ? '...' : wallet.active}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                      <p className="text-xs text-white/70 font-semibold mb-1">Available Balance</p>
                      <p className="text-xl font-black text-white">₦{loading ? '...' : (wallet.balance / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>

                  <motion.div
                    className="bg-white/15 rounded-lg p-3 border border-white/20"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-xs font-semibold text-white/90">💡 Smart Tip</p>
                    <p className="text-xs text-white/70 mt-1">
                      {wallet.balance < 500000 ? 'Fund your wallet to unlock more campaign possibilities!' : 'You\'re all set! Ready to place your next order.'}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </div>

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative overflow-hidden rounded-3xl group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 blur-3xl"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />

          <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/[0.06]/30 p-12 text-center">
            <div className="space-y-6">
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-3xl md:text-4xl font-black mb-2"
                >
                  <GradientText>
                    <AnimateInText type="blur" delay={0.8}>
                      Ready to Grow?
                    </AnimateInText>
                  </GradientText>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-lg text-slate-300"
                >
                  <AnimateInText type="slide" delay={1}>
                    Get real, active Nigerian engagement starting at just ₦500
                  </AnimateInText>
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition" />
                  <Link
                    href="/sabi/order"
                    className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl transition"
                  >
                    <AnimateInText type="fade" delay={1.2}>
                      Create New Order
                    </AnimateInText>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/sabi/docs"
                    className="block px-8 py-4 border-2 border-white/[0.08] hover:border-blue-400 text-white font-bold rounded-xl transition hover:bg-white/[0.025] text-center"
                  >
                    <AnimateInText type="fade" delay={1.3}>
                      View API Docs
                    </AnimateInText>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Chart + Referral + Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Spending Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2"><FiTrendingUp className="text-blue-400" /> Spending (8 weeks)</h3>
              {analytics && <span className="text-xs text-slate-400">{analytics.completionRate}% completion rate</span>}
            </div>
            {analytics?.weeklySpend ? (() => {
              const max = Math.max(...analytics.weeklySpend.map((w: any) => w.kobo), 1);
              return (
                <div className="flex items-end gap-1.5 h-28">
                  {analytics.weeklySpend.map((w: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-blue-600 to-purple-500 min-h-[4px] transition-all"
                        style={{ height: `${Math.round((w.kobo / max) * 100)}%` }}
                        title={`₦${(w.kobo / 100).toLocaleString()}`}
                      />
                      <span className="text-[9px] text-slate-500 rotate-45 origin-left whitespace-nowrap">{w.label}</span>
                    </div>
                  ))}
                </div>
              );
            })() : (
              <div className="h-28 flex items-center justify-center text-slate-500 text-sm">No spend data yet</div>
            )}
            <div className="mt-4 flex gap-4 text-xs text-slate-400">
              <Link href="/sabi/templates" className="flex items-center gap-1 hover:text-white transition"><FiBookmark className="w-3.5 h-3.5" /> Templates</Link>
              <Link href="/sabi/wallet/settings" className="flex items-center gap-1 hover:text-white transition"><FiSettings className="w-3.5 h-3.5" /> Auto Top-Up</Link>
            </div>
          </motion.div>

          {/* Referral Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4"><FiShare2 className="text-emerald-400" /> Refer & Earn</h3>
            <p className="text-slate-400 text-sm mb-4">Share your link. Both you and your referral get <span className="text-emerald-400 font-bold">₦100</span> when they place their first order — earn from up to 3 friends.</p>
            {referral ? (
              <>
                <div className="flex gap-2 mb-4">
                  <input
                    readOnly value={referral.referralLink}
                    className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-slate-300 outline-none"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(referral.referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <p className="text-emerald-400 text-xs mb-2">Copied!</p>}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-2xl font-black text-white">{referral.totalReferred}</p>
                    <p className="text-xs text-slate-400">Referred</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-2xl font-black text-emerald-400">₦{referral.totalEarned.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Earned</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">Loading...</div>
            )}
          </motion.div>
        </div>

        {/* Recent Orders Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">
              <AnimateInText type="slide" delay={0.1}>
                Recent Orders
              </AnimateInText>
            </h2>
            <Link href="/sabi/orders" className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition">
              <AnimateInText type="fade" delay={0.2}>
                View All →
              </AnimateInText>
            </Link>
          </div>

          <InteractiveCard glowColor="purple">
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <motion.div
                  className="space-y-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <CuteIconAnimation type="spin" duration={3}>
                    <FiInbox className="w-16 h-16 mx-auto text-slate-500" />
                  </CuteIconAnimation>
                  <p className="text-slate-400 text-lg">
                    No orders yet — place your first order
                  </p>
                  <Link href="/sabi/order" className="inline-block mt-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-xl">
                    Place Order
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentOrders.map((order: any) => {
                  const statusColors: Record<string, string> = {
                    executing:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    completed:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    pending:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    failed:     'bg-red-500/20 text-red-300 border-red-500/30',
                    cancelled:  'bg-red-500/20 text-red-300 border-red-500/30',
                  };
                  const badgeClass = statusColors[order.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-semibold text-white truncate capitalize">{(order.serviceType || 'Order').replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{dateStr} · Qty {order.quantity?.toLocaleString()}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 text-xs font-bold rounded-full border capitalize ${badgeClass}`}>
                        {order.status}
                      </span>
                    </div>
                  );
                })}
                <div className="px-6 py-3">
                  <Link href="/sabi/orders" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition">
                    View all orders →
                  </Link>
                </div>
              </div>
            )}
          </InteractiveCard>
        </motion.div>

        {/* Quick Stats */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pro Tips */}
            <StaggerItem>
              <InteractiveCard glowColor="blue">
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-4">
                    <GradientText>
                      <AnimateInText type="fade" delay={0.1}>
                        Pro Tips
                      </AnimateInText>
                    </GradientText>
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {[
                      'Start with small orders to test platform',
                      'Real users deliver in 24-48 hours',
                      'Bulk orders receive better rates',
                    ].map((tip, i) => (
                      <motion.li
                        key={i}
                        className="flex gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                      >
                        <CuteIconAnimation type="bounce" delay={0.8 + i * 0.2} duration={1.5}>
                          <span className="text-blue-400 flex-shrink-0 text-lg">✓</span>
                        </CuteIconAnimation>
                        <span>
                          <AnimateInText type="fade" delay={0.9 + i * 0.1}>
                            {tip}
                          </AnimateInText>
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </InteractiveCard>
            </StaggerItem>

            {/* Help Section */}
            <StaggerItem>
              <InteractiveCard glowColor="cyan">
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-4">
                    <GradientText>
                      <AnimateInText type="fade" delay={0.1}>
                        Need Help?
                      </AnimateInText>
                    </GradientText>
                  </h3>
                  <p className="text-sm text-slate-300 mb-4">
                    <AnimateInText type="fade" delay={0.2}>
                      Our team is available 24/7 to support your success
                    </AnimateInText>
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-semibold transition"
                    >
                      <AnimateInText type="fade" delay={0.3}>
                        Contact Support
                      </AnimateInText>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-semibold transition"
                    >
                      <AnimateInText type="fade" delay={0.4}>
                        FAQ
                      </AnimateInText>
                    </motion.button>
                  </div>
                </div>
              </InteractiveCard>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </div>
  );
}
