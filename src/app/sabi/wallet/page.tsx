'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiCreditCard, FiTrendingUp, FiClock, FiEye, FiEyeOff, FiSettings, FiPlus } from 'react-icons/fi';
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
  const [showBalance, setShowBalance] = useState(true);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [showFundPanel, setShowFundPanel] = useState(false);
  const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSession(data.user);
          // Fetch wallet
          const walletRes = await fetch('/api/sabi/wallet', { credentials: 'include' });
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
        {/* Balance Hero Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-slate-900 to-blue-600/20 border border-emerald-500/20 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Available Balance</p>
                <div className="flex items-center gap-3">
                  <p className="text-5xl font-black text-white">
                    {showBalance ? `₦${(wallet.balance / 100).toLocaleString()}` : '••••••'}
                  </p>
                  <button onClick={() => setShowBalance(p => !p)}
                    className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-700/50">
                    {showBalance ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Link href="/sabi/wallet/settings"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-slate-700/50">
                <FiSettings className="w-3.5 h-3.5" /> Auto Top-Up
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Total Funded', value: wallet.totalFunded, color: 'text-emerald-400' },
                { label: 'Total Spent', value: wallet.totalSpent, color: 'text-orange-400' },
                { label: 'Refunded', value: wallet.totalRefunded, color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>
                    {showBalance ? `₦${(s.value / 100).toLocaleString()}` : '••••'}
                  </p>
                </div>
              ))}
            </div>

            {/* Fund button */}
            <button onClick={() => setShowFundPanel(p => !p)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20">
              <FiPlus className="w-5 h-5" /> Fund Wallet
            </button>

            {/* Inline fund panel */}
            {showFundPanel && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-[#0F1420]/80 rounded-xl border border-white/[0.06] space-y-3">
                <p className="text-sm font-semibold text-slate-300">Select or enter amount</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} onClick={() => setFundAmount(a.toString())}
                      className={`py-2 rounded-lg text-sm font-bold transition ${fundAmount === a.toString() ? 'bg-emerald-500 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'}`}>
                      ₦{a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                  placeholder="Custom amount (₦)"
                  className="w-full px-4 py-2.5 bg-[#0A0D14] border border-white/[0.06] rounded-lg text-white text-sm focus:border-emerald-500/60 outline-none" />
                <button
                  disabled={fundLoading || !fundAmount || Number(fundAmount) < 500}
                  onClick={async () => {
                    const amount = parseInt(fundAmount);
                    if (isNaN(amount) || amount < 500) return;
                    setFundLoading(true);
                    try {
                      const res = await fetch('/api/sabi/wallet/fund', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount }), credentials: 'include',
                      });
                      const data = await res.json();
                      if (data.paymentLink) window.location.href = data.paymentLink;
                    } finally { setFundLoading(false); }
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {fundLoading ? <><FiLoader className="w-4 h-4 animate-spin" /> Processing...</> : <>Pay via Flutterwave →</>}
                </button>
                <p className="text-xs text-slate-500 text-center">Minimum ₦500 · Secure payment via Flutterwave</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <FiClock className="w-4 h-4 text-slate-400" />
              <h3 className="text-white font-bold">Transaction History</h3>
              <span className="ml-auto text-xs text-slate-500">{transactions.length} transactions</span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#0F1420] flex items-center justify-center mx-auto mb-4">
                  <FiCreditCard className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 mb-1">No transactions yet</p>
                <p className="text-slate-500 text-sm mb-5">Fund your wallet and place your first order</p>
                <Link href="/sabi/order"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition">
                  <FiTrendingUp className="w-4 h-4" /> Place First Order
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {transactions.map((tx, idx) => {
                  const isDebit = tx.type === 'spend';
                  const icons: Record<string, string> = { fund: '💵', spend: '🛒', refund: '↩️', bonus: '🎁', refund_bonus: '🎁' };
                  return (
                    <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.015] transition">
                      <div className="w-10 h-10 rounded-xl bg-[#0F1420] flex items-center justify-center text-lg shrink-0">
                        {icons[tx.type] || '💳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm capitalize">{tx.type.replace(/_/g, ' ')}</p>
                        <p className="text-slate-500 text-xs truncate">{tx.description || 'Transaction'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${isDebit ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {isDebit ? '−' : '+'}₦{(Math.abs(tx.amount) / 100).toLocaleString()}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
