'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { SiGoogle } from 'react-icons/si';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';
import { InteractiveCard } from '@/components/InteractiveCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sabi/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/sabi/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { redirect: true, redirectTo: '/sabi/dashboard' });
    } catch (err) {
      setError('Google login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <CuteIconAnimation type="bounce" duration={1.5}>
              <div className="text-4xl">🎯</div>
            </CuteIconAnimation>
            <h1 className="text-4xl font-black">
              <GradientText>SABI</GradientText>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            <AnimateInText type="fade" delay={0.2}>
              Welcome back to real engagement
            </AnimateInText>
          </p>
        </motion.div>

        <InteractiveCard glowColor="blue">
          <motion.form
            onSubmit={handleEmailLogin}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-8 space-y-6"
          >
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-slate-300">
                <AnimateInText type="fade" delay={0.5}>
                  Email Address
                </AnimateInText>
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:outline-none text-white focus:ring-2 focus:ring-blue-500/20 transition"
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-slate-300">
                <AnimateInText type="fade" delay={0.6}>
                  Password
                </AnimateInText>
              </label>
              <motion.input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-blue-500/50 focus:outline-none text-white focus:ring-2 focus:ring-blue-500/20 transition"
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                <AnimateInText type="fade" delay={0}>
                  {error}
                </AnimateInText>
              </motion.div>
            )}

            {/* Email Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AnimateInText type="fade" delay={0.7}>
                {loading ? 'Signing in...' : 'Sign In'}
              </AnimateInText>
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4"
            >
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </motion.div>

            {/* Google Login Button */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 border-2 border-slate-700 hover:border-blue-400 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-slate-800/50"
            >
              <FloatingIcon delay={0} speed={3}>
                <SiGoogle className="text-xl" />
              </FloatingIcon>
              <span>
                <AnimateInText type="fade" delay={0.9}>
                  Continue with Google
                </AnimateInText>
              </span>
            </motion.button>
          </motion.form>
        </InteractiveCard>

        {/* Sign Up Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-slate-400 text-sm mt-6"
        >
          <AnimateInText type="fade" delay={1.1}>
            Don't have an account?{' '}
          </AnimateInText>
          <Link href="/sabi/register" className="text-blue-400 hover:text-blue-300 font-semibold transition">
            <AnimateInText type="fade" delay={1.2}>
              Sign up
            </AnimateInText>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
