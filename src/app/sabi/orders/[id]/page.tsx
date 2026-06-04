'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiCheck, FiTrendingUp } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { getCardColor } from '@/lib/designSystem';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/sabi/orders?id=${orderId}`);
        const data = await response.json();
        if (data.success && data.orders) {
          setOrder(data.orders[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <ModernSabiHeader showNavigation={true} />
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <ModernSabiHeader showNavigation={true} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-red-400 mb-6 text-xl">Order not found</p>
            <Link href="/sabi/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg"
              >
                Back to Dashboard
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    executing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const statusSteps = ['pending', 'processing', 'executing', 'completed'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/sabi/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition flex items-center gap-2 border border-slate-700/50"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </motion.button>
          </Link>
        </motion.div>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black mb-2">
                <GradientText>Order #{order.id?.substring(0, 8)}</GradientText>
              </h1>
              <p className="text-slate-400">Created {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-6 py-2 rounded-full border font-bold ${statusColors[order.status] || statusColors.pending}`}>
              {order.status.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" />
                Order Progress
              </h3>
              <div className="space-y-6">
                {statusSteps.map((status, index) => (
                  <motion.div key={status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                          index <= currentStepIndex ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-700 text-slate-400'
                        }`}
                        animate={index <= currentStepIndex ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {index <= currentStepIndex ? <FiCheck className="w-6 h-6" /> : index + 1}
                      </motion.div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-16 transition-all ${index < currentStepIndex ? 'bg-gradient-to-b from-blue-500 to-transparent' : 'bg-slate-700'}`}
                        />
                      )}
                    </div>
                    <div className="py-2 flex-1">
                      <div className="font-bold capitalize text-lg">{status}</div>
                      <div className="text-sm text-slate-400">
                        {status === 'pending' && 'Waiting for confirmation'}
                        {status === 'processing' && 'Processing your order'}
                        {status === 'executing' && 'Active campaign running'}
                        {status === 'completed' && 'Order completed successfully'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-10 pt-8 border-t border-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-300">Completion</span>
                  <span className="text-sm font-bold text-blue-400">{order.completionPercentage || 0}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    animate={{ width: `${order.completionPercentage || 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Order Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InteractiveCard glowColor="cyan">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6">Order Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Service Type:</span>
                    <span className="font-bold capitalize text-cyan-400">{order.serviceType}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-bold">{order.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Target URL:</span>
                    <span className="font-mono text-xs text-right truncate text-slate-300">{order.targetUrl}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-slate-400">Completed:</span>
                    <span className="font-bold text-cyan-400 text-lg">{order.completionPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          {/* Pricing Breakdown Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InteractiveCard glowColor="orange">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6">Pricing Breakdown</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Base Price:</span>
                    <span className="font-bold">₦{order.totalPrice?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Platform Fee (15%):</span>
                    <span className="font-bold text-orange-400">₦{order.platformFee?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 text-base bg-slate-800/50 p-4 rounded-lg">
                    <span className="font-bold text-slate-300">Total Amount:</span>
                    <span className="font-black text-orange-400">₦{((order.totalPrice || 0) + (order.platformFee || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>

        {/* Campaign Info */}
        {order.gamesz360CampaignId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InteractiveCard glowColor="emerald">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-emerald-400" />
                  Campaign Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <span className="text-slate-400">Campaign ID:</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">{order.gamesz360CampaignId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">Active</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
