'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiTarget, FiLogOut, FiSettings, FiBarChart2, FiDollarSign, FiBox, FiArrowRight, FiEdit2, FiBell, FiHelpCircle } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';
import { useResellerAuth } from '@/lib/useResellerAuth';

interface Order {
  id: string;
  serviceType: string;
  totalPrice: number;
  status: string;
  completionPercentage: number;
}

export default function ResellerDashboard() {
  const router = useRouter();
  const { reseller, loading: authLoading, logout } = useResellerAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    monthlyFee: 10000,
    pendingBalance: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (reseller) {
      fetchDashboardData();
    }
  }, [reseller]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      // Fetch analytics for stats
      const analyticsRes = await fetch('/api/reseller/analytics?range=month');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setStats({
          totalOrders: analyticsData.stats.totalOrders,
          totalRevenue: analyticsData.stats.totalRevenue,
          monthlyFee: 10000,
          pendingBalance: analyticsData.stats.resellerRevenue - 10000,
        });
      }

      // Fetch recent orders
      const ordersRes = await fetch('/api/reseller/orders?limit=3');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!reseller) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <CuteIconAnimation type="bounce" duration={1.5}>
              <FiTarget className="w-8 h-8 text-blue-400" />
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex gap-4 items-center"
          >
            <Link
              href="/reseller/dashboard/settings"
              className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              title="Settings"
            >
              <FiSettings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition flex gap-2 items-center"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-black mb-2">
                Welcome back, <GradientText>{reseller.businessName}</GradientText>
              </h1>
              <p className="text-slate-400">Manage your reseller account and watch your business grow</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/reseller/dashboard/support"
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                title="Help & Support"
              >
                <FiHelpCircle className="w-5 h-5" />
              </Link>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white relative">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { icon: FiBox, label: 'Total Orders', value: stats.totalOrders, color: 'blue' },
            { icon: FiDollarSign, label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, color: 'green' },
            { icon: FiBarChart2, label: 'This Month', value: `₦${(stats.totalRevenue - stats.monthlyFee).toLocaleString()}`, color: 'purple' },
            { icon: FiBell, label: 'Pending Balance', value: `₦${stats.pendingBalance.toLocaleString()}`, color: 'orange' },
          ].map((stat, i) => (
            <InteractiveCard key={i} glowColor={stat.color as any}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">This month</span>
                </div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </InteractiveCard>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {/* Site Status */}
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Your Reseller Site</h3>
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs font-semibold text-green-300">
                  Live
                </span>
              </div>
              <p className="text-slate-400 mb-4">www.yourresellerdomain.com</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Orders this month</span>
                  <span className="font-bold text-white">24</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <Link
                href="/reseller/dashboard/site"
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition flex items-center justify-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" />
                Customize Site
              </Link>
            </div>
          </InteractiveCard>

          {/* Billing Info */}
          <InteractiveCard glowColor="green">
            <div className="p-8">
              <h3 className="text-xl font-bold text-white mb-6">Billing & Payments</h3>
              <div className="space-y-4 mb-6">
                <div className="border-b border-slate-700 pb-4">
                  <p className="text-sm text-slate-400 mb-1">Monthly Maintenance Fee</p>
                  <p className="text-lg font-bold text-white">₦10,000</p>
                  <p className="text-xs text-slate-400 mt-1">Due: June 15, 2026</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Account Balance</p>
                  <p className="text-2xl font-bold text-green-400">₦45,000</p>
                </div>
              </div>
              <Link
                href="/reseller/dashboard/billing"
                className="w-full px-4 py-3 border border-green-500/50 text-green-400 font-bold rounded-lg hover:bg-green-500/10 transition flex items-center justify-center gap-2"
              >
                <FiDollarSign className="w-4 h-4" />
                View Billing
              </Link>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Recent Orders & Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Recent Orders */}
          <InteractiveCard glowColor="blue">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.length > 0 ? (
                  orders.map((order, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-white text-sm">{order.id}</p>
                        <p className="text-xs text-slate-400">{order.serviceType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">₦{order.totalPrice.toLocaleString()}</p>
                        <p className={`text-xs ${order.status === 'completed' ? 'text-green-400' : order.status === 'processing' ? 'text-blue-400' : 'text-yellow-400'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-sm">
                    No orders yet. Start by creating your first order!
                  </div>
                )}
              </div>
              <Link
                href="/reseller/dashboard/analytics"
                className="mt-4 w-full px-4 py-2 text-center text-blue-400 hover:text-blue-300 text-sm font-semibold transition flex items-center justify-center gap-1"
              >
                View All Orders <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </InteractiveCard>

          {/* API Access */}
          <InteractiveCard glowColor="purple">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">API Access</h3>
              <p className="text-sm text-slate-400 mb-4">
                Integrate your own interface with our powerful API. Build custom experiences for your customers.
              </p>
              <div className="bg-slate-800/70 rounded-lg p-3 mb-4 border border-slate-700 font-mono text-xs text-slate-300 break-all">
                sk_live_abc123def456...
              </div>
              <div className="space-y-2">
                <Link
                  href="/reseller/dashboard/api"
                  className="block w-full px-4 py-2 text-center text-purple-400 hover:text-purple-300 text-sm font-semibold transition"
                >
                  Manage API Keys
                </Link>
                <a
                  href="#docs"
                  className="block w-full px-4 py-2 text-center text-slate-400 hover:text-slate-300 text-sm font-semibold transition"
                >
                  View Docs
                </a>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}
