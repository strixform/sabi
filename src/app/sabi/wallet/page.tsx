'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiCheck, FiCreditCard, FiTrendingUp, FiClock } from 'react-icons/fi';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AnimateInText } from '@/components/AnimateInText';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { getCardColor } from '@/lib/designSystem';

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ balance: 0, totalFunded: 0, totalSpent: 0, totalRefunded: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        const data = await res.json();
        if (data.success) {
          setSession(data.user);
          // Fetch wallet
          const walletRes = await fetch('/api/sabi/wallet');
          const walletData = await walletRes.json();
          if (walletData.success) {
            setWallet({
              balance: walletData.balance,
              totalFunded: walletData.totalFunded,
              totalSpent: walletData.totalSpent,
              totalRefunded: walletData.totalRefunded,
            });
            setTransactions(walletData.transactions || []);
          }
        } else {
          router.push('/sabi/login');
        }
      } catch (err) {
        router.push('/sabi/login');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center text-slate-400">
          <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-black mb-2">
            <GradientText>Wallet</GradientText>
          </h1>
          <p className="text-slate-400 text-lg">Manage your funds and track transactions</p>
        </motion.div>
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <InteractiveCard glowColor="emerald">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FiCreditCard className="w-6 h-6" />
                  Wallet Balance
                </h3>
                <motion.div
                  className="text-4xl font-black text-emerald-400"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  ₦{(wallet.balance / 100).toLocaleString()}
                </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  className="p-4 bg-slate-800/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-xs text-slate-400 mb-1">Total Funded</p>
                  <p className="text-lg font-bold">₦{(wallet.totalFunded / 100).toLocaleString()}</p>
                </motion.div>

                <motion.div
                  className="p-4 bg-slate-800/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-slate-400 mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-orange-400">₦{(wallet.totalSpent / 100).toLocaleString()}</p>
                </motion.div>

                <motion.div
                  className="p-4 bg-slate-800/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs text-slate-400 mb-1">Total Refunded</p>
                  <p className="text-lg font-bold text-blue-400">₦{(wallet.totalRefunded / 100).toLocaleString()}</p>
                </motion.div>
              </div>

              <motion.button
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCreditCard className="w-5 h-5" />
                Fund Wallet (Flutterwave)
              </motion.button>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <InteractiveCard glowColor="blue">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Available Balance</p>
                    <p className="text-2xl font-bold">₦{(wallet.balance / 100).toLocaleString()}</p>
                  </div>
                  <div className="text-3xl">💰</div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InteractiveCard glowColor="orange">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Active Orders</p>
                    <p className="text-2xl font-bold">{transactions.filter(t => t.type === 'spend').length}</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InteractiveCard glowColor="purple">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FiClock className="w-6 h-6" />
                Transaction History
              </h3>

              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg">No transactions yet</p>
                  <Link href="/sabi/order">
                    <motion.button
                      className="mt-4 px-6 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                      whileHover={{ scale: 1.05 }}
                    >
                      Place Your First Order
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, idx) => (
                    <motion.div
                      key={idx}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">
                          {tx.type === 'fund' && '💵'}
                          {tx.type === 'spend' && '🛒'}
                          {tx.type === 'refund' && '↩️'}
                          {tx.type === 'bonus' && '🎁'}
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{tx.type}</p>
                          <p className="text-xs text-slate-400">{tx.description || 'Transaction'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {tx.type === 'spend' ? '-' : '+'}₦{(Math.abs(tx.amount) / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Navigation */}
        <motion.div className="flex gap-4 mt-12 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link href="/sabi/dashboard">
            <motion.button
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </motion.button>
          </Link>

          <Link href="/sabi/order">
            <motion.button
              className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrendingUp className="w-5 h-5" />
              Place Order
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
