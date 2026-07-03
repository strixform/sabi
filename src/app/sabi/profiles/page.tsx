'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiBookmark, FiTrash2, FiPlus } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { PageHero } from '@/components/studio/PageHero';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { InteractiveCard } from '@/components/InteractiveCard';

interface Profile { id: string; label: string; url: string; platform: string | null; }

export default function SavedProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  const load = () => fetch('/api/sabi/saved-profiles')
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d?.profiles) setProfiles(d.profiles); })
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr('');
    if (!url.trim()) { setErr('Enter a URL'); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/sabi/saved-profiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), label: label.trim() || url.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.profile) { setProfiles(prev => [d.profile, ...prev.filter(p => p.url !== d.profile.url)]); setLabel(''); setUrl(''); }
      else setErr(d?.error || 'Could not save');
    } finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`/api/sabi/saved-profiles?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setProfiles(prev => prev.filter(p => p.id !== id));
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link href="/sabi/studio" className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-2 text-slate-300 transition hover:bg-slate-700/50">
          <FiArrowLeft className="h-4 w-4" /> Back to Studio
        </Link>

        <PageHero
          icon={FiBookmark}
          eyebrow="Studio"
          accent="from-blue-500 to-cyan-600"
          title="My Profiles"
          subtitle="Save the accounts and links you order for — then reorder in two taps."
        />

        {/* Add form */}
        <InteractiveCard glowColor="blue">
          <div className="p-5 sm:p-6">
            <div className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-3">
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. My IG)"
                className="px-3 py-2.5 bg-[#0F1420] border border-white/[0.08] rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/40" />
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://instagram.com/yourhandle"
                className="px-3 py-2.5 bg-[#0F1420] border border-white/[0.08] rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/40" />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={add} disabled={adding}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1.5">
                <FiPlus className="w-4 h-4" /> {adding ? 'Saving…' : 'Save'}
              </motion.button>
            </div>
            {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
          </div>
        </InteractiveCard>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
              <FiLoader className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No saved profiles yet. Add one above, or tap “Save this target” when ordering.</div>
          ) : (
            <div className="space-y-3">
              {profiles.map(p => (
                <InteractiveCard key={p.id} glowColor="cyan">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">📌 {p.label}</div>
                      <div className="text-xs text-slate-500 font-mono truncate">{p.url}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/sabi/order?url=${encodeURIComponent(p.url)}`}>
                        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg text-sm inline-block">Order</span>
                      </Link>
                      <button onClick={() => remove(p.id)} disabled={busy === p.id}
                        className="p-2.5 rounded-lg text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
