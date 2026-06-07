'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiCheck, FiX, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Auto-read code from URL ?code=
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const urlCode = sp.get('code');
    if (urlCode) { setCode(urlCode); verify(urlCode); }
  }, []);

  const verify = async (c?: string) => {
    const finalCode = (c || code).trim();
    if (!finalCode) return;
    setLoading(true); setStatus('idle');
    try {
      const res = await fetch('/api/sabi/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: finalCode }),
      });
      const data = await res.json();
      if (data.success) { setStatus('success'); setMessage(data.alreadyVerified ? 'Already verified!' : 'Email verified successfully!'); }
      else { setStatus('error'); setMessage(data.error || 'Invalid code'); }
    } catch { setStatus('error'); setMessage('Network error, please try again.'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/sabi/auth/verify', { method: 'PUT' });
      const data = await res.json();
      setMessage(data.success ? 'New code sent to your email!' : data.error || 'Failed to resend');
    } catch { setMessage('Failed to resend'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <LogoImage size="md" className="w-12 h-12" />
        </div>

        {status === 'success' ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-10">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">{message}</h2>
            <p className="text-slate-400 mb-8">Your account is fully verified. You can now access all features.</p>
            <Link href="/sabi/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:brightness-110 transition">
              Go to Dashboard <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FiMail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Verify your email</h2>
                <p className="text-slate-400 text-sm">Enter the 6-digit code we sent you</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-2xl font-bold tracking-[0.5em] text-center placeholder-slate-600 focus:border-blue-500/60 outline-none transition"
                />
              </div>

              {status === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <FiX className="w-4 h-4 shrink-0" /> {message}
                </motion.div>
              )}

              <button
                onClick={() => verify()}
                disabled={loading || code.length < 6}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? <><FiRefreshCw className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Email'}
              </button>

              <div className="text-center">
                <p className="text-slate-500 text-sm mb-2">Didn't receive the email?</p>
                <button onClick={resend} disabled={resending}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition flex items-center gap-1 mx-auto disabled:opacity-50">
                  <FiRefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
                {message && status === 'idle' && <p className="text-emerald-400 text-xs mt-2">{message}</p>}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link href="/sabi/dashboard" className="text-slate-400 hover:text-white transition">
            Skip for now →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
