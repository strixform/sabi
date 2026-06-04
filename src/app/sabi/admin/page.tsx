'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft, FiLoader, FiCheck, FiX, FiTrendingUp, FiUsers, FiZap,
  FiChevronDown, FiFilter, FiRefreshCw, FiSend, FiAlertCircle, FiCheckCircle, FiSettings
} from 'react-icons/fi';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface SabiOrder {
  id: string;
  serviceType: string;
  targetUrl: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  user: { email: string; name: string };
}

interface Tasker {
  id: string;
  name: string;
  username: string;
  currentLoad: number;
  maxCapacity: number;
  specializations: string[];
  pointsPerTask: number;
}

interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  availableTaskers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [orders, setOrders] = useState<SabiOrder[]>([]);
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [forwardingOrders, setForwardingOrders] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check admin authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        const data = await res.json();

        if (data.success && data.user?.email) {
          const expectedAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Olusehinde09@gmail.com';
          const userEmail = data.user.email.toLowerCase();
          const adminEmail = expectedAdmin.toLowerCase();

          if (userEmail === adminEmail) {
            setAuthorized(true);
            setAdminEmail(data.user.email);
            fetchAdminData();
          } else {
            console.error(`Admin check failed: ${userEmail} !== ${adminEmail}`);
            router.push('/sabi/dashboard');
          }
        } else {
          router.push('/sabi/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/sabi/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch orders and stats
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/sabi/admin/orders'),
        fetch('/api/sabi/admin/stats'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      setErrorMessage('Failed to load admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      const allIds = new Set(filteredOrders.map(o => o.id));
      setSelectedOrders(allIds);
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const handleForwardToGamerz360 = async () => {
    if (selectedOrders.size === 0) {
      setErrorMessage('Please select at least one order');
      return;
    }

    try {
      setForwardingOrders(true);
      setErrorMessage('');
      setSuccessMessage('');

      const selectedOrderList = Array.from(selectedOrders);
      const ordersToForward = orders.filter(o => selectedOrderList.includes(o.id));

      // Generate Gamerz360 import data
      const gamerz360Data = {
        source: 'SABI Admin',
        timestamp: new Date().toISOString(),
        totalOrders: ordersToForward.length,
        orders: ordersToForward.map(o => ({
          id: o.id,
          service: o.serviceType,
          quantity: o.quantity,
          url: o.targetUrl,
          amount: o.totalPrice,
          customer: o.user.email,
        })),
      };

      // Copy to clipboard or download
      const json = JSON.stringify(gamerz360Data, null, 2);
      await navigator.clipboard.writeText(json);

      setSuccessMessage(
        `✅ ${ordersToForward.length} orders copied to clipboard! Paste in Gamerz360 Admin to continue.`
      );
      setSelectedOrders(new Set());
    } catch (err) {
      setErrorMessage('Error preparing orders for Gamerz360');
      console.error(err);
    } finally {
      setForwardingOrders(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center text-slate-400">
          <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-20 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2">
                <GradientText>SABI Orders</GradientText>
              </h1>
              <p className="text-sm text-slate-400">View all sabi orders • Forward to Gamerz360 Admin</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Logged in as</p>
              <p className="text-lg font-bold text-emerald-400">{adminEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Alert Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 flex items-center gap-2"
            >
              <FiCheckCircle className="w-5 h-5" />
              {successMessage}
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2"
            >
              <FiAlertCircle className="w-5 h-5" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <InteractiveCard glowColor="blue">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalOrders}</p>
                </div>
              </InteractiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <InteractiveCard glowColor="yellow">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pendingOrders}</p>
                </div>
              </InteractiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <InteractiveCard glowColor="purple">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Processing</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.processingOrders}</p>
                </div>
              </InteractiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InteractiveCard glowColor="emerald">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Completed</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.completedOrders}</p>
                </div>
              </InteractiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <InteractiveCard glowColor="orange">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-400">
                    ₦{(stats.totalRevenue / 100000).toFixed(1)}K
                  </p>
                </div>
              </InteractiveCard>
            </motion.div>
          </div>
        )}

        {/* Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <FiZap className="w-6 h-6 text-blue-400" />
                    All SABI Orders
                  </h3>
                  <span className="text-sm bg-slate-700/50 px-3 py-1 rounded-full text-slate-300">
                    {selectedOrders.size} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter Dropdown */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-800 transition"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>

                  <button
                    onClick={fetchAdminData}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400"
                    title="Refresh"
                  >
                    <FiRefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Forward to Gamerz360 Button */}
              {selectedOrders.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-orange-300 font-semibold">
                        <strong>{selectedOrders.size}</strong> order{selectedOrders.size !== 1 ? 's' : ''} ready for Gamerz360
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Copy order data and paste in Gamerz360 Admin to push to taskers
                      </p>
                    </div>
                    <motion.button
                      onClick={handleForwardToGamerz360}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={forwardingOrders}
                    >
                      <FiSend className="w-4 h-4" />
                      {forwardingOrders ? 'Copying...' : 'Copy & Forward'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onChange={toggleAllOrders}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Service</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-700/30 hover:bg-slate-800/30 transition"
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-slate-300">{order.id.slice(0, 8)}</td>
                          <td className="px-4 py-4 text-sm text-slate-300 capitalize">{order.serviceType}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{order.quantity}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-emerald-400">
                            ₦{(order.totalPrice / 100).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : order.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : order.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-400">{order.user.email}</td>
                          <td className="px-4 py-4 text-sm text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div className="mt-8 flex gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Link href="/sabi/admin/settings" className="flex-1">
            <motion.button
              className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiSettings className="w-5 h-5" />
              Settings
            </motion.button>
          </Link>
          <Link href="/sabi/dashboard" className="flex-1">
            <motion.button
              className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
