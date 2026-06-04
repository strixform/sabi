'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft, FiLoader, FiCheck, FiX, FiAlertCircle, FiCheckCircle,
  FiSave
} from 'react-icons/fi';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface Config {
  id: string;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  updatedAt: string;
  updatedBy: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [minOrderQuantity, setMinOrderQuantity] = useState('5');
  const [maxOrderQuantity, setMaxOrderQuantity] = useState('5000');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        const data = await res.json();

        if (data.success && data.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          setAuthorized(true);
          setAdminEmail(data.user.email);
          fetchConfig();
        } else {
          router.push('/sabi/dashboard');
        }
      } catch (err) {
        router.push('/sabi/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/sabi/admin/config');
      const data = await res.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setMinOrderQuantity(String(data.config.minOrderQuantity));
        setMaxOrderQuantity(String(data.config.maxOrderQuantity));
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setErrorMessage('Failed to load settings');
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const min = parseInt(minOrderQuantity);
    const max = parseInt(maxOrderQuantity);

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      setErrorMessage('Both values must be positive numbers');
      return;
    }

    if (min > max) {
      setErrorMessage('Minimum quantity cannot be greater than maximum quantity');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/sabi/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minOrderQuantity: min,
          maxOrderQuantity: max,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConfig(data.config);
        setSuccessMessage('✅ Settings saved successfully!');
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setErrorMessage('Failed to save settings');
    } finally {
      setSaving(false);
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
                <GradientText>SABI Settings</GradientText>
              </h1>
              <p className="text-sm text-slate-400">Configure order quantity limits for all services</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Logged in as</p>
              <p className="text-lg font-bold text-emerald-400">{adminEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
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

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                ⚙️ Order Quantity Configuration
              </h2>

              <div className="space-y-6">
                {/* Minimum Order Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Minimum Order Quantity
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Minimum number of orders that must be placed before batch processing starts
                  </p>
                  <input
                    type="number"
                    min="1"
                    value={minOrderQuantity}
                    onChange={(e) => setMinOrderQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-blue-500 focus:outline-none transition"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Current value: {minOrderQuantity}
                  </p>
                </div>

                {/* Maximum Order Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Maximum Order Quantity
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Maximum number of orders that can be batched together at once
                  </p>
                  <input
                    type="number"
                    min="1"
                    value={maxOrderQuantity}
                    onChange={(e) => setMaxOrderQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-blue-500 focus:outline-none transition"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Current value: {maxOrderQuantity}
                  </p>
                </div>

                {/* Current Configuration */}
                {config && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Last updated</p>
                    <p className="text-sm text-slate-300">
                      {new Date(config.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiSave className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </motion.button>

                <Link href="/sabi/admin" className="flex-1">
                  <motion.button
                    className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiArrowLeft className="w-5 h-5" />
                    Back to Admin
                  </motion.button>
                </Link>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <InteractiveCard glowColor="emerald">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-white">ℹ️ How It Works</h3>
              <div className="space-y-3 text-slate-300 text-sm">
                <p>
                  <strong className="text-emerald-400">Minimum Quantity:</strong> When Gamerz360 receives orders from SABI, it waits until at least this many orders are queued before creating a batch.
                </p>
                <p>
                  <strong className="text-emerald-400">Maximum Quantity:</strong> Each batch can contain up to this many orders. If more orders are pending, they will be split into multiple batches.
                </p>
                <p className="pt-2 border-t border-slate-700">
                  These settings apply globally to <strong>all services</strong> (followers, likes, comments, etc.). Once saved, Gamerz360 will use these values for batch creation.
                </p>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}
