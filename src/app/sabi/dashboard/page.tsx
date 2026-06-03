'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTrendingUp, FiArrowUpRight, FiInbox } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { FloatingElement } from '@/components/FloatingElement';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';

export default function DashboardPage() {
  const [wallet, setWallet] = useState({ balance: 0, spent: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/sabi/wallet');
        const data = await res.json();
        setWallet({
          balance: data.balance || 0,
          spent: data.spent || 0,
          active: data.active || 0,
        });
      } catch {
        console.error('Failed to fetch wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10 space-y-8">
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
