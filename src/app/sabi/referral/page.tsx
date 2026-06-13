'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiUsers, FiDollarSign, FiClock, FiGift, FiShare2, FiChevronRight } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';

interface ReferralStats {
  totalReferred: number;
  qualified: number;
  totalEarned: number;
  pendingEarnings: number;
  rewardPerReferral: number;
  cap?: number;
  capReached?: boolean;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  qualifiedAt: string | null;
  earned: number;
  status: 'paid' | 'pending' | 'waiting';
}

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',   dot: 'bg-yellow-400' },
  waiting: { label: 'Waiting', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',      dot: 'bg-slate-500' },
};

export default function ReferralPage() {
  const [data, setData] = useState<{ referralCode: string; referralLink: string; stats: ReferralStats; referrals: Referral[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetch('/api/sabi/referral')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  const copy = async (text: string, which: 'code' | 'link') => {
    await navigator.clipboard.writeText(text).catch(() => {});
    if (which === 'code') { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    else { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
  };

  const share = () => {
    if (!data) return;
    const text = `Join SABI and grow your social media presence! Use my referral code ${data.referralCode} to get started — we both earn ₦100. Sign up here: ${data.referralLink}`;
    if (navigator.share) {
      navigator.share({ title: 'Join SABI', text, url: data.referralLink }).catch(() => {});
    } else {
      copy(text, 'link');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center text-slate-500">
      Could not load referral data. Please refresh.
    </div>
  );

  const { stats, referralCode, referralLink, referrals } = data;

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <ModernSabiHeader />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 mb-4">
            <FiGift className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Refer & Earn</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Invite friends to SABI. When they place their first order, you both earn <span className="text-white font-semibold">₦100</span> — earn from up to <span className="text-white font-semibold">{stats.cap ?? 3} friends</span>.
          </p>
          {stats.capReached && (
            <p className="text-amber-400/90 text-xs mt-2">You&apos;ve reached the {stats.cap ?? 3}-referral reward limit — thanks for spreading the word!</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">Referred</span>
            </div>
            <div className="text-3xl font-black text-white">{stats.totalReferred}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">{stats.qualified} placed an order</div>
          </div>

          <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-xs">Total earned</span>
            </div>
            <div className="text-3xl font-black text-emerald-400">₦{stats.totalEarned.toLocaleString()}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">₦{stats.rewardPerReferral} per referral</div>
          </div>

          {stats.pendingEarnings > 0 && (
            <div className="col-span-2 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3">
              <FiClock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-yellow-400 font-bold text-sm">₦{stats.pendingEarnings.toLocaleString()} pending</div>
                <div className="text-slate-500 text-[11px]">Your referees placed an order — reward is processing</div>
              </div>
            </div>
          )}
        </div>

        {/* Referral code + link */}
        <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your referral code</div>

          {/* Code block */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#030507] border border-white/[0.08] rounded-xl px-4 py-3">
              <span className="text-2xl font-black text-white tracking-widest">{referralCode}</span>
            </div>
            <button onClick={() => copy(referralCode, 'code')}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition">
              {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#030507] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-400 text-xs truncate">
              {referralLink}
            </div>
            <button onClick={() => copy(referralLink, 'link')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl transition whitespace-nowrap">
              {copiedLink ? '✓ Copied' : 'Copy link'}
            </button>
          </div>

          {/* Share button */}
          <button onClick={share}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition">
            <FiShare2 className="w-4 h-4" />
            Share with friends
          </button>
        </div>

        {/* How it works */}
        <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">How it works</div>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your code or link with a friend', color: 'text-blue-400 bg-blue-500/10' },
              { step: '2', text: 'They sign up using your referral code', color: 'text-purple-400 bg-purple-500/10' },
              { step: '3', text: 'They place their first order on SABI', color: 'text-pink-400 bg-pink-500/10' },
              { step: '4', text: 'You both get ₦100 credited instantly', color: 'text-emerald-400 bg-emerald-500/10' },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${color}`}>{step}</div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral list */}
        <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your referrals</div>
            <span className="text-slate-600 text-xs">{referrals.length} total</span>
          </div>

          {referrals.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-3xl mb-3">👥</div>
              <p className="text-slate-500 text-sm">No referrals yet</p>
              <p className="text-slate-600 text-xs mt-1">Share your code to start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {referrals.map(r => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                      {r.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{r.name}</div>
                      <div className="text-slate-500 text-xs">{r.email}</div>
                      <div className="text-slate-600 text-[10px] mt-0.5">
                        Joined {new Date(r.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {r.qualifiedAt && ` · Ordered ${new Date(r.qualifiedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="text-right shrink-0 space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {r.earned > 0 && (
                        <div className="text-emerald-400 text-xs font-bold">+₦{r.earned.toLocaleString()}</div>
                      )}
                      {r.status === 'waiting' && (
                        <div className="text-slate-600 text-[10px]">awaiting order</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-[11px] pb-4">
          Rewards credit within 24 hours of your referee's first successful order.
        </p>
      </div>
    </div>
  );
}
