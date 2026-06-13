'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiCheck, FiTrendingUp, FiBookmark } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { getCardColor } from '@/lib/designSystem';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);
  const [proofs, setProofs] = useState<any[]>([]);
  const [proofMeta, setProofMeta] = useState<{ total: number; approved: number; withScreenshot: number } | null>(null);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [startShot, setStartShot] = useState<string | null>(null);

  // Real receipts the taskers uploaded for this order (polled — they trickle in).
  useEffect(() => {
    let active = true;
    const load = () => fetch(`/api/sabi/orders/proofs?orderId=${orderId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active && d?.success) { setProofs(d.proofs || []); setProofMeta({ total: d.total || 0, approved: d.approved || 0, withScreenshot: d.withScreenshot || 0 }); setStartShot(d.startScreenshotUrl || null); } })
      .catch(() => {})
      .finally(() => { if (active) setProofsLoading(false); });
    load();
    const t = setInterval(load, 20000);
    return () => { active = false; clearInterval(t); };
  }, [orderId]);

  const isProofImage = (u?: string | null) =>
    !!u && (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /\.public\.blob\.vercel-storage\.com/i.test(u) || u.startsWith('data:image'));

  const saveTemplate = async () => {
    if (!order) return;
    setSaving(true);
    await fetch('/api/sabi/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${order.serviceType} × ${order.quantity}`,
        serviceId: order.serviceType,
        quantity: order.quantity,
        targetUrl: order.targetUrl,
        audienceGender: order.audienceGender,
        audienceLocation: order.audienceLocation,
        commentGender: order.commentGender,
        commentInstructions: order.commentInstructions,
      }),
    });
    setSaving(false);
    setSavedTemplate(true);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/sabi/orders?id=${orderId}`);
        const data = await response.json();
        if (data.success && data.orders) {
          setOrder(data.orders[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <ModernSabiHeader showNavigation={true} />
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <ModernSabiHeader showNavigation={true} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-red-400 mb-6 text-xl">Order not found</p>
            <Link href="/sabi/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg"
              >
                Back to Dashboard
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    executing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const statusSteps = ['pending', 'processing', 'executing', 'completed'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/sabi/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/[0.025] hover:bg-slate-700/50 text-slate-300 rounded-lg transition flex items-center gap-2 border border-white/[0.06]"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </motion.button>
          </Link>
        </motion.div>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black mb-2">
                <GradientText>Order #{order.id?.substring(0, 8)}</GradientText>
              </h1>
              <p className="text-slate-400">Created {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`px-4 py-1.5 rounded-full border font-bold text-sm ${statusColors[order.status] || statusColors.pending}`}>
                {order.status.toUpperCase()}
              </div>
              <Link href={`/sabi/order?reorder=1&serviceId=${encodeURIComponent(order.serviceType)}&quantity=${order.quantity}&url=${encodeURIComponent(order.targetUrl)}`}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-full text-sm">
                  ↻ Re-order
                </motion.button>
              </Link>
              <motion.button
                onClick={saveTemplate} disabled={saving || savedTemplate}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-700/60 text-slate-300 border border-white/[0.08] rounded-full text-sm font-bold hover:border-slate-500 disabled:opacity-50 transition"
              >
                <FiBookmark className="w-3.5 h-3.5" />
                {savedTemplate ? 'Saved!' : saving ? '...' : 'Save Template'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <InteractiveCard glowColor="blue">
            <div className="p-8">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" />
                Order Progress
              </h3>
              <div className="space-y-6">
                {statusSteps.map((status, index) => (
                  <motion.div key={status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                          index <= currentStepIndex ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-700 text-slate-400'
                        }`}
                        animate={index <= currentStepIndex ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {index <= currentStepIndex ? <FiCheck className="w-6 h-6" /> : index + 1}
                      </motion.div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-16 transition-all ${index < currentStepIndex ? 'bg-gradient-to-b from-blue-500 to-transparent' : 'bg-slate-700'}`}
                        />
                      )}
                    </div>
                    <div className="py-2 flex-1">
                      <div className="font-bold capitalize text-lg">{status}</div>
                      <div className="text-sm text-slate-400">
                        {status === 'pending' && 'Waiting for confirmation'}
                        {status === 'processing' && 'Processing your order'}
                        {status === 'executing' && 'Active campaign running'}
                        {status === 'completed' && 'Order completed successfully'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-10 pt-8 border-t border-white/[0.06]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-300">Completion</span>
                  <span className="text-sm font-bold text-blue-400">{order.completionPercentage || 0}%</span>
                </div>
                <div className="w-full h-3 bg-[#0F1420] rounded-full overflow-hidden border border-white/[0.06]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    animate={{ width: `${order.completionPercentage || 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Order Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InteractiveCard glowColor="cyan">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6">Order Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                    <span className="text-slate-400">Service Type:</span>
                    <span className="font-bold capitalize text-cyan-400">{order.serviceType}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-bold">{order.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start pb-4 border-b border-white/[0.06]">
                    <span className="text-slate-400">Target URL:</span>
                    <span className="font-mono text-xs text-right truncate text-slate-300">{order.targetUrl}</span>
                  </div>
                  {order.estimatedCompletion && order.status !== 'completed' && (
                    <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                      <span className="text-slate-400">Est. Completion:</span>
                      <span className="font-bold text-cyan-300">{new Date(order.estimatedCompletion).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                    <span className="text-slate-400">Audience:</span>
                    <span className="font-bold text-cyan-400">🇳🇬 {order.audienceLocation || 'All Nigeria'}{order.audienceGender && order.audienceGender !== 'both' ? ` · ${order.audienceGender}` : ''}</span>
                  </div>
                  {order.commentInstructions && (
                    <div className="pb-4 border-b border-white/[0.06]">
                      <span className="text-slate-400 block mb-1">Comment brief{order.commentGender && order.commentGender !== 'both' ? ` (${order.commentGender})` : ''}:</span>
                      <span className="text-slate-300 text-xs">{order.commentInstructions}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-slate-400">Completed:</span>
                    <span className="font-bold text-cyan-400 text-lg">{order.completionPercentage || 0}%</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>

          {/* Pricing Breakdown Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InteractiveCard glowColor="orange">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6">Pricing Breakdown</h3>
                {(() => {
                  const baseKobo = order.totalPrice || 0;
                  const feeKobo = order.platformFee || 0;
                  const platformKobo = Math.round(baseKobo * 0.075);
                  const vatKobo = Math.max(feeKobo - platformKobo, 0);
                  const ngn = (k: number) => `₦${(k / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                  return (
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                        <span className="text-slate-400">Base Price:</span>
                        <span className="font-bold">{ngn(baseKobo)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                        <span className="text-slate-400">Platform Fee (7.5%):</span>
                        <span className="font-bold text-orange-400">{ngn(platformKobo)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                        <span className="text-slate-400">VAT (7.5%):</span>
                        <span className="font-bold text-orange-400">{ngn(vatKobo)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 text-base bg-white/[0.025] p-4 rounded-lg">
                        <span className="font-bold text-slate-300">Total Amount:</span>
                        <span className="font-black text-orange-400">{ngn(baseKobo + feeKobo)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </InteractiveCard>
          </motion.div>
        </div>

        {/* Campaign Info */}
        {order.gamesz360CampaignId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InteractiveCard glowColor="emerald">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-emerald-400" />
                  Campaign Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
                    <span className="text-slate-400">Campaign ID:</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">{order.gamesz360CampaignId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">Active</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        )}

        {/* ── PROOF OF DELIVERY — real receipts from the taskers ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8"
        >
          <InteractiveCard glowColor="purple">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="text-lg font-bold flex items-center gap-2">🧾 Proof of Delivery</h3>
                {proofs.length > 0 && (
                  <Link href={`/sabi/orders/${orderId}/report`}
                    className="px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/25 transition shrink-0">
                    🖨️ Download report
                  </Link>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Every action on this order was done by a <span className="text-purple-300 font-semibold">real Nigerian</span> on our crowd — here&apos;s the proof they uploaded. This is real traffic, not bots.
              </p>

              {startShot && (
                <div className="mb-5 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <a href={startShot} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={startShot} alt="Starting point" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                  </a>
                  <div>
                    <div className="text-xs font-bold text-white">📸 Starting point (before)</div>
                    <div className="text-[11px] text-slate-400">The snapshot you uploaded when ordering — your verified baseline count.</div>
                  </div>
                </div>
              )}

              {proofsLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-6"><FiLoader className="w-4 h-4 animate-spin" /> Gathering receipts…</div>
              ) : proofs.length === 0 ? (
                <div className="text-sm text-slate-500 py-6 text-center border border-dashed border-white/[0.08] rounded-xl">
                  No proof uploaded yet. As the crowd completes your order, their receipts will appear here automatically.
                </div>
              ) : (
                <>
                  {proofMeta && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { l: 'Completions', v: proofMeta.total, c: 'text-white' },
                        { l: 'Verified', v: proofMeta.approved, c: 'text-emerald-400' },
                        { l: 'Screenshots', v: proofMeta.withScreenshot, c: 'text-purple-300' },
                      ].map(s => (
                        <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className={`text-xl font-black ${s.c}`}>{s.v.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {proofs.map((p) => (
                      <div key={p.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {isProofImage(p.proofUrl) ? (
                          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.proofUrl} alt="Proof" loading="lazy" className="w-full h-28 object-cover hover:opacity-90 transition" />
                          </a>
                        ) : p.proofUrl ? (
                          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-28 text-xs text-blue-400 hover:underline px-2 text-center break-all">View proof ↗</a>
                        ) : (
                          <div className="flex items-center justify-center h-28 text-2xl">✅</div>
                        )}
                        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-slate-400 truncate">{p.proofText || 'Completed'}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : p.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
}
