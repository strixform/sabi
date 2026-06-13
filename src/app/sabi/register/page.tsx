'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const ref = sp.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sabi/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, ...(referralCode ? { referralCode } : {}) }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); setTimeout(() => { window.location.href = '/sabi/dashboard'; }, 1500); }
      else setError(String(data.error || 'Registration failed'));
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirect_uri: 'https://sability.io/api/sabi/auth/google/callback',
      response_type: 'code', scope: 'openid email profile', state: 'register',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'][pwStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][pwStrength];

  if (success) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center p-12">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
          <FiCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Account Created!</h2>
        <p className="text-slate-400">Taking you to your dashboard...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-black flex-col justify-between p-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-16 group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-2xl scale-150 group-hover:bg-purple-500/40 transition" />
              <LogoImage className="w-24 h-24 relative z-10 group-hover:scale-105 transition-transform duration-300" />
            </div>
          </Link>
          <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-4">Join the movement</p>
          <h1 className="text-4xl font-black text-white leading-tight mb-6">
            Be part of<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nigeria's biggest
            </span><br />
            social network.
          </h1>
          <p className="text-white/50 leading-relaxed max-w-xs">
            300,000 Nigerians already on SABI — earning, engaging, growing. Now it's your turn.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {['100% real Nigerian users', 'Orders start in minutes', 'Secure wallet payments', '₦100 referral bonus when you invite friends'].map(t => (
            <div key={t} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-5 py-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                <FiCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-white/70 text-sm font-medium">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <LogoImage size="md" className="w-20 h-20 hover:scale-105 transition-transform" />
            </Link>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">Create account</h2>
          <p className="text-slate-400 mb-6">
            {referralCode ? <span className="text-emerald-400 font-semibold">🎁 Referral bonus applied! You'll get ₦100 on your first order.</span> : 'Free to join. Start in seconds.'}
          </p>

          <button type="button" onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition mb-6 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required
                  className="w-full pl-11 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition">
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: `${(pwStrength / 3) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required
                  className={`w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${confirmPassword && confirmPassword !== password ? 'border-red-500/60 focus:ring-red-500/20' : 'border-slate-700 focus:border-purple-500/60 focus:ring-purple-500/20'}`} />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-purple-500/25 mt-2">
              {loading ? 'Creating account...' : <><span>Create Free Account</span><FiArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/sabi/login" className="text-blue-400 hover:text-blue-300 font-bold transition">Sign in</Link>
          </p>
          <p className="text-center text-slate-500 text-xs mt-4">
            By signing up you agree to our{' '}
            <Link href="#" className="text-slate-400 hover:text-white transition">Terms</Link> and{' '}
            <Link href="#" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
