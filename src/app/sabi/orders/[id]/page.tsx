'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiCheck, FiTrendingUp, FiBookmark, FiStar } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { getCardColor } from '@/lib/designSystem';

/**
 * Real cumulative-delivery chart built from tasker proof timestamps.
 * Each completed proof bumps the line — honest "growth over time" proof.
 */
function DeliveryGrowthChart({ proofs, target, baseline = 0 }: { proofs: any[]; target: number; baseline?: number }) {
  const pts = proofs
    .filter(p => p.createdAt)
    .map(p => new Date(p.createdAt).getTime())
    .sort((a, b) => a - b);
  if (pts.length < 2) return null;

  const t0 = pts[0];
  const tN = pts[pts.length - 1] || t0 + 1;
  const span = Math.max(tN - t0, 1);
  const W = 600, H = 160, padX = 8, padY = 12;
  // With a real starting count the line climbs from the baseline toward
  // baseline + target; otherwise it's a plain cumulative delivery count.
  const top = Math.max(baseline + target, baseline + pts.length, 1);
  const valAt = (i: number) => baseline + (i + 1);

  const coords = pts.map((t, i) => {
    const x = padX + ((t - t0) / span) * (W - padX * 2);
    const y = H - padY - (valAt(i) / top) * (H - padY * 2);
    return [x, y] as const;
  });
  // Step line (cumulative). Starts at the baseline height when we have a real count.
  const baseY = H - padY - (baseline / top) * (H - padY * 2);
  let d = `M ${coords[0][0]} ${baseY}`;
  coords.forEach(([x, y], i) => {
    const prevY = i === 0 ? baseY : coords[i - 1][1];
    d += ` L ${x} ${prevY} L ${x} ${y}`;
  });
  const last = coords[coords.length - 1];
  const area = `${d} L ${last[0]} ${H - padY} L ${coords[0][0]} ${H - padY} Z`;
  const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,85,247,0.45)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.02)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#growthFill)" />
        <path d={d} fill="none" stroke="rgb(192,132,252)" strokeWidth={2.5} strokeLinejoin="round" />
        {last && <circle cx={last[0]} cy={last[1]} r={4} fill="rgb(216,180,254)" />}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{fmt(t0)}</span>
        <span>{pts.length.toLocaleString()} delivered{target ? ` of ${target.toLocaleString()}` : ''}</span>
        <span>{fmt(tN)}</span>
      </div>
    </div>
  );
}

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
  const [startCount, setStartCount] = useState<number | null>(null);

  // Order rating & feedback (completed orders only)
  const [rating, setRating] = useState<number>(0);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSaved, setRatingSaved] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Refill / drop-protection (admin-moderated)
  const [refillReq, setRefillReq] = useState<any>(null);
  const [refillQty, setRefillQty] = useState('');
  const [refillReason, setRefillReason] = useState('');
  const [refillOpen, setRefillOpen] = useState(false);
  const [refillSubmitting, setRefillSubmitting] = useState(false);
  const [refillError, setRefillError] = useState('');

  // Shortfall refund
  const [shortfall, setShortfall] = useState<any>(null);
  const [shortfallBusy, setShortfallBusy] = useState(false);
  const [shortfallDone, setShortfallDone] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/sabi/orders/${orderId}/shortfall`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.success) setShortfall(d); })
      .catch(() => {});
  }, [orderId]);

  const claimShortfall = async () => {
    setShortfallBusy(true);
    try {
      const res = await fetch(`/api/sabi/orders/${orderId}/shortfall`, { method: 'POST' });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) { setShortfallDone(d.refundedKobo); setShortfall((s: any) => ({ ...s, eligible: false, claimed: true })); }
    } finally { setShortfallBusy(false); }
  };

  useEffect(() => {
    fetch(`/api/sabi/orders/${orderId}/refill`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.success) setRefillReq(d.request || null); })
      .catch(() => {});
  }, [orderId]);

  const submitRefill = async () => {
    setRefillError('');
    const q = parseInt(refillQty);
    if (!q || q < 1) { setRefillError('Enter how many you need refilled.'); return; }
    setRefillSubmitting(true);
    try {
      const res = await fetch(`/api/sabi/orders/${orderId}/refill`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: q, reason: refillReason }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) { setRefillReq(d.request); setRefillOpen(false); }
      else setRefillError(d?.error || 'Could not submit refill request');
    } finally { setRefillSubmitting(false); }
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/sabi/orders/${orderId}/rate`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!active || !d?.success) return;
        if (d.rating) { setRating(d.rating); setRatingSaved(true); }
        if (d.ratingComment) setRatingComment(d.ratingComment);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [orderId]);

  // Auto-reorder (subscription)
  const [subInterval, setSubInterval] = useState<number>(7);
  const [subSaving, setSubSaving] = useState(false);
  const [subSaved, setSubSaved] = useState(false);

  const enableAutoReorder = async () => {
    if (!order || subSaving) return;
    setSubSaving(true);
    try {
      const res = await fetch('/api/sabi/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: order.serviceType,
          targetUrl: order.targetUrl,
          quantity: order.quantity,
          intervalDays: subInterval,
          audienceGender: order.audienceGender,
          audienceLocation: order.audienceLocation,
          commentGender: order.commentGender,
          commentInstructions: order.commentInstructions,
        }),
      });
      if (res.ok) setSubSaved(true);
    } finally {
      setSubSaving(false);
    }
  };

  const submitRating = async () => {
    if (!rating || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/sabi/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: ratingComment }),
      });
      if (res.ok) setRatingSaved(true);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Real receipts the taskers uploaded for this order (polled — they trickle in).
  useEffect(() => {
    let active = true;
    const load = () => fetch(`/api/sabi/orders/proofs?orderId=${orderId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active && d?.success) { setProofs(d.proofs || []); setProofMeta({ total: d.total || 0, approved: d.approved || 0, withScreenshot: d.withScreenshot || 0 }); setStartShot(d.startScreenshotUrl || null); setStartCount(d.startCount ?? null); } })
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

              {(startShot || startCount != null) && (
                <div className="mb-5 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {startShot && (
                    <a href={startShot} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={startShot} alt="Starting point" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                    </a>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">📸 Starting point (before)</div>
                    {startCount != null ? (
                      <div className="text-[11px] text-slate-400">
                        Verified baseline: <span className="text-emerald-300 font-bold">{startCount.toLocaleString()}</span>
                        {' '}→ target <span className="text-white font-semibold">{(startCount + order.quantity).toLocaleString()}</span> after delivery.
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">The snapshot you uploaded when ordering — your verified baseline.</div>
                    )}
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
                  {proofs.length >= 2 && (
                    <div className="mb-5">
                      <div className="text-xs font-bold text-slate-300 mb-2">📈 Delivery over time</div>
                      <DeliveryGrowthChart proofs={proofs} target={order.quantity} baseline={startCount ?? 0} />
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

        {/* ── AUTO-REORDER — keep this order running on a schedule ─────────────── */}
        {order.status !== 'cancelled' && order.status !== 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="mt-8"
          >
            <InteractiveCard glowColor="emerald">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1">🔁 Auto-reorder</h3>
                {subSaved ? (
                  <p className="text-sm text-emerald-300">
                    Done — we&apos;ll automatically re-place this exact order every <b>{subInterval} days</b> from your wallet. Manage it anytime on your{' '}
                    <Link href="/sabi/subscriptions" className="underline">subscriptions page</Link>.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 mb-5">
                      Set it and forget it — we&apos;ll re-run this same order automatically and charge your wallet each cycle. Pause anytime.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-300">Repeat every</span>
                      <select
                        value={subInterval}
                        onChange={(e) => setSubInterval(Number(e.target.value))}
                        className="bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/40"
                      >
                        <option value={3}>3 days</option>
                        <option value={7}>7 days (weekly)</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days (monthly)</option>
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={enableAutoReorder} disabled={subSaving}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition"
                      >
                        {subSaving ? 'Enabling…' : 'Enable auto-reorder'}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </InteractiveCard>
          </motion.div>
        )}

        {/* ── REFILL / DROP PROTECTION — admin-moderated ───────────────────────── */}
        {(order.status === 'completed' || order.status === 'executing') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49 }} className="mt-8">
            <InteractiveCard glowColor="cyan">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1">🔁 Refill / drop protection</h3>
                {refillReq ? (
                  <div className="mt-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      refillReq.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300'
                      : refillReq.status === 'rejected' ? 'bg-red-500/20 text-red-300'
                      : 'bg-yellow-500/15 text-yellow-300'}`}>
                      Refill {refillReq.status}
                    </span>
                    <p className="text-sm text-slate-400 mt-3">
                      {refillReq.status === 'pending' && `Your request to refill ${Number(refillReq.refillQuantity).toLocaleString()} is under review. We verify every refill before delivering it.`}
                      {refillReq.status === 'approved' && `Approved — ${Number(refillReq.refillQuantity).toLocaleString()} is being delivered, free of charge.`}
                      {refillReq.status === 'rejected' && `This refill request wasn't approved.${refillReq.adminNote ? ` (${refillReq.adminNote})` : ''}`}
                    </p>
                  </div>
                ) : !refillOpen ? (
                  <>
                    <p className="text-xs text-slate-400 mb-4">Lost some of what you ordered (e.g. followers dropped)? Request a refill — we review each one before re-delivering, free.</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setRefillOpen(true)}
                      className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg text-sm">
                      Request a refill
                    </motion.button>
                  </>
                ) : (
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">How many to refill? (max {order.quantity.toLocaleString()})</label>
                      <input type="number" min={1} max={order.quantity} value={refillQty} onChange={e => setRefillQty(e.target.value)}
                        placeholder="e.g. 120" className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">What happened? (helps us verify)</label>
                      <textarea rows={2} value={refillReason} onChange={e => setRefillReason(e.target.value)} maxLength={300}
                        placeholder="e.g. ~120 followers dropped over the weekend"
                        className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 resize-none" />
                    </div>
                    {refillError && <p className="text-red-400 text-xs">{refillError}</p>}
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={submitRefill} disabled={refillSubmitting}
                        className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg text-sm disabled:opacity-50">
                        {refillSubmitting ? 'Submitting…' : 'Submit for review'}
                      </motion.button>
                      <button onClick={() => setRefillOpen(false)} className="px-4 py-2 text-slate-400 text-sm hover:text-slate-200">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </InteractiveCard>
          </motion.div>
        )}

        {/* ── SHORTFALL REFUND — under-delivered orders ────────────────────────── */}
        {(shortfallDone !== null || shortfall?.eligible) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.495 }} className="mt-8">
            <InteractiveCard glowColor="orange">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1">💸 Under-delivery refund</h3>
                {shortfallDone !== null ? (
                  <p className="text-sm text-emerald-300 mt-2">Refunded <b>₦{(shortfallDone / 100).toLocaleString()}</b> to your wallet for the undelivered portion. Thanks for your patience!</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 mb-4">
                      This order delivered {order.completedQuantity?.toLocaleString() || 0} of {order.quantity.toLocaleString()}.
                      You can claim a refund of <b className="text-orange-300">₦{((shortfall.refundKobo || 0) / 100).toLocaleString()}</b> for the {shortfall.shortfallQty?.toLocaleString()} not delivered — or request a refill instead (above).
                    </p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={claimShortfall} disabled={shortfallBusy}
                      className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg text-sm disabled:opacity-50">
                      {shortfallBusy ? 'Processing…' : `Claim ₦${((shortfall.refundKobo || 0) / 100).toLocaleString()} refund`}
                    </motion.button>
                  </>
                )}
              </div>
            </InteractiveCard>
          </motion.div>
        )}

        {/* ── RATE THIS ORDER — completed orders only ──────────────────────────── */}
        {order.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <InteractiveCard glowColor="orange">
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <FiStar className="w-5 h-5 text-amber-400" /> Rate this order
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  {ratingSaved ? 'Thanks for your feedback — it helps us reward our best contributors.' : 'How happy were you with the delivery? Your rating helps us keep quality high.'}
                </p>

                <div className="flex items-center gap-2 mb-5" onMouseLeave={() => setHoverStar(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={ratingSaved}
                      onMouseEnter={() => !ratingSaved && setHoverStar(n)}
                      onClick={() => !ratingSaved && setRating(n)}
                      className="transition disabled:cursor-default"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <FiStar
                        className={`w-9 h-9 transition ${
                          (hoverStar || rating) >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                        style={{ fill: (hoverStar || rating) >= n ? 'currentColor' : 'none' }}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-bold text-amber-400">{rating}/5</span>
                  )}
                </div>

                {!ratingSaved && (
                  <>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Anything you'd like us to know? (optional)"
                      className="w-full bg-[#0F1420] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/40 resize-none mb-4"
                    />
                    <motion.button
                      whileHover={{ scale: rating ? 1.03 : 1 }}
                      whileTap={{ scale: rating ? 0.97 : 1 }}
                      onClick={submitRating}
                      disabled={!rating || ratingSubmitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition"
                    >
                      {ratingSubmitting ? 'Saving…' : 'Submit rating'}
                    </motion.button>
                  </>
                )}

                {ratingSaved && ratingComment && (
                  <div className="rounded-xl p-4 text-sm text-slate-300" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    “{ratingComment}”
                  </div>
                )}
              </div>
            </InteractiveCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
