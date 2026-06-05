'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

const TRUST_BADGES = [
  { emoji: '🇳🇬', text: 'Real Nigerian audience' },
  { emoji: '⚡', text: 'Orders start in minutes' },
  { emoji: '🔒', text: 'Secure & private' },
  { emoji: '💰', text: 'Money-back guarantee' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/sabi/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) { window.location.href = '/sabi/dashboard'; }
      else setError(data.error || 'Invalid email or password');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/api/sabi/auth/google/callback`,
      response_type: 'code', scope: 'openid email profile', state: 'login',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left panel — bold brand (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black flex-col justify-between p-14">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Logo — large, clickable, with glow */}
          <Link href="/" className="inline-block mb-16 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-2xl scale-150 group-hover:bg-blue-500/40 transition" />
              <LogoImage className="w-24 h-24 relative z-10 group-hover:scale-105 transition-transform duration-300" />
            </div>
          </Link>

          <div className="mb-6">
            <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-4">Nigeria's social engine</p>
            <h1 className="text-5xl font-black text-white leading-[1.05] mb-6">
              300,000<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">real Nigerians</span><br />
              ready for you.
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Real people. Real engagement. Every state, every platform, every metric — powered by actual Nigerians.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          {TRUST_BADGES.map(b => (
            <div key={b.text} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-5 py-3 backdrop-blur-sm">
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-white/80 font-semibold">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <LogoImage size="md" className="w-20 h-20 hover:scale-105 transition-transform" />
            </Link>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to your Sabi account</p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition mb-6 shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                <Link href="/sabi/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">Forgot password?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-11 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition">
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </motion.p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-500/25 mt-2"
            >
              {loading ? 'Signing in...' : <><span>Sign In</span><FiArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/sabi/register" className="text-blue-400 hover:text-blue-300 font-bold transition">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
