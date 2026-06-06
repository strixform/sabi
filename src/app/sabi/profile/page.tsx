'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiUser, FiMail, FiLock, FiBell, FiArrowLeft, FiCheck,
  FiEye, FiEyeOff, FiLoader, FiShield, FiEdit2,
} from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LogoImage } from '@/components/LogoImage';

type Tab = 'profile' | 'email' | 'password' | 'notifications';

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/sabi/profile').then(r => r.json()).then(d => {
      if (d.success) {
        setUser(d.user);
        setName(d.user.name || '');
        setBusinessName(d.user.businessName || '');
        setNotifyEmail(d.user.notifyEmail ?? true);
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async (action: string, body: object) => {
    setSaving(true); setMsg(null);
    const res = await fetch('/api/sabi/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    setMsg({ text: data.message || data.error || 'Done', ok: res.ok });
    setSaving(false);
    if (res.ok && action === 'changePassword') {
      setTimeout(() => { window.location.href = '/sabi/login'; }, 2000);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof FiUser }[] = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'password', label: 'Password', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center">
      <div className="w-6 h-6 border border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <Link href="/sabi/dashboard" className="flex items-center gap-2 text-white/30 hover:text-white/60 mb-8 text-sm transition-colors">
          <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.07] flex items-center justify-center">
            <span className="text-2xl font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user?.name}</h1>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.emailVerified
                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><FiCheck className="w-3 h-3" /> Verified</span>
                : <Link href="/sabi/verify" className="text-xs text-yellow-400 hover:text-yellow-300 transition">⚠ Email not verified</Link>}
              {user?.googleId && <span className="text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full">Google account</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-white/[0.06] border border-white/10 text-white'
                    : 'text-white/35 hover:text-white/60'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Message */}
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${msg.ok
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {msg.text}
          </motion.div>
        )}

        {/* Panel */}
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>

          {/* ── PROFILE TAB ────────────────────────────────────────────── */}
          {tab === 'profile' && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-white font-bold mb-1">Display Name</h2>
                <p className="text-white/40 text-sm mb-4">This is the name shown on your account and emails.</p>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
              </div>
              <div>
                <h2 className="text-white font-bold mb-1">Business Name <span className="text-white/30 font-normal">(optional)</span></h2>
                <p className="text-white/40 text-sm mb-4">For agencies or businesses using SABI.</p>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="Your business or brand name"
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
              </div>
              <div className="pt-2">
                <p className="text-white/20 text-xs font-mono mb-1">Member since {new Date(user?.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</p>
                {user?.referralCode && <p className="text-white/20 text-xs font-mono">Referral code: <span className="text-white/50">{user.referralCode}</span></p>}
              </div>
              <button onClick={() => save('updateInfo', { name, businessName })} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black disabled:opacity-50 transition"
                style={{ background: 'rgba(255,255,255,0.92)' }}>
                {saving ? <FiLoader className="w-4 h-4 animate-spin text-black" /> : <FiEdit2 className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {/* ── EMAIL TAB ──────────────────────────────────────────────── */}
          {tab === 'email' && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-white font-bold mb-1">Current Email</h2>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl">
                  <FiMail className="w-4 h-4 text-white/30" />
                  <span className="text-white/60">{user?.email}</span>
                  {user?.emailVerified && <FiCheck className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
              </div>
              {user?.googleId ? (
                <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <p className="text-white/50 text-sm flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-blue-400" />
                    Your account is linked to Google. Email is managed by Google and cannot be changed here.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-white font-bold mb-1">New Email Address</h2>
                    <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email"
                      placeholder="new@example.com"
                      className="w-full px-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold mb-1">Current Password</h2>
                    <p className="text-white/40 text-sm mb-3">Required to confirm this change.</p>
                    <div className="relative">
                      <input value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        type={showPw ? 'text' : 'password'} placeholder="Your current password"
                        className="w-full px-4 py-3 pr-12 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
                      <button onClick={() => setShowPw(p => !p)} className="absolute right-4 top-3.5 text-white/25 hover:text-white/50 transition">
                        {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => save('changeEmail', { newEmail, currentPassword: currentPw })} disabled={saving || !newEmail || !currentPw}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black disabled:opacity-50 transition"
                    style={{ background: 'rgba(255,255,255,0.92)' }}>
                    {saving ? <FiLoader className="w-4 h-4 animate-spin text-black" /> : <FiMail className="w-4 h-4" />}
                    Update Email
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── PASSWORD TAB ───────────────────────────────────────────── */}
          {tab === 'password' && (
            <div className="p-8 space-y-6">
              {user?.googleId ? (
                <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <p className="text-white/50 text-sm flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-blue-400" />
                    Your account uses Google sign-in. You don&apos;t have a separate SABI password.
                    To set one, use <Link href="/sabi/forgot-password" className="text-blue-400 hover:text-blue-300 transition">Forgot Password</Link>.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-white font-bold mb-1">Current Password</h2>
                    <div className="relative">
                      <input value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        type={showPw ? 'text' : 'password'} placeholder="Current password"
                        className="w-full px-4 py-3 pr-12 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
                      <button onClick={() => setShowPw(p => !p)} className="absolute right-4 top-3.5 text-white/25 hover:text-white/50 transition">
                        {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-white font-bold mb-1">New Password</h2>
                    <input value={newPw} onChange={e => setNewPw(e.target.value)}
                      type="password" placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 bg-[#0A0D14] border border-white/[0.07] rounded-xl text-white placeholder-white/20 focus:border-blue-500/50 outline-none transition" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold mb-1">Confirm New Password</h2>
                    <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      type="password" placeholder="Repeat new password"
                      className={`w-full px-4 py-3 bg-[#0A0D14] border rounded-xl text-white placeholder-white/20 focus:outline-none transition ${confirmPw && confirmPw !== newPw ? 'border-red-500/40' : 'border-white/[0.07] focus:border-blue-500/50'}`} />
                  </div>
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-sm text-yellow-300/70">
                    ⚠ Changing your password will sign you out of all devices.
                  </div>
                  <button
                    onClick={() => {
                      if (newPw !== confirmPw) { setMsg({ text: 'Passwords do not match', ok: false }); return; }
                      save('changePassword', { currentPassword: currentPw, newPassword: newPw });
                    }}
                    disabled={saving || !currentPw || !newPw || !confirmPw}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black disabled:opacity-50 transition"
                    style={{ background: 'rgba(255,255,255,0.92)' }}>
                    {saving ? <FiLoader className="w-4 h-4 animate-spin text-black" /> : <FiLock className="w-4 h-4" />}
                    Change Password
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ──────────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-white/40 text-sm mt-0.5">Order updates, wallet alerts, and platform news</p>
                </div>
                <button onClick={() => setNotifyEmail(p => !p)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifyEmail ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${notifyEmail ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <button onClick={() => save('updateInfo', { notifyEmail })} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black disabled:opacity-50 transition"
                style={{ background: 'rgba(255,255,255,0.92)' }}>
                {saving ? <FiLoader className="w-4 h-4 animate-spin text-black" /> : <FiBell className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="mt-8 p-6 rounded-2xl border border-red-500/15 bg-red-500/5">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-red-400" /> Account Security
          </h3>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/sabi/forgot-password"
              className="text-sm text-white/50 hover:text-white/80 transition px-4 py-2 border border-white/[0.07] rounded-xl">
              Reset Password via Email
            </Link>
            <Link href="/sabi/verify"
              className="text-sm text-white/50 hover:text-white/80 transition px-4 py-2 border border-white/[0.07] rounded-xl">
              Verify Email Address
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
