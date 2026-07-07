'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiCreditCard, FiTrendingUp, FiClock, FiEye, FiEyeOff, FiSettings, FiPlus, FiCopy, FiCheck } from 'react-icons/fi';
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
  const [requeryLoading, setRequeryLoading] = useState(false);
  const [requeryMsg, setRequeryMsg] = useState('');

  // Self-service funding re-check — verifies the user's recent tx_ref(s) directly
  // and credits any successful payment the webhook hasn't reflected yet.
  const recheckFunding = async () => {
    setRequeryLoading(true); setRequeryMsg('');
    try {
      let txRefs: string[] = [];
      try { txRefs = JSON.parse(localStorage.getItem('sabi_fund_refs') || '[]'); } catch {}
      const res = await fetch('/api/sabi/wallet/requery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRefs }), credentials: 'include',
      });
      const d = await res.json().catch(() => ({}));
      setRequeryMsg(d.message || (d.error || 'Could not re-check right now — try again shortly.'));
      if (d.success && d.found > 0) { try { router.refresh(); } catch {} location.reload(); }
    } finally { setRequeryLoading(false); }
  };
  const [showFundPanel, setShowFundPanel] = useState(false);
  const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

  // Dedicated (static) virtual account — optional, opt-in bank-transfer funding.
  const [vaAccount, setVaAccount] = useState<{ accountNumber: string; bankName: string; accountName: string | null } | null>(null);
  const [showNinPanel, setShowNinPanel] = useState(false);
  const [ninInput, setNinInput] = useState('');
  const [vaLoading, setVaLoading] = useState(false);
  const [vaError, setVaError] = useState('');
  const [copied, setCopied] = useState(false);
  const [vaRecheckLoading, setVaRecheckLoading] = useState(false);
  const [vaRecheckMsg, setVaRecheckMsg] = useState('');

  const recheckVaFunding = async () => {
    setVaRecheckLoading(true);
    setVaRecheckMsg('');
    try {
      const res = await fetch('/api/sabi/wallet/virtual-account/reconcile', {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.credited > 0) {
        setVaRecheckMsg(`✅ Credited ₦${(data.amountKobo / 100).toLocaleString()} — refreshing…`);
        setTimeout(() => window.location.reload(), 1200);
      } else if (data.success) {
        setVaRecheckMsg('No new transfer found yet. Bank transfers can take a few minutes — try again shortly.');
      } else {
        setVaRecheckMsg(data.error || 'Could not check right now. Please try again.');
      }
    } catch {
      setVaRecheckMsg('Network error — please try again.');
    } finally {
      setVaRecheckLoading(false);
    }
  };

  const copyAccount = async () => {
    if (!vaAccount) return;
    try {
      await navigator.clipboard.writeText(vaAccount.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — user can still read it */ }
  };

  const createDedicatedAccount = async () => {
    const nin = ninInput.trim();
    if (!/^\d{11}$/.test(nin)) { setVaError('Enter your 11-digit NIN'); return; }
    setVaError('');
    setVaLoading(true);
    try {
      const res = await fetch('/api/sabi/wallet/virtual-account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin }), credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.account) {
        setVaAccount(data.account);
        setShowNinPanel(false);
        setNinInput('');
      } else {
        setVaError(data.error || 'Could not create your account. Please try again.');
      }
    } catch {
      setVaError('Network error — please try again.');
    } finally {
      setVaLoading(false);
    }
  };

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
          // Load any existing dedicated account (non-blocking for the rest of the page).
          fetch('/api/sabi/wallet/virtual-account', { credentials: 'include' })
            .then(r => r.json())
            .then(d => { if (d?.success && d.account) setVaAccount(d.account); })
            .catch(() => {});
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
                {(() => {
                  const amt = parseInt(fundAmount) || 0;
                  const rate = amt >= 100000 ? 0.08 : amt >= 50000 ? 0.05 : amt >= 20000 ? 0.03 : 0;
                  const bonus = Math.round(amt * rate);
                  return bonus > 0
                    ? <p className="text-xs text-emerald-400 font-bold">🎁 +₦{bonus.toLocaleString()} bonus credited on this top-up ({Math.round(rate * 100)}%)!</p>
                    : <p className="text-[11px] text-slate-500">🎁 Top-up bonus: fund ₦20k+ for +3%, ₦50k+ for +5%, ₦100k+ for +8%.</p>;
                })()}
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
                      // Remember this tx_ref so the user can self-re-check if the
                      // webhook is delayed (no need to message support).
                      if (data.txRef) {
                        try {
                          const prev = JSON.parse(localStorage.getItem('sabi_fund_refs') || '[]');
                          localStorage.setItem('sabi_fund_refs', JSON.stringify([data.txRef, ...prev].slice(0, 8)));
                        } catch {}
                      }
                      if (data.paymentLink) window.location.href = data.paymentLink;
                    } finally { setFundLoading(false); }
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {fundLoading ? <><FiLoader className="w-4 h-4 animate-spin" /> Processing...</> : <>Pay via Flutterwave →</>}
                </button>
                <p className="text-xs text-slate-500 text-center">Minimum ₦500 · Secure payment via Flutterwave</p>
                {/* Self-service: paid but not showing? re-check instead of messaging support */}
                <div className="text-center">
                  <button
                    onClick={recheckFunding}
                    disabled={requeryLoading}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline disabled:opacity-40"
                  >
                    {requeryLoading ? 'Re-checking…' : 'Paid but not showing? Re-check now'}
                  </button>
                  {requeryMsg && <p className="text-[11px] text-slate-400 mt-1">{requeryMsg}</p>}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Dedicated bank-transfer account (optional, opt-in via NIN) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-1">
              <FiCreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-bold">Fund by bank transfer</h3>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">No card needed</span>
            </div>

            {vaAccount ? (
              <>
                <p className="text-slate-400 text-sm mb-4">Transfer any amount to your dedicated account from any bank app — it reflects in your wallet automatically.</p>
                <div className="rounded-xl bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 p-5">
                  <p className="text-xs text-slate-500 mb-1">{vaAccount.bankName || 'Bank'}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-black text-white tracking-wider">{vaAccount.accountNumber}</p>
                    <button onClick={copyAccount}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition">
                      {copied ? <><FiCheck className="w-4 h-4" /> Copied</> : <><FiCopy className="w-4 h-4" /> Copy</>}
                    </button>
                  </div>
                  {vaAccount.accountName && <p className="text-sm text-slate-400 mt-2">{vaAccount.accountName}</p>}
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <p className="text-[11px] text-slate-500">This account is permanently yours — save it in your bank app for instant top-ups anytime.</p>
                  <button onClick={recheckVaFunding} disabled={vaRecheckLoading}
                    className="shrink-0 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline disabled:opacity-40">
                    {vaRecheckLoading ? 'Checking…' : 'Sent money but not showing?'}
                  </button>
                </div>
                {vaRecheckMsg && <p className="text-[11px] text-slate-400 mt-1">{vaRecheckMsg}</p>}
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-4">
                  Prefer to pay by transfer? Get a <span className="text-emerald-300 font-semibold">permanent account number</span> that&rsquo;s only yours.
                  Enter your NIN once to activate it — or just keep using the card option above.
                </p>
                {!showNinPanel ? (
                  <button onClick={() => { setShowNinPanel(true); setVaError(''); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold rounded-xl transition text-sm">
                    <FiPlus className="w-4 h-4" /> Get my dedicated account
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#0F1420]/80 rounded-xl border border-white/[0.06] space-y-3 max-w-md">
                    <label className="text-sm font-semibold text-slate-300">National Identification Number (NIN)</label>
                    <input
                      value={ninInput}
                      onChange={e => setNinInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      inputMode="numeric" placeholder="11-digit NIN"
                      className="w-full px-4 py-2.5 bg-[#0A0D14] border border-white/[0.06] rounded-lg text-white text-sm tracking-wider focus:border-emerald-500/60 outline-none" />
                    {vaError && <p className="text-xs text-red-400">{vaError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={createDedicatedAccount} disabled={vaLoading || ninInput.length !== 11}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2">
                        {vaLoading ? <><FiLoader className="w-4 h-4 animate-spin" /> Creating…</> : <>Activate account</>}
                      </button>
                      <button onClick={() => { setShowNinPanel(false); setVaError(''); }}
                        className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-semibold">Cancel</button>
                    </div>
                    <p className="text-[11px] text-slate-500">Your NIN is used once to create your bank account and is not stored. Required by Nigerian banking rules for a permanent account.</p>
                  </motion.div>
                )}
              </>
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
