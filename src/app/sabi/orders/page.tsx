'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiSearch, FiRefreshCw, FiExternalLink,
  FiRepeat, FiBookmark, FiClock, FiCheck, FiX, FiLoader, FiInbox,
} from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getServiceById } from '@/lib/servicesCatalog';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'executing', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  processing: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  executing:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  completed:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed:     'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled:  'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <FiClock className="w-3 h-3" />,
  processing: <FiLoader className="w-3 h-3 animate-spin" />,
  executing:  <FiLoader className="w-3 h-3 animate-spin" />,
  completed:  <FiCheck className="w-3 h-3" />,
  failed:     <FiX className="w-3 h-3" />,
  cancelled:  <FiX className="w-3 h-3" />,
};

// Friendly ETA tied to the 72h delivery-guarantee window (from order creation).
function etaLabel(_est: string | null | undefined, createdAt: string | null | undefined): string {
  const created = createdAt ? new Date(createdAt).getTime() : Date.now();
  const ms = created + 72 * 3600 * 1000 - Date.now();
  if (ms <= 0) return 'any moment now';
  const h = Math.ceil(ms / 3600000);
  if (h <= 48) return `within ~${h} hr${h !== 1 ? 's' : ''}`;
  return `within ~${Math.ceil(h / 24)} day${Math.ceil(h / 24) !== 1 ? 's' : ''}`;
}

