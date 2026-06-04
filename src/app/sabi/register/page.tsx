'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget } from 'react-icons/fi';
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
              <FiTarget className="w-8 h-8 text-blue-400" />
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
          <div className="p-8 space-y-6">
            {/* Google Sign In Button */}
            <motion.button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "99067746147-30ip8ot6mkiq41ojb3mpdg3atv9ug0fv.apps.googleusercontent.com",
                  redirect_uri: `${typeof window !== 'undefined' ? window.location.origin : 'https://sability.io'}/api/sabi/auth/google/callback`,
                  response_type: 'code',
                  scope: 'openid email profile',
                  state: 'register',
                });
                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </motion.div>

            {/* Email/Password Form */}
          <motion.form
            onSubmit={handleEmailRegister}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-5"
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

          </motion.form>
          </div>
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
