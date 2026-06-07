'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheck, FiArrowRight } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/sabi/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { setSent(true); }
      else setError(String(data.error || 'Something went wrong'));
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center px-4">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <LogoImage className="w-14 h-14 hover:scale-105 transition-transform" />
          </Link>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-white/40 mb-2">We sent a password reset link to</p>
            <p className="text-white/70 font-medium mb-8">{email}</p>
            <p className="text-white/30 text-sm mb-6">Didn't receive it? Check your spam folder or try again.</p>
            <button onClick={() => setSent(false)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">
              Try a different email
            </button>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl border border-white/[0.07]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>
            <Link href="/sabi/login"
              className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm mb-8 transition-colors duration-300">
              <FiArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>

            <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">
              Enter the email address on your account and we'll send you a link to reset your password.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2 tracking-wide">Email address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-3.5 text-white/25 w-4 h-4" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-11 pr-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition duration-300"
                  />
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </motion.p>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-black transition-all duration-300 disabled:opacity-50 group"
                style={{ background: loading ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.92)' }}>
                {loading ? 'Sending...' : (
                  <>Send reset link <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
