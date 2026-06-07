'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowRight } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (t) setToken(t);
  }, []);

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/sabi/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (data.success) { setDone(true); }
      else setError(String(data.error || 'Reset failed. The link may have expired.'));
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <LogoImage className="w-14 h-14 hover:scale-105 transition-transform" />
          </Link>
        </div>

        {done ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Password updated</h2>
            <p className="text-white/40 mb-8">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Link href="/sabi/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-black transition-all duration-300 hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.92)' }}>
              Sign in <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="p-8 rounded-2xl border border-white/[0.07]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>
            <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
            <p className="text-white/40 text-sm mb-8">Choose a strong password for your account.</p>

            {!token && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm">
                Invalid or missing reset token. Please request a new reset link.
                <Link href="/sabi/forgot-password" className="block mt-2 text-yellow-400 hover:text-yellow-300 font-medium">
                  Request new link →
                </Link>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2 tracking-wide">New password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-3.5 text-white/25 w-4 h-4" />
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" required
                    className="w-full pl-11 pr-12 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 focus:outline-none transition duration-300"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-3.5 text-white/25 hover:text-white/50 transition">
                    {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: `${(strength / 3) * 100}%` }} />
                    </div>
                    <span className="text-xs text-white/30">{['', 'Weak', 'Fair', 'Strong'][strength]}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/50 mb-2 tracking-wide">Confirm password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-3.5 text-white/25 w-4 h-4" />
                  <input
                    type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password" required
                    className={`w-full pl-11 pr-4 py-3 bg-[#0A0D14] border rounded-xl text-white placeholder-white/20 focus:outline-none transition duration-300 ${confirm && confirm !== password ? 'border-red-500/40' : 'border-white/[0.07] focus:border-blue-500/50'}`}
                  />
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </motion.p>
              )}

              <button type="submit" disabled={loading || !token}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-black transition-all duration-300 disabled:opacity-50 group"
                style={{ background: 'rgba(255,255,255,0.92)' }}>
                {loading ? 'Updating...' : (
                  <>Update password <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </button>
            </form>

            <p className="text-center text-white/20 text-sm mt-6">
              Remember your password?{' '}
              <Link href="/sabi/login" className="text-white/40 hover:text-white/70 transition-colors">Sign in</Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
