'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiTrash2, FiShoppingCart, FiBookmark } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getServiceById } from '@/lib/servicesCatalog';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    fetch('/api/sabi/templates').then(r => r.json()).then(d => {
      if (d.success) setTemplates(d.templates);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    setDeleting(id);
    await fetch('/api/sabi/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setTemplates(p => p.filter(t => t.id !== id));
    setDeleting(null);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <Link href="/sabi/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm transition">
          <FiArrowLeft /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Order Templates</h1>
            <p className="text-slate-400 text-sm">Saved order configs — one tap to reorder.</p>
          </div>
          <Link href="/sabi/order" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl text-sm hover:brightness-110 transition">
            + New Order
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
            <FiBookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No templates yet</p>
            <p className="text-slate-500 text-sm mb-6">After placing an order, use the "Save as Template" option to save it here.</p>
            <Link href="/sabi/order" className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition">Place First Order</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {templates.map(t => {
                const svc = getServiceById(t.serviceId);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{t.name}</p>
                      <p className="text-slate-400 text-sm">{svc?.name || t.serviceId} · {t.quantity.toLocaleString()} units</p>
                      {t.audienceLocation && <p className="text-blue-400 text-xs mt-0.5">📍 {t.audienceLocation}{t.audienceGender && t.audienceGender !== 'both' ? ` · ${t.audienceGender}` : ''}</p>}
                    </div>
                    <Link
                      href={`/sabi/order?reorder=1&serviceId=${t.serviceId}&quantity=${t.quantity}${t.targetUrl ? `&url=${encodeURIComponent(t.targetUrl)}` : ''}`}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition shrink-0"
                    >
                      <FiShoppingCart className="w-4 h-4" /> Order
                    </Link>
                    <button
                      onClick={() => del(t.id)}
                      disabled={deleting === t.id}
                      className="p-2 text-slate-500 hover:text-red-400 transition disabled:opacity-40"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
