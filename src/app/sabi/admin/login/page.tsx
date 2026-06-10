'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiKey, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Admin token is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validate token against the server-side API — never compare client-side
      const res = await fetch('/api/sabi/admin/orders?limit=1', {
        headers: { 'x-admin-token': token },
      });

      if (res.ok || res.status === 200) {
        // Server confirmed token is valid — store and redirect
        sessionStorage.setItem('sabi_admin_token', token);
        router.push('/sabi/admin');
      } else if (res.status === 403) {
        setError('Invalid admin token');
      } else {
        setError('Unable to verify token — please try again');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#030507] overflow-hidden flex items-center justify-center">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl mb-4 shadow-lg shadow-blue-500/50"
              whileHover={{ scale: 1.05 }}
            >
              🍎
            </motion.div>
            <h1 className="text-3xl font-black mb-2">
              <GradientText>SABI Admin</GradientText>
            </h1>
            <p className="text-slate-400 text-sm">Access admin dashboard with secure token</p>
          </div>

          {/* Card */}
          <InteractiveCard glowColor="blue">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-3 text-sm"
                >
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Token Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Admin Token
                </label>
                <div className="relative">
                  <FiKey className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setError('');
                    }}
                    placeholder="sk_admin_..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Enter your admin access token to continue
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Access Admin Dashboard
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 <strong>Admin token</strong> is required to access the admin dashboard. This token is securely stored and never shared.
                </p>
              </div>
            </form>
          </InteractiveCard>

          {/* Back Link */}
          <div className="text-center mt-8">
            <a
              href="/sabi/login"
              className="text-sm text-slate-400 hover:text-blue-400 transition"
            >
              ← Back to regular login
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
