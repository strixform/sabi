'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiTrendingUp, FiFilter, FiCalendar } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

interface Order {
  id: string;
  serviceType: string;
  targetUrl: string;
  quantity: number;
  totalPrice: number;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  createdAt: string;
  completionPercentage: number;
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  processingOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenue: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reseller/analytics?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = stats.totalRevenue;
  const completedOrders = stats.completedOrders;
  const processingOrders = stats.processingOrders;

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'blue', icon: '📦' },
    { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'green', icon: '💰' },
    { label: 'Completed', value: completedOrders, color: 'green', icon: '✓' },
    { label: 'Processing', value: processingOrders, color: 'blue', icon: '⏳' },
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/reseller/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <CuteIconAnimation type="bounce" duration={1.5}>
              <FiTarget className="w-8 h-8 text-blue-400" />
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/reseller/dashboard" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black mb-2">
                Analytics & <GradientText>Performance</GradientText>
              </h1>
              <p className="text-slate-400">Track your orders, revenue, and customer engagement</p>
            </div>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none flex items-center gap-2"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, i) => (
            <InteractiveCard key={i} glowColor={stat.color as any}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-2xl">{stat.icon}</div>
                  <FiTrendingUp className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </InteractiveCard>
          ))}
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">All Orders</h2>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-300 text-sm font-semibold flex gap-2 items-center">
              <FiFilter className="w-4 h-4" />
              Filter
            </button>
          </div>

          <InteractiveCard glowColor="blue">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Target</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-400">{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{order.serviceType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400 truncate">{order.targetUrl}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">{order.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-400">₦{order.totalPrice.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${order.completionPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 w-8">
                            {order.completionPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-500/20 text-green-300'
                              : order.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{order.createdAt}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Service Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 grid md:grid-cols-2 gap-6"
        >
          {/* By Service Type */}
          <InteractiveCard glowColor="purple">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-6">Orders by Service Type</h3>
              <div className="space-y-4">
                {['Followers', 'Engagement', 'Likes', 'Comments', 'Views'].map((service, i) => {
                  const count = orders.filter(o => o.serviceType === service).length;
                  const percentage = (count / orders.length) * 100;
                  return (
                    <div key={service}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white">{service}</span>
                        <span className="text-sm font-bold text-slate-400">{count} orders</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </InteractiveCard>

          {/* By Status */}
          <InteractiveCard glowColor="green">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-6">Orders by Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Completed', count: completedOrders, color: 'green' },
                  { label: 'Processing', count: processingOrders, color: 'blue' },
                  { label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'yellow' },
                  { label: 'Failed', count: orders.filter(o => o.status === 'failed').length, color: 'red' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className={`text-sm font-bold text-${item.color}-400`}>{item.count} orders</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400`}
                        style={{ width: `${((item.count || 0) / orders.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}
