'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EconomicsPage() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sabi/admin/economics')
      .then(r => (r.ok ? r.json() : null))
      .then(setD)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ngn = (n: number) => `₦${(n || 0).toLocaleString()}`;

  const Stat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) => (
    <div className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tone || 'text-white'}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">📊 Economics & Balance</h1>
          <Link href="/sabi/admin" className="text-sm text-blue-400 hover:underline">← Admin</Link>
        </div>

        {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p>
        : !d?.success ? <p className="text-red-400 py-10 text-center">Could not load (admin only).</p>
        : (
          <div className="space-y-8">
            {/* Margin health */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 mb-3">Margin (revenue − tasker cost)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Revenue (7d)" value={ngn(d.last7d.revenueNaira)} sub={`${d.last7d.orders} orders`} />
                <Stat label="Tasker cost (7d)" value={ngn(d.last7d.taskerCostNaira)} tone="text-orange-300" />
                <Stat label="Gross margin (7d)" value={ngn(d.last7d.grossMarginNaira)} tone={d.last7d.grossMarginNaira >= 0 ? 'text-emerald-400' : 'text-red-400'} sub={`${d.last7d.marginPct}% margin`} />
                <Stat label="Margin (all-time)" value={ngn(d.allTime.grossMarginNaira)} tone={d.allTime.grossMarginNaira >= 0 ? 'text-emerald-400' : 'text-red-400'} sub={`${d.allTime.marginPct}% · ${d.allTime.orders} orders`} />
              </div>
            </section>

            {/* Wallet liability */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 mb-3">Wallets (buyer funds)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Outstanding liability" value={ngn(d.wallets.outstandingLiabilityNaira)} sub="unspent funds we owe" tone="text-yellow-300" />
                <Stat label="Total funded" value={ngn(d.wallets.totalFundedNaira)} tone="text-emerald-400" />
                <Stat label="Total spent" value={ngn(d.wallets.totalSpentNaira)} />
                <Stat label="Total refunded" value={ngn(d.wallets.totalRefundedNaira)} tone="text-blue-300" />
              </div>
            </section>

            {/* Giveaways */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 mb-3">Giveaways & costs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Cashback paid" value={ngn(d.giveaways.cashbackNaira)} tone="text-purple-300" />
                <Stat label="Shortfall refunds" value={ngn(d.giveaways.shortfallRefundsNaira)} tone="text-orange-300" />
                <Stat label="Free refills" value={`${d.giveaways.freeRefills}`} sub={ngn(d.giveaways.freeRefillCostNaira) + ' cost'} tone="text-cyan-300" />
                <Stat label="Promo spent today" value={ngn(d.giveaways.promoSpentTodayNaira)} sub="of ₦200,000/day cap" tone="text-pink-300" />
              </div>
            </section>

            {/* Fraud signals */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 mb-3">Fraud signals — shared signup IPs (multi-account)</h2>
              {d.fraud.sharedSignupIps.length === 0 ? (
                <p className="text-slate-500 text-sm">No shared signup IPs flagged. ✅</p>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-white/[0.03] text-slate-400"><th className="text-left p-2">Signup IP</th><th className="text-right p-2">Accounts</th></tr></thead>
                    <tbody>
                      {d.fraud.sharedSignupIps.map((x: any) => (
                        <tr key={x.ip} className="border-t border-white/[0.04]">
                          <td className="p-2 font-mono text-slate-300">{x.ip}</td>
                          <td className={`p-2 text-right font-bold ${x.accounts >= 4 ? 'text-red-400' : 'text-yellow-300'}`}>{x.accounts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
