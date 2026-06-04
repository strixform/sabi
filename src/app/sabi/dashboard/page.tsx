'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTrendingUp, FiArrowUpRight, FiInbox, FiAward, FiZap, FiTarget } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { FloatingElement } from '@/components/FloatingElement';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';

const TIER_SYSTEM = {
  NOVICE: { level: 0, minSpent: 0, label: '🆕 Novice', color: 'from-slate-400 to-slate-500', badge: 'Just Started' },
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        if (!res.ok) {
          window.location.href = '/sabi/login';
          return;
        }
        const data = await res.json();
        setSession(data.user);
      } catch {
        window.location.href = '/sabi/login';
      }
    };

    const fetchWallet = async () => {
      try {
        const walletRes = await fetch('/api/sabi/wallet');
        if (!walletRes.ok) {
          window.location.href = '/sabi/login';
          return;
        }
        const walletData = await walletRes.json();

        const ordersRes = await fetch('/api/sabi/orders');
        const ordersData = await ordersRes.json();
        const activeOrders = ordersData.orders?.filter((o: any) => o.status === 'pending' || o.status === 'processing' || o.status === 'executing').length || 0;

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
        console.error('Failed to fetch wallet:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchWallet();
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
          <h1 className="text-5xl font-black">
            <GradientText>
              <AnimateInText type="blur" delay={0.1}>
                Welcome Back
              </AnimateInText>
            </GradientText>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-slate-400"
          >
            <AnimateInText type="slide" delay={0.4}>
              Manage your account and track your orders in real-time
            </AnimateInText>
          </motion.p>
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
                      ₦{loading ? '...' : (wallet.balance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
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
                      ₦{loading ? '...' : (wallet.spent / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
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

          <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/30 p-12 text-center">
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
                    className="block px-8 py-4 border-2 border-slate-600 hover:border-blue-400 text-white font-bold rounded-xl transition hover:bg-slate-800/50 text-center"
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
                  <AnimateInText type="fade" delay={0.2}>
                    No orders yet
                  </AnimateInText>
                </p>
                <p className="text-slate-500 text-sm">
                  <AnimateInText type="fade" delay={0.3}>
                    Your completed orders will appear here
                  </AnimateInText>
                </p>
              </motion.div>
            </div>
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
