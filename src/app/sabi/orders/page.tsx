'use client';

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
      const data = await res.json();
      if (!res.ok) { router.push('/sabi/login'); return; }
      setOrders(data.orders || []);
    } catch { router.push('/sabi/login'); }
    finally { setLoading(false); }
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
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
            <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:border-blue-500/60 outline-none transition"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${tab === t.key ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
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
            className="text-center py-20 rounded-2xl border border-slate-700/50 bg-slate-900/30">
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
                    className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/70 transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status indicator */}
                      <div className={`mt-0.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
                        {STATUS_ICON[order.status]}
                        {order.status}
                      </div>

                      {/* Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold truncate">{svc?.name || order.serviceType.replace(/_/g, ' ')}</p>
                          <span className="text-slate-500 text-xs shrink-0">#{order.id.slice(-6)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>{order.quantity.toLocaleString()} units</span>
                          <span>₦{((order.totalPrice + order.platformFee) / 100).toLocaleString()}</span>
                          {order.audienceLocation && <span>📍 {order.audienceLocation}</span>}
                          <span>{new Date(order.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {/* Progress bar for active orders */}
                        {['processing','executing'].includes(order.status) && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{order.completionPercentage || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                style={{ width: `${order.completionPercentage || 0}%` }} />
                            </div>
                          </div>
                        )}

                        <p className="text-slate-500 text-xs mt-1 truncate">
                          <a href={order.targetUrl} target="_blank" rel="noopener noreferrer"
                            className="hover:text-slate-300 transition flex items-center gap-1 w-fit">
                            <FiExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{order.targetUrl}</span>
                          </a>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => saveTemplate(order)}
                          disabled={savingTemplate === order.id || isSaved}
                          title={isSaved ? 'Saved as template' : 'Save as template'}
                          className={`p-2 rounded-lg transition ${isSaved ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'} disabled:opacity-40`}>
                          <FiBookmark className={`w-4 h-4 ${isSaved ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <Link
                          href={`/sabi/order?reorder=1&serviceId=${encodeURIComponent(order.serviceType)}&quantity=${order.quantity}&url=${encodeURIComponent(order.targetUrl)}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/25 transition">
                          <FiRepeat className="w-3.5 h-3.5" /> Re-order
                        </Link>
                        <Link
                          href={`/sabi/orders/${order.id}`}
                          className="px-3 py-1.5 bg-slate-700/60 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-600 transition">
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
