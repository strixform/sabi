'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-lg text-slate-400">Manage your account and track your orders in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 group-hover:border-blue-500/50 rounded-2xl p-8 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">WALLET BALANCE</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                ₦{loading ? '...' : (wallet.balance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-400">Ready to spend</p>
            </div>
            <Link
              href="/sabi/wallet"
              className="mt-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
            >
              + Fund Wallet
            </Link>
          </div>
        </div>

        {/* Total Spent */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 group-hover:border-purple-500/50 rounded-2xl p-8 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">TOTAL SPENT</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ₦{loading ? '...' : (wallet.spent / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-400">All-time investment</p>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 group-hover:border-pink-500/50 rounded-2xl p-8 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">ACTIVE ORDERS</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                {loading ? '...' : wallet.active}
              </div>
              <p className="text-sm text-slate-400">Running campaigns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero CTA */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />

        <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/30 p-12 text-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Ready to Grow?
              </h2>
              <p className="text-lg text-slate-300">Get real, active Nigerian engagement starting at just ₦500</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/sabi/order"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                Create New Order
              </Link>
              <Link
                href="/sabi/docs"
                className="px-8 py-4 border-2 border-slate-600 hover:border-slate-400 text-white font-bold rounded-xl transition"
              >
                View API Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Recent Orders</h2>
          <Link href="/sabi/orders" className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
            View All →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="space-y-3">
            <div className="text-5xl">📭</div>
            <p className="text-slate-400 text-lg">No orders yet</p>
            <p className="text-slate-500 text-sm">Your completed orders will appear here</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-bold mb-4">Pro Tips</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="text-blue-400">✓</span>
              <span>Start with small orders to test platform</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✓</span>
              <span>Real users deliver in 24-48 hours</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✓</span>
              <span>Bulk orders receive better rates</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-bold mb-4">Need Help?</h3>
          <p className="text-sm text-slate-300 mb-4">Our team is available 24/7 to support your success</p>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-semibold transition">
              Contact Support
            </button>
            <button className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-semibold transition">
              FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
