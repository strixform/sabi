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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/sabi/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/sabi/login';
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await signIn('google', { redirect: true, redirectTo: '/sabi/dashboard' });
    } catch (err) {
      setError('Google registration failed');
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
              Join thousands getting real engagement
            </AnimateInText>
          </p>
        </motion.div>

        <InteractiveCard glowColor="purple">
          <motion.form
            onSubmit={handleEmailRegister}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-8 space-y-5"
          >
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-slate-300">
                <AnimateInText type="fade" delay={0.5}>
                  Full Name
                </AnimateInText>
              </label>
              <motion.input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-purple-500/50 focus:outline-none text-white focus:ring-2 focus:ring-purple-500/20 transition"
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-slate-300">
                <AnimateInText type="fade" delay={0.55}>
                  Email Address
                </AnimateInText>
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-purple-500/50 focus:outline-none text-white focus:ring-2 focus:ring-purple-500/20 transition"
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-purple-500/50 focus:outline-none text-white focus:ring-2 focus:ring-purple-500/20 transition"
                whileFocus={{ scale: 1.02 }}
              />
              <p className="text-xs text-slate-500">Min 8 characters</p>
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-slate-300">
                <AnimateInText type="fade" delay={0.65}>
                  Confirm Password
                </AnimateInText>
              </label>
              <motion.input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:border-purple-500/50 focus:outline-none text-white focus:ring-2 focus:ring-purple-500/20 transition"
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

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
              >
                <AnimateInText type="fade" delay={0}>
                  {success}
                </AnimateInText>
              </motion.div>
            )}

            {/* Sign Up Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AnimateInText type="fade" delay={0.7}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </AnimateInText>
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="flex items-center gap-4"
            >
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </motion.div>

            {/* Google Sign Up Button */}
            <motion.button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 border-2 border-slate-700 hover:border-purple-400 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-slate-800/50"
            >
              <FloatingIcon delay={0} speed={3}>
                <SiGoogle className="text-xl" />
              </FloatingIcon>
              <span>
                <AnimateInText type="fade" delay={0.85}>
                  Sign up with Google
                </AnimateInText>
              </span>
            </motion.button>
          </motion.form>
        </InteractiveCard>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-slate-400 text-sm mt-6"
        >
          <AnimateInText type="fade" delay={0.95}>
            Already have an account?{' '}
          </AnimateInText>
          <Link href="/sabi/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
            <AnimateInText type="fade" delay={1}>
              Sign in
            </AnimateInText>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