// Inline star rating for a completed order. Submits once, then shows the result.
function OrderRating({ order }: { order: any }) {
  const [rating, setRating] = useState<number>(Number(order.rating) || 0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState<boolean>(Number(order.rating) > 0);
  const [busy, setBusy] = useState(false);

  const submit = async (r: number) => {
    if (done || busy) return;
    setRating(r); setBusy(true);
    try {
      const res = await fetch('/api/sabi/orders/rate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, rating: r }),
      });
      if (res.ok) setDone(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2">
      <span className="text-[11px] text-slate-400">{done ? 'You rated this delivery' : 'Rate this delivery:'}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" disabled={done || busy}
            onClick={() => submit(n)} onMouseEnter={() => !done && setHover(n)} onMouseLeave={() => setHover(0)}
            className="text-base leading-none disabled:cursor-default transition"
            style={{ color: (hover || rating) >= n ? '#FBBF24' : '#475569' }}>★</button>
        ))}
      </div>
      {done && <span className="text-[10px] text-emerald-400">Thanks! 🙏</span>}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sabi/orders');
      if (res.status === 401) { router.push('/sabi/login'); return; }
      const data = await res.json();
      // Whether success or error, show whatever orders we have (including [])
      setOrders(data.orders || []);
    } catch {
      // Network error — show empty state, don't redirect
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveTemplate = async (order: any) => {
    setSavingTemplate(order.id);
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
    setSavedTemplates(p => new Set([...p, order.id]));
    setSavingTemplate(null);
  };

  const filtered = orders.filter(o => {
    const matchTab = tab === 'all' || o.status === tab || (tab === 'executing' && ['processing','executing'].includes(o.status));
    const matchSearch = !search || o.serviceType.toLowerCase().includes(search.toLowerCase()) || o.targetUrl.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['pending','processing','executing'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    failed: orders.filter(o => o.status === 'failed').length,
  };

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">My Orders</h1>
            <p className="text-slate-400 text-sm">{stats.total} total · {stats.active} active · {stats.completed} completed</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition">
              <FiRefreshCw className="w-4 h-4" />
            </button>
            <Link href="/sabi/order"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:brightness-110 transition">
              <FiShoppingCart className="w-4 h-4" /> New Order
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Active', value: stats.active, color: 'text-purple-400' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
            { label: 'Failed', value: stats.failed, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by service, URL, or order ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0D14] border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-500 focus:border-blue-500/60 outline-none transition"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${tab === t.key ? 'bg-blue-500 text-white' : 'bg-[#0F1420] text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <FiInbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-1">{search || tab !== 'all' ? 'No matching orders' : 'No orders yet'}</p>
            <p className="text-slate-500 text-sm mb-6">
              {search || tab !== 'all' ? 'Try adjusting your search or filter' : 'Place your first order to get started'}
            </p>
            <Link href="/sabi/order"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition">
              <FiShoppingCart className="w-4 h-4" /> Place First Order
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((order, i) => {
                const svc = getServiceById(order.serviceType);
                const isSaved = savedTemplates.has(order.id);
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.08]/70 transition"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top row: status + service name + order id */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
                          {STATUS_ICON[order.status]}
                          {order.status}
                        </div>
                        <p className="text-white font-bold truncate flex-1">{svc?.name || order.serviceType.replace(/_/g, ' ')}</p>
                        <span className="text-slate-500 text-xs shrink-0">#{order.id.slice(-6)}</span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="font-medium text-white/70">{order.quantity.toLocaleString()} units</span>
                        <span className="text-emerald-400 font-medium">₦{((order.totalPrice + order.platformFee - (order.discountAmount || 0)) / 100).toLocaleString()}</span>
                        {(order.completedQuantity || 0) > 0 && <span className="text-purple-300 font-medium">📸 {(order.completedQuantity).toLocaleString()} receipts</span>}
                        {order.audienceLocation && <span>📍 {order.audienceLocation}</span>}
                        <span>{new Date(order.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      {/* Target URL */}
                      <p className="text-slate-500 text-xs">
                        <a href={order.targetUrl} target="_blank" rel="noopener noreferrer"
                          className="hover:text-slate-300 transition flex items-center gap-1 w-full min-w-0">
                          <FiExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{order.targetUrl}</span>
                        </a>
                      </p>

                      {/* Progress bar — shows live count for active orders, final for completed */}
                      {['processing','executing','completed'].includes(order.status) && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>
                              {order.status === 'completed'
                                ? '✅ Completed'
                                : `${(order.completedQuantity || 0).toLocaleString()} / ${(order.quantity || 0).toLocaleString()} done`}
                            </span>
                            <span className="font-semibold text-slate-300">{order.completionPercentage || 0}%</span>
                          </div>
                          <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${order.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                              style={{ width: `${order.completionPercentage || 0}%` }} />
                          </div>
                          {/* ETA for active orders — sets expectations */}
                          {['processing','executing'].includes(order.status) && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                              <span>⏱️</span>
                              <span>Est. completion {etaLabel(order.estimatedCompletion, order.createdAt)}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-emerald-500/80">covered by our delivery guarantee</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Partial delivery — completed with a refund note (SLA guarantee paid out) */}
                      {order.status === 'completed' && order.refundReason && (
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2">
                          <span className="text-sm shrink-0">✅</span>
                          <p className="text-[11px] text-emerald-200/90 leading-relaxed">{order.refundReason}</p>
                        </div>
                      )}

                      {/* Failed / refunded — show why (e.g. no taskers in targeted region) */}
                      {order.status === 'failed' && order.refundReason && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-sm shrink-0">↩️</span>
                            <p className="text-[11px] text-amber-200/90 leading-relaxed">{order.refundReason} <span className="text-amber-300/70">Your wallet was fully refunded.</span></p>
                          </div>
                          {/* One-click recovery — re-order widened to All Nigeria / Both (fastest fill). */}
                          <Link
                            href={`/sabi/order?reorder=1&serviceId=${encodeURIComponent(order.serviceType)}&quantity=${order.quantity}&url=${encodeURIComponent(order.targetUrl)}&audience=all`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/25 transition">
                            <FiRepeat className="w-3.5 h-3.5" /> Re-order as All Nigeria (faster)
                          </Link>
                        </div>
                      )}

                      {/* Rate completed deliveries — feeds tasker quality scores */}
                      {order.status === 'completed' && <OrderRating order={order} />}

                      {/* Actions row — full width on mobile */}
                      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                        <button
                          onClick={() => saveTemplate(order)}
                          disabled={savingTemplate === order.id || isSaved}
                          title={isSaved ? 'Saved as template' : 'Save as template'}
                          className={`p-1.5 rounded-lg transition ${isSaved ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'} disabled:opacity-40`}>
                          <FiBookmark className={`w-4 h-4 ${isSaved ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <Link
                          href={`/sabi/order?reorder=1&serviceId=${encodeURIComponent(order.serviceType)}&quantity=${order.quantity}&url=${encodeURIComponent(order.targetUrl)}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/25 transition flex-1 justify-center sm:flex-none">
                          <FiRepeat className="w-3.5 h-3.5" /> Re-order
                        </Link>
                        <Link
                          href={`/sabi/orders/${order.id}`}
                          className="px-3 py-1.5 bg-slate-700/60 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-600 transition flex-1 text-center sm:flex-none">
                          View
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-center text-slate-500 text-xs mt-6">
            Showing {filtered.length} of {orders.length} orders
          </p>
        )}
      </div>
    </div>
  );
}
