/**
 * SABI Admin Dashboard
 * /sabi/admin
 *
 * Full-featured admin panel modelled after Owlet's admin layout.
 * Tabs: Orders | Users | Payments | Referrals | Settings
 *
 * Auth: accepts either a valid SABI session cookie (email must match
 * NEXT_PUBLIC_ADMIN_EMAIL) OR the hardcoded admin token stored in
 * sessionStorage by /sabi/admin/login.
 * See src/lib/sabiAdminAuth.ts for the shared auth helper.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiRefreshCw, FiSearch, FiSettings, FiUsers, FiDollarSign,
  FiShoppingBag, FiGift, FiExternalLink, FiChevronLeft, FiChevronRight,
  FiChevronDown, FiPhone,
} from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string; serviceType: string; targetUrl: string;
  quantity: number; totalPrice: number; status: string;
  completedQuantity: number; createdAt: string;
  user: { email: string; name: string };
}

interface User {
  id: string; email: string; name: string; status: string;
  emailVerified: boolean; balance: number; totalSpent: number;
  totalFunded: number; lastAuth: string | null; createdAt: string;
  phone: string | null; businessName: string | null;
  orderCount: number; completedOrders: number;
  totalOrderValue: number; lastOrderAt: string | null;
}

interface UserOrder {
  id: string; serviceType: string; targetUrl: string; quantity: number;
  totalPrice: number; platformFee: number; amountPaid: number; status: string;
  completedQuantity: number; completionPercentage: number; paymentMethod: string;
  campaignId: string | null; createdAt: string;
}

interface Payment {
  id: string; userId: string; userEmail: string; userName: string;
  type: string; amount: number; reference: string | null;
  description: string; createdAt: string;
}

interface Referrer {
  userId: string; email: string; name: string;
  registrations: number; qualified: number; paid: number;
  totalEarnings: number; availableEarnings: number;
}

interface CustomRequest {
  id: string; name: string; email: string; whatsapp: string;
  category: string; description: string; targetPlatform: string | null;
  targetUrl: string | null; quantity: number | null;
  budget: string | null; timeline: string | null;
  status: string; adminNotes: string | null; createdAt: string; userId: string | null;
}

interface Stats {
  totalOrders: number; pendingOrders: number;
  processingOrders: number; completedOrders: number;
  totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  processing:  'bg-blue-400/15 text-blue-300 border-blue-400/30',
  in_progress: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  executing:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:      'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled:   'bg-gray-500/15 text-gray-400 border-gray-500/30',
  active:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  banned:      'bg-red-500/15 text-red-400 border-red-500/30',
  deposit:     'bg-emerald-500/15 text-emerald-400',
  order:       'bg-blue-500/15 text-blue-400',
  refund:      'bg-yellow-500/15 text-yellow-400',
  bonus:       'bg-purple-500/15 text-purple-400',
};

const fmt = (kobo: number | undefined | null) => `₦${Math.round((kobo ?? 0) / 100).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
const TABS = ['Users', 'Orders', 'Payments', 'Reconcile', 'Referrals', 'Requests', 'Settings'] as const;
type Tab = typeof TABS[number];

// ─── Sort state helper ────────────────────────────────────────────────────────
// Each table tracks { col, dir } — clicking the same column toggles asc↔desc,
// clicking a new column sorts asc. The sort is applied client-side on the
// current page (50 rows max) so it's instant with no extra API calls.
interface SortState { col: string; dir: 'asc' | 'desc' }

function useSortedData<T extends Record<string, any>>(data: T[], sort: SortState) {
  return React.useMemo(() => {
    if (!sort.col) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.col] ?? '';
      const bv = b[sort.col] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'en', { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort.col, sort.dir]);
}

// ─── Shared admin fetch helper (used by inline action components) ─────────────
function useAdminFetch() {
  return (url: string, opts: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('sabi_admin_token') : null;
    return fetch(url, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { 'x-admin-token': token } : {}) } });
  };
}

// ─── Cancel Order button — shown on each cancellable order row ────────────────
// Cancels the SABI order + linked gamerz360 campaign + refunds the user.
// Blocked for completed/cancelled/failed orders.
function CancelOrderButton({ orderId, serviceType, onDone, adminFetch }: {
  orderId: string; serviceType: string;
  onDone: () => void;
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}) {
  const [open, setOpen]     = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState('');

  const submit = async () => {
    if (!reason.trim()) { setMsg('Enter a reason'); return; }
    setLoading(true);
    try {
      const res = await adminFetch('/api/sabi/admin/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: reason.trim() }),
      });
      const d = await res.json();
      if (res.ok) { setMsg(`✅ ${d.message}`); setOpen(false); setReason(''); onDone(); }
      else setMsg(`❌ ${d.error}`);
    } catch { setMsg('❌ Network error'); }
    finally { setLoading(false); setTimeout(() => setMsg(''), 8000); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 text-[10px] font-bold rounded transition whitespace-nowrap">
      Cancel
    </button>
  );

  return (
    <div className="space-y-1.5 min-w-[180px]">
      {msg && <div className={`text-[10px] ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</div>}
      <div className="text-[10px] text-red-400 font-bold">Cancel + refund?</div>
      <input type="text" placeholder="Reason for cancellation" value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1 rounded focus:outline-none" />
      <div className="flex gap-1">
        <button onClick={submit} disabled={loading}
          className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[10px] font-bold rounded">
          {loading ? '…' : 'Confirm Cancel'}
        </button>
        <button onClick={() => { setOpen(false); setMsg(''); }} className="px-2 py-1 bg-slate-700 text-slate-400 text-[10px] rounded">✕</button>
      </div>
    </div>
  );
}

// ─── Update Order Status button ───────────────────────────────────────────────
// Allows admin to move order through lifecycle: pending → processing → in_progress
// → completed. Also supports failed and cancelled overrides.
const ORDER_STATUSES = ['pending', 'processing', 'in_progress', 'executing', 'completed', 'failed', 'cancelled'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending:    '⏳ Pending',
  processing: '⚙️ Processing',
  in_progress:'▶️ In Progress',
  executing:  '🚀 Executing',
  completed:  '✅ Completed',
  failed:     '❌ Failed',
  cancelled:  '🚫 Cancelled',
};

function UpdateOrderStatusButton({ order, onDone, adminFetch }: {
  order: Order;
  onDone: () => void;
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}) {
  const [open,     setOpen]     = useState(false);
  const [status,   setStatus]   = useState(order.status);
  const [qty,      setQty]      = useState(String(order.completedQuantity || 0));
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');

  const save = async () => {
    setLoading(true);
    try {
      const body: Record<string, any> = { orderId: order.id };
      if (status !== order.status) body.status = status;
      const qtyN = parseInt(qty);
      if (!isNaN(qtyN) && qtyN !== order.completedQuantity) body.completedQuantity = qtyN;
      if (note.trim()) body.adminNote = note.trim();

      if (Object.keys(body).length <= 1) { setMsg('No changes made'); return; }

      const res = await adminFetch('/api/sabi/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setMsg(`✅ ${d.message}`);
        setOpen(false);
        onDone();
      } else {
        setMsg(`❌ ${d.error || 'Update failed'}`);
      }
    } catch { setMsg('❌ Network error'); }
    finally { setLoading(false); setTimeout(() => setMsg(''), 5000); }
  };

  return (
    <div className="relative">
      {msg && <div className={`text-[9px] mb-1 ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</div>}
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-[10px] font-bold rounded transition whitespace-nowrap">
          ✏️ Status
        </button>
      ) : (
        <div className="space-y-1.5 min-w-[200px] bg-slate-900 border border-white/10 rounded-lg p-2.5">
          <div className="text-[9px] font-bold text-slate-400 mb-1">UPDATE ORDER</div>

          {/* Status dropdown */}
          <div>
            <div className="text-[9px] text-slate-500 mb-1">Status</div>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1.5 rounded focus:outline-none focus:border-blue-500/50">
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>

          {/* Completed quantity */}
          <div>
            <div className="text-[9px] text-slate-500 mb-1">Completed qty (of {order.quantity})</div>
            <input type="number" min="0" max={order.quantity} value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1.5 rounded focus:outline-none" />
          </div>

          {/* Admin note */}
          <div>
            <div className="text-[9px] text-slate-500 mb-1">Admin note (optional)</div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note…"
              className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1.5 rounded focus:outline-none" />
          </div>

          <div className="flex gap-1 pt-0.5">
            <button onClick={save} disabled={loading}
              className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold rounded">
              {loading ? '…' : 'Save Changes'}
            </button>
            <button onClick={() => { setOpen(false); setMsg(''); }} className="px-2 py-1.5 bg-slate-700 text-slate-400 text-[10px] rounded">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Credit / Debit wallet button ─────────────────────────────────────────────
// Credit: adds ₦ to user wallet (compensation, balance correction, manual top-up)
// Debit:  removes ₦ from user wallet (error correction, admin adjustment)
// Calls POST /api/sabi/admin/wallet-adjust, emails user, logs SabiTransaction.
function WalletAdjustButton({ userId, userName, userEmail, onDone }: {
  userId: string; userName: string; userEmail: string; onDone: () => void;
}) {
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState<'credit'|'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState('');

  const adminFetch = (url: string, opts: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('sabi_admin_token') : null;
    return fetch(url, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { 'x-admin-token': token } : {}) } });
  };

  const submit = async () => {
    if (!Number(amount) || Number(amount) <= 0 || !reason.trim()) {
      setMsg('Enter ₦ amount and reason'); return;
    }
    setLoading(true);
    try {
      const res = await adminFetch('/api/sabi/admin/wallet-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, amountNaira: Number(amount), reason: reason.trim() }),
      });
      const d = await res.json();
      if (res.ok) { setMsg(`✅ ${d.message}`); setOpen(false); setAmount(''); setReason(''); onDone(); }
      else setMsg(`❌ ${d.error}`);
    } catch { setMsg('❌ Network error'); }
    finally { setLoading(false); setTimeout(() => setMsg(''), 8000); }
  };

  if (!open) return (
    <div className="flex gap-1">
      <button onClick={() => { setType('credit'); setOpen(true); }}
        className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded transition">
        + Credit
      </button>
      <button onClick={() => { setType('debit'); setOpen(true); }}
        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 text-[10px] font-bold rounded transition">
        − Debit
      </button>
    </div>
  );

  return (
    <div className="space-y-1.5 min-w-[190px]">
      {msg && <div className={`text-[10px] ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</div>}
      <div className={`text-[10px] font-bold ${type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
        {type === 'credit' ? '+ Credit' : '− Debit'} for {userName}
      </div>
      <input type="number" min="1" placeholder="₦ amount (naira)" value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1 rounded focus:outline-none" />
      <input type="text" placeholder="Reason (shown to user)" value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] px-2 py-1 rounded focus:outline-none" />
      <div className="flex gap-1">
        <button onClick={submit} disabled={loading}
          className={`flex-1 px-2 py-1 disabled:opacity-50 text-white text-[10px] font-bold rounded ${type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {loading ? '…' : `Confirm ${type}`}
        </button>
        <button onClick={() => { setOpen(false); setMsg(''); }} className="px-2 py-1 bg-slate-700 text-slate-400 text-[10px] rounded">✕</button>
      </div>
    </div>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────
// Renders a clickable <th> that shows ↑ (asc), ↓ (desc), or ↕ (inactive).
function SortTh({ label, col, sort, setSort, className = '' }: {
  label: string; col: string;
  sort: SortState; setSort: (s: SortState) => void;
  className?: string;
}) {
  const active = sort.col === col;
  const icon   = active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
  return (
    <th
      onClick={() => setSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
      className={`px-4 py-3 text-left text-xs font-semibold select-none cursor-pointer transition ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      } ${className}`}
    >
      {label}<span className="opacity-50">{icon}</span>
    </th>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
const REQ_STATUS_OPTIONS = ['new','reviewing','contacted','quoted','active','completed','rejected'];
const REQ_STATUS_COLORS: Record<string, string> = {
  new:       'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  reviewing: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  contacted: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  quoted:    'bg-purple-500/20 text-purple-300 border-purple-500/40',
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  completed: 'bg-green-500/20 text-green-300 border-green-500/40',
  rejected:  'bg-red-500/20 text-red-300 border-red-500/40',
};
const CAT_LABELS: Record<string, string> = {
  social_growth: '📈 Social Media Growth', app_reviews: '⭐ App Reviews & Ratings',
  website_traffic: '🌐 Website Traffic', community: '👥 Community Building',
  content_amp: '⚡ Content Amplification', business: '🏢 Business Promotions',
  voting: '🗳️ Voting & Petitions', other: '🎯 Custom',
};

function RequestCard({ request: r, expanded, onToggle, adminFetch, onUpdated }: {
  request: CustomRequest; expanded: boolean;
  onToggle: () => void;
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(r.status);
  const [notes, setNotes] = useState(r.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await adminFetch('/api/sabi/admin/custom-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, status, adminNotes: notes }),
      });
      const d = await res.json();
      if (res.ok) { setMsg('✅ Saved'); onUpdated(); }
      else setMsg(`❌ ${d.error}`);
    } catch { setMsg('❌ Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Summary row */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
        <div className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${REQ_STATUS_COLORS[status] || 'bg-slate-700 text-slate-300 border-white/10'}`}>
          {status}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{r.name}
            <span className="text-slate-500 font-normal ml-2">{r.email}</span>
          </div>
          <div className="text-xs text-slate-500 truncate">{CAT_LABELS[r.category] || r.category} · {r.description.slice(0, 80)}…</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-colors">
            <FiPhone className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <div className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleDateString('en-NG')}</div>
          <FiChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Category', value: CAT_LABELS[r.category] || r.category },
              { label: 'Platform', value: r.targetPlatform || '—' },
              { label: 'Quantity', value: r.quantity?.toLocaleString() || '—' },
              { label: 'Budget', value: r.budget || '—' },
              { label: 'Timeline', value: r.timeline || '—' },
              { label: 'Target URL', value: r.targetUrl ? <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate block max-w-[180px]">{r.targetUrl}</a> : '—' },
              { label: 'Email', value: <a href={`mailto:${r.email}`} className="text-blue-400 underline">{r.email}</a> },
              { label: 'WhatsApp', value: <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">+{r.whatsapp}</a> },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 mb-0.5">{item.label}</div>
                <div className="text-white font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-slate-800/40 border border-white/[0.04] rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Brief / Description</div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{r.description}</p>
          </div>

          {/* Admin actions */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <div className="text-xs text-slate-500 mb-1">Update status</div>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-white/[0.08] text-white text-sm rounded-lg focus:outline-none">
                {REQ_STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs text-slate-500 mb-1">Admin notes (internal)</div>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Quote sent, follow-up scheduled…"
                className="w-full px-3 py-2 bg-slate-800 border border-white/[0.08] text-white text-sm rounded-lg focus:outline-none placeholder-slate-600" />
            </div>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0">
              {saving ? 'Saving…' : 'Save'}
            </button>
            {msg && <span className="text-xs text-slate-400">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const qs = (p: Record<string, string | number>) =>
  '?' + new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)])).toString();

// ─── Reconcile tab: upload Flutterwave success receipts, credit the gaps ────────

type ReconRow = { txRef?: string; flwId?: string; amount?: number; status?: string; email?: string };
type ReconResult = {
  txRef: string | null; flwId: string | null; email: string | null;
  userId: string | null; userEmail: string | null; outcome: string;
  claimedNaira: number | null; creditedKobo: number | null; newBalanceKobo: number | null; note?: string;
};

// Minimal RFC-4180-ish CSV parser (handles quoted fields + escaped quotes).
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      cur.push(field); field = '';
      if (cur.some(x => x !== '')) rows.push(cur);
      cur = [];
    } else field += c;
  }
  cur.push(field);
  if (cur.some(x => x !== '')) rows.push(cur);
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
}

// Map messy Flutterwave headers → our fields. Normalises "Tx Ref"/"tx_ref"/"customer.email" etc.
function rowsFromCsv(records: Record<string, string>[]): ReconRow[] {
  if (records.length === 0) return [];
  const keys = Object.keys(records[0]);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const find = (preds: ((n: string) => boolean)[]) => {
    for (const pred of preds) { const k = keys.find(kk => pred(norm(kk))); if (k) return k; }
    return null;
  };
  const kTxRef  = find([n => n === 'txref', n => n === 'merchantreference', n => n === 'reference' || n === 'merchantref']);
  const kFlwId  = find([n => n === 'id', n => n === 'transactionid' || n === 'txid']);
  const kAmount = find([n => n === 'amount', n => n === 'amountngn' || n === 'chargedamount']);
  const kStatus = find([n => n === 'status']);
  const kEmail  = find([n => n === 'custemail' || n === 'customeremail' || n === 'email' || n === 'customermail']);
  return records.map(r => ({
    txRef:  kTxRef  ? r[kTxRef]  || undefined : undefined,
    flwId:  kFlwId  ? r[kFlwId]  || undefined : undefined,
    amount: kAmount ? (parseFloat((r[kAmount] || '').replace(/[^0-9.]/g, '')) || undefined) : undefined,
    status: kStatus ? r[kStatus] || undefined : undefined,
    email:  kEmail  ? r[kEmail]  || undefined : undefined,
  })).filter(r => r.txRef || r.flwId);
}

// Recompute the summary from accumulated results — lets us batch requests and
// still show one correct, live-updating summary.
function summarizeResults(results: ReconResult[]) {
  const c = (o: string) => results.filter(r => r.outcome === o).length;
  return {
    total: results.length,
    alreadyComplete: c('already_complete'),
    missing: c('missing'),
    completed: c('completed'),
    userNotFound: c('user_not_found'),
    ambiguous: c('ambiguous'),
    notSuccessful: c('not_successful'),
    verifyFailed: c('verify_failed'),
    creditFailed: c('credit_failed'),
    noReference: c('no_reference'),
    creditedKobo: results.reduce((s, r) => s + (r.creditedKobo || 0), 0),
  };
}

const OUTCOME_STYLE: Record<string, { label: string; cls: string }> = {
  already_complete: { label: 'Already credited', cls: 'text-emerald-400' },
  missing:          { label: 'Missing — will credit', cls: 'text-yellow-400' },
  completed:        { label: '✓ Credited now', cls: 'text-emerald-300 font-bold' },
  user_not_found:   { label: 'User not found', cls: 'text-red-400' },
  ambiguous:        { label: 'Ambiguous (manual)', cls: 'text-orange-400' },
  not_successful:   { label: 'Not successful', cls: 'text-gray-500' },
  verify_failed:    { label: 'FLW verify failed', cls: 'text-red-400' },
  credit_failed:    { label: 'Credit failed', cls: 'text-red-400' },
  no_reference:     { label: 'No reference', cls: 'text-gray-500' },
};

function ReconcileTab({ adminFetch }: { adminFetch: (url: string, opts?: RequestInit) => Promise<Response> }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ReconRow[]>([]);
  const [parseErr, setParseErr] = useState('');
  const [busy, setBusy] = useState<'' | 'scan' | 'commit'>('');
  const [progress, setProgress] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<ReconResult[]>([]);
  const [committed, setCommitted] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setParseErr(''); setSummary(null); setResults([]); setCommitted(false);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = rowsFromCsv(parseCsv(text));
      if (parsed.length === 0) { setParseErr('No usable rows found. Need a tx_ref or id column.'); setRows([]); return; }
      setRows(parsed);
    } catch { setParseErr('Could not read that file.'); setRows([]); }
  };

  // Each live Flutterwave verify is a network round-trip, so committing all the
  // missing rows at once overruns the serverless timeout. We chunk the work from
  // the browser — small batches on commit (verify-heavy), one shot on scan (DB only)
  // — and merge results as we go. Idempotent, so a failed batch can just be re-run.
  const run = async (commit: boolean) => {
    setBusy(commit ? 'commit' : 'scan');
    setParseErr(''); setProgress('');
    try {
      // On commit, only re-send the rows the scan flagged as missing; keep the rest
      // of the scan results (already-credited etc.) so the final table stays complete.
      let work = rows;
      let acc: ReconResult[] = [];
      if (commit) {
        const missingIds = new Set(results.filter(r => r.outcome === 'missing').map(r => r.txRef || r.flwId || ''));
        work = rows.filter(r => missingIds.has(r.txRef || r.flwId || ''));
        acc = results.filter(r => r.outcome !== 'missing');
        if (work.length === 0) { setBusy(''); return; }
      }

      const chunkSize = commit ? 8 : work.length;
      for (let i = 0; i < work.length; i += chunkSize) {
        const chunk = work.slice(i, i + chunkSize);
        const res = await adminFetch('/api/sabi/admin/reconcile-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk, commit }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok || !d?.success) {
          // Keep any rows not yet processed visible as 'missing' so the user can
          // click Credit again to finish the rest (idempotent — done ones are skipped).
          const doneIds = new Set(acc.map(r => r.txRef || r.flwId || ''));
          const remaining: ReconResult[] = work
            .filter(r => !doneIds.has(r.txRef || r.flwId || ''))
            .map(r => ({
              txRef: r.txRef || null, flwId: r.flwId || null, email: r.email || null,
              userId: null, userEmail: null, outcome: 'missing',
              claimedNaira: r.amount ?? null, creditedKobo: null, newBalanceKobo: null,
            }));
          const merged = [...acc, ...remaining];
          setResults(merged); setSummary(summarizeResults(merged)); setCommitted(false);
          const creditedSoFar = acc.filter(r => r.outcome === 'completed').length;
          setParseErr(
            (d?.error || 'Request failed') +
            (commit ? ` — credited ${creditedSoFar} so far, ${remaining.length} left. Click “Credit” again to continue.` : '')
          );
          return;
        }
        acc = [...acc, ...(d.results || [])];
        setResults(acc);
        setSummary(summarizeResults(acc));
        setCommitted(commit);
        if (commit) setProgress(`Credited ${acc.filter(r => r.outcome === 'completed').length}/${work.length}…`);
      }
      setProgress('');
    } catch {
      setParseErr('Network error.');
    } finally { setBusy(''); }
  };

  const missingCount = summary?.missing ?? 0;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Reconcile Flutterwave Payments</h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload your Flutterwave transactions export (CSV of successful payments). We match each
            to a SABI wallet, check whether it was already credited, and credit any that slipped
            through. Amounts are re-verified live with Flutterwave before crediting — the CSV amount is never trusted.
          </p>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-white/[0.06] rounded-xl cursor-pointer transition w-fit">
          <FiDollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-sm font-semibold">{fileName || 'Choose CSV file…'}</span>
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
        </label>

        {rows.length > 0 && (
          <div className="text-sm text-slate-300">
            Parsed <span className="font-bold text-white">{rows.length}</span> transaction row{rows.length !== 1 ? 's' : ''}.
            {rows.length >= 300 && <span className="text-yellow-400"> (max 300 processed per run — re-upload the rest after.)</span>}
          </div>
        )}
        {parseErr && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{parseErr}</div>}

        {rows.length > 0 && (
          <div className="flex gap-3">
            <button onClick={() => run(false)} disabled={!!busy}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition disabled:opacity-50">
              {busy === 'scan' ? 'Scanning…' : 'Scan (preview)'}
            </button>
            {summary && !committed && missingCount > 0 && (
              <button onClick={() => run(true)} disabled={!!busy}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition disabled:opacity-50">
                {busy === 'commit' ? 'Crediting…' : `Credit ${missingCount} missing payment${missingCount !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}
        {progress && <div className="text-sm text-emerald-400 font-semibold animate-pulse">{progress}</div>}
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Total rows', v: summary.total, c: 'text-white' },
              { l: 'Already credited', v: summary.alreadyComplete, c: 'text-emerald-400' },
              { l: committed ? 'Credited now' : 'Missing', v: committed ? summary.completed : summary.missing, c: 'text-yellow-400' },
              { l: 'Needs review', v: summary.userNotFound + summary.ambiguous + summary.verifyFailed + summary.creditFailed + summary.noReference, c: 'text-red-400' },
            ].map(s => (
              <div key={s.l} className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
                <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          {committed && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-sm font-semibold">
              ✓ Credited {fmt(summary.creditedKobo)} across {summary.completed} wallet{summary.completed !== 1 ? 's' : ''}.
              {summary.missing > 0 && <span className="text-yellow-400"> {summary.missing} still missing (re-run if needed).</span>}
            </div>
          )}

          <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/[0.06]">
                    <th className="px-4 py-3 font-semibold">tx_ref</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold text-right">Claimed</th>
                    <th className="px-4 py-3 font-semibold text-right">Credited</th>
                    <th className="px-4 py-3 font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const o = OUTCOME_STYLE[r.outcome] || { label: r.outcome, cls: 'text-slate-400' };
                    return (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300 max-w-[180px] truncate" title={r.txRef || r.flwId || ''}>{r.txRef || r.flwId || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-300">{r.userEmail || r.email || <span className="text-slate-600">—</span>}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{r.claimedNaira != null ? `₦${r.claimedNaira.toLocaleString()}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-300 font-semibold">{r.creditedKobo != null ? fmt(r.creditedKobo) : '—'}</td>
                        <td className={`px-4 py-2.5 ${o.cls}`}>{o.label}{r.note ? <span className="text-slate-500 text-xs"> · {r.note}</span> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized]   = useState(false);
  const [adminEmail, setAdminEmail]   = useState('');
  const [tab, setTab]                 = useState<Tab>('Users');
  // Per-user order-history drill-down (Users tab)
  const [expandedUser, setExpandedUser]       = useState<string | null>(null);
  const [userOrders, setUserOrders]           = useState<Record<string, UserOrder[]>>({});
  const [loadingUserOrders, setLoadingUserOrders] = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState('');

  // Orders
  const [orders, setOrders]   = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('processing');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');
  const [stats,  setStats]    = useState<Stats | null>(null);
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Users
  const [users, setUsers]         = useState<User[]>([]);
  const [userPage, setUserPage]   = useState(0);
  const [userTotal, setUserTotal] = useState(0);

  // Payments
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [payPage,  setPayPage]        = useState(0);
  const [payTotal, setPayTotal]       = useState(0);
  const [payStats, setPayStats]       = useState<any>(null);

  // Referrals
  const [referrers, setReferrers]   = useState<Referrer[]>([]);
  const [refStats,  setRefStats]    = useState<any>(null);

  // Custom Requests
  const [requests, setRequests]           = useState<CustomRequest[]>([]);
  const [reqTotal, setReqTotal]           = useState(0);
  const [reqStatusFilter, setReqStatusFilter] = useState('all');
  const [reqStatusCounts, setReqStatusCounts] = useState<Record<string, number>>({});
  const [reqExpanded, setReqExpanded]     = useState<string | null>(null);

  // Settings (WhatsApp + order limits — managed by /sabi/admin/settings)
  const LIMIT = 50;

  // Per-tab sort state — each table sorts independently
  const [orderSort, setOrderSort] = useState<SortState>({ col: 'createdAt', dir: 'desc' });
  const [userSort,  setUserSort]  = useState<SortState>({ col: 'createdAt', dir: 'desc' });
  const [paySort,   setPaySort]   = useState<SortState>({ col: 'createdAt', dir: 'desc' });
  const [refSort,   setRefSort]   = useState<SortState>({ col: 'totalEarnings', dir: 'desc' });

  // Sorted slices — applied client-side on the current page data
  const sortedOrders   = useSortedData(orders,   orderSort);
  const sortedUsers    = useSortedData(users,    userSort);
  const sortedPayments = useSortedData(payments, paySort);
  const sortedRefs     = useSortedData(referrers, refSort);

  // ── Auth: token from sessionStorage (admin/login page) or SABI session cookie ──
  const adminFetch = useCallback((url: string, opts: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('sabi_admin_token') : null;
    return fetch(url, {
      ...opts,
      headers: { ...(opts.headers || {}), ...(token ? { 'x-admin-token': token } : {}) },
    });
  }, []);

  // ── Toggle a user's order-history drill-down ───────────────────────────────
  const toggleUserOrders = useCallback(async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (!userOrders[userId]) {
      setLoadingUserOrders(userId);
      try {
        const d = await adminFetch(`/api/sabi/admin/user-orders?userId=${userId}`).then(r => r.json());
        if (d.success) setUserOrders(prev => ({ ...prev, [userId]: d.orders }));
      } catch { /* ignore */ }
      setLoadingUserOrders(null);
    }
  }, [expandedUser, userOrders, adminFetch]);

  // ── Check auth on mount ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('sabi_admin_token') : null;
      const hardcoded = 'sk_admin_1780564071_449271af_b8ad69b3dfe5739d';
      if (token === hardcoded || token === process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
        setAuthorized(true); setAdminEmail('olusehinde09@gmail.com'); return;
      }
      // Fall back to SABI session
      try {
        const res = await fetch('/api/sabi/auth/me');
        const d   = await res.json();
        if (d.success && d.user?.email) {
          const expected = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'olusehinde09@gmail.com').toLowerCase();
          if (d.user.email.toLowerCase() === expected) {
            setAuthorized(true); setAdminEmail(d.user.email); return;
          }
        }
      } catch {}
      router.push('/sabi/admin/login');
    })();
  }, [router]);

  // ── Fetch data when tab or filters change ─────────────────────────────────
  useEffect(() => {
    if (!authorized) return;
    setLoading(true);

    const go = async () => {
      try {
        if (tab === 'Orders') {
          const p: any = { limit: LIMIT, offset: orderPage * LIMIT };
          if (search)       p.search = search;
          if (statusFilter) p.status = statusFilter;
          const [o, s] = await Promise.all([
            adminFetch('/api/sabi/admin/orders'  + qs(p)).then(r => r.json()),
            adminFetch('/api/sabi/admin/stats').then(r => r.json()),
          ]);
          if (o.success) { setOrders(o.orders || []); setOrderTotal(o.pagination?.total ?? o.orders?.length ?? 0); }
          if (s.success) setStats(s.stats);
        }
        if (tab === 'Users') {
          const p: any = { limit: LIMIT, offset: userPage * LIMIT };
          if (search) p.search = search;
          const d = await adminFetch('/api/sabi/admin/users' + qs(p)).then(r => r.json());
          if (d.success) { setUsers(d.users || []); setUserTotal(d.total ?? 0); }
        }
        if (tab === 'Payments') {
          const p: any = { limit: LIMIT, offset: payPage * LIMIT };
          if (search) p.search = search;
          const d = await adminFetch('/api/sabi/admin/payments' + qs(p)).then(r => r.json());
          if (d.success) { setPayments(d.transactions || []); setPayTotal(d.total ?? 0); setPayStats(d.stats); }
        }
        if (tab === 'Referrals') {
          const d = await adminFetch('/api/sabi/admin/referrals').then(r => r.json());
          if (d.success) { setReferrers(d.referrers || []); setRefStats(d.stats); }
        }
        if (tab === 'Requests') {
          const p: any = { limit: LIMIT, offset: 0 };
          if (reqStatusFilter && reqStatusFilter !== 'all') p.status = reqStatusFilter;
          if (search) p.search = search;
          const d = await adminFetch('/api/sabi/admin/custom-requests' + qs(p)).then(r => r.json());
          if (d.success) { setRequests(d.requests || []); setReqTotal(d.total ?? 0); setReqStatusCounts(d.statusCounts || {}); }
        }
      } catch (e) { console.error('Admin fetch error:', e); }
      finally { setLoading(false); }
    };
    go();
  }, [authorized, tab, orderPage, userPage, payPage, search, statusFilter, reqStatusFilter, adminFetch]);

  if (!authorized) return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  const Pagination = ({ page, total, setPage }: { page: number; total: number; setPage: (n: number) => void }) => {
    const pages = Math.ceil(total / LIMIT);
    if (pages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] text-xs text-slate-500">
        <span>Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition flex items-center gap-1">
            <FiChevronLeft className="w-3 h-3" /> Prev
          </button>
          <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition flex items-center gap-1">
            Next <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SABI Admin</h1>
          <p className="text-slate-500 text-xs mt-0.5">Logged in as <span className="text-white">{adminEmail}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sabi/admin/settings"
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition">
            <FiSettings className="w-4 h-4" /> Settings
          </Link>
          <Link href="/sabi/dashboard"
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] px-6 flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition ${
              tab === t ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'Orders'    && <FiShoppingBag className="w-4 h-4" />}
            {t === 'Users'     && <FiUsers       className="w-4 h-4" />}
            {t === 'Payments'  && <FiDollarSign  className="w-4 h-4" />}
            {t === 'Referrals' && <FiGift        className="w-4 h-4" />}
            {t === 'Settings'  && <FiSettings    className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── ORDERS tab ─────────────────────────────────────────────────── */}
        {tab === 'Orders' && (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total', value: stats.totalOrders, color: 'text-white' },
                  { label: 'Pending', value: stats.pendingOrders, color: 'text-yellow-400' },
                  { label: 'Processing', value: stats.processingOrders, color: 'text-blue-400' },
                  { label: 'Completed', value: stats.completedOrders, color: 'text-emerald-400' },
                  // totalRevenue from API is already in kobo — fmt() divides by 100 to get naira
                  { label: 'Revenue', value: fmt(stats.totalRevenue), color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setOrderPage(0); }}
                  placeholder="Search email or order ID…"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/[0.06] text-white text-sm rounded-lg focus:outline-none focus:border-blue-500/50" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOrderPage(0); }}
                className="px-3 py-2 bg-slate-900 border border-white/[0.06] text-slate-300 text-sm rounded-lg focus:outline-none">
                <option value="">All status</option>
                {['pending','executing','completed','failed','cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={() => { setSearch(''); setStatusFilter(''); setOrderPage(0); }}
                className="px-3 py-2 bg-slate-900 border border-white/[0.06] text-slate-400 hover:text-white text-sm rounded-lg transition flex items-center gap-1">
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Action Bar — appears when orders are selected */}
            {selectedOrderIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                <span className="text-sm text-blue-300 font-bold">{selectedOrderIds.size} selected</span>
                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none flex-1 max-w-[160px]">
                  {['pending','processing','in_progress','executing','completed','failed','cancelled'].map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                  ))}
                </select>
                <button disabled={bulkRunning} onClick={async () => {
                  if (!confirm(`Change ${selectedOrderIds.size} orders to "${bulkStatus}"?`)) return;
                  setBulkRunning(true); setBulkMsg('');
                  let ok = 0; let fail = 0;
                  for (const orderId of selectedOrderIds) {
                    const res = await adminFetch('/api/sabi/admin/orders', {
                      method: 'PATCH', headers: {'Content-Type':'application/json'},
                      body: JSON.stringify({ orderId, status: bulkStatus }),
                    }).catch(() => null);
                    if (res?.ok) ok++; else fail++;
                  }
                  setBulkMsg(`✅ ${ok} updated${fail > 0 ? ` · ❌ ${fail} failed` : ''}`);
                  setSelectedOrderIds(new Set());
                  setBulkRunning(false);
                  setTimeout(() => setBulkMsg(''), 5000);
                  setOrders([]); setLoading(true);
                }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition">
                  {bulkRunning ? 'Updating…' : 'Apply to All'}
                </button>
                <button onClick={() => setSelectedOrderIds(new Set())} className="text-slate-500 text-xs hover:text-white">✕ Clear</button>
                {bulkMsg && <span className="text-xs text-emerald-400">{bulkMsg}</span>}
              </div>
            )}

            {/* Table */}
            <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-white/[0.06]">
                    <tr>
                      {/* Select-all checkbox */}
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox"
                          checked={sortedOrders.length > 0 && sortedOrders.every(o => selectedOrderIds.has(o.id))}
                          onChange={e => {
                            if (e.target.checked) setSelectedOrderIds(new Set(sortedOrders.map(o => o.id)));
                            else setSelectedOrderIds(new Set());
                          }}
                          className="rounded border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ID</th>
                      <SortTh label="User"    col="user.name"      sort={orderSort} setSort={setOrderSort} />
                      <SortTh label="Service" col="serviceType"    sort={orderSort} setSort={setOrderSort} />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Link</th>
                      <SortTh label="Qty"     col="quantity"       sort={orderSort} setSort={setOrderSort} />
                      <SortTh label="Remains" col="completedQuantity" sort={orderSort} setSort={setOrderSort} />
                      <SortTh label="Amount"  col="totalPrice"     sort={orderSort} setSort={setOrderSort} />
                      <SortTh label="Status"  col="status"         sort={orderSort} setSort={setOrderSort} />
                      <SortTh label="Created" col="createdAt"      sort={orderSort} setSort={setOrderSort} />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedOrders.length === 0 ? (
                      <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600">No orders found</td></tr>
                    ) : sortedOrders.map((o, i) => (
                      <tr key={o.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${selectedOrderIds.has(o.id) ? 'bg-blue-600/5' : ''}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox"
                            checked={selectedOrderIds.has(o.id)}
                            onChange={e => {
                              const next = new Set(selectedOrderIds);
                              e.target.checked ? next.add(o.id) : next.delete(o.id);
                              setSelectedOrderIds(next);
                            }}
                            className="rounded border-slate-600 bg-slate-800 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-600 font-mono">{orderPage * LIMIT + i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{o.id.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="text-white font-medium">{o.user?.name}</div>
                          <div className="text-slate-500">{o.user?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 capitalize">{o.serviceType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-xs">
                          <a href={o.targetUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 max-w-[160px] truncate">
                            {o.targetUrl} <FiExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-xs text-white font-semibold">{o.quantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{(o.quantity - (o.completedQuantity || 0)).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-white">{fmt(o.totalPrice)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[o.status] || ''}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(o.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {/* Status update — always available */}
                            <UpdateOrderStatusButton
                              order={o}
                              onDone={() => { setOrders([]); setLoading(true); }}
                              adminFetch={adminFetch} />
                            {/* Cancel — only for non-terminal statuses */}
                            {!['completed','cancelled','failed'].includes(o.status) && (
                              <CancelOrderButton orderId={o.id} serviceType={o.serviceType}
                                onDone={() => { setOrders([]); setLoading(true); }} adminFetch={adminFetch} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={orderPage} total={orderTotal} setPage={setOrderPage} />
            </div>
          </>
        )}

        {/* ── USERS tab ──────────────────────────────────────────────────── */}
        {tab === 'Users' && (
          <>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setUserPage(0); }}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/[0.06] text-white text-sm rounded-lg focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 w-10">#</th>
                      <SortTh label="Name"       col="name"            sort={userSort} setSort={setUserSort} />
                      <SortTh label="Email"      col="email"           sort={userSort} setSort={setUserSort} />
                      <SortTh label="Balance"    col="balance"         sort={userSort} setSort={setUserSort} />
                      <SortTh label="Spent"      col="totalSpent"      sort={userSort} setSort={setUserSort} />
                      <SortTh label="Orders"     col="orderCount"      sort={userSort} setSort={setUserSort} />
                      <SortTh label="Order Value" col="totalOrderValue" sort={userSort} setSort={setUserSort} />
                      <SortTh label="Last Order" col="lastOrderAt"     sort={userSort} setSort={setUserSort} />
                      <SortTh label="Status"     col="status"          sort={userSort} setSort={setUserSort} />
                      <SortTh label="Joined"     col="createdAt"       sort={userSort} setSort={setUserSort} />
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedUsers.length === 0 ? (
                      <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600">No users found</td></tr>
                    ) : sortedUsers.map((u, i) => (
                      <React.Fragment key={u.id}>
                      <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        {/* Count DOWN from total so oldest user = #1, newest = #N */}
                        <td className="px-3 py-3 text-center text-xs text-slate-600 font-mono">{userTotal - (userPage * LIMIT + i)}</td>
                        <td className="px-3 py-3">
                          <div className="text-xs text-white font-medium">{u.name}</div>
                          {u.phone && <div className="text-[10px] text-slate-500">{u.phone}</div>}
                          {u.businessName && <div className="text-[10px] text-purple-400/70">{u.businessName}</div>}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400">{u.email}</td>
                        <td className="px-3 py-3 text-xs text-emerald-400 font-semibold">{fmt(u.balance)}</td>
                        <td className="px-3 py-3 text-xs text-white">{fmt(u.totalSpent)}</td>
                        <td className="px-3 py-3 text-xs">
                          <span className="text-white font-semibold">{u.orderCount}</span>
                          {u.orderCount > 0 && <span className="text-emerald-400/80 text-[10px] ml-1">{u.completedOrders}✓</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-blue-300">{fmt(u.totalOrderValue)}</td>
                        <td className="px-3 py-3 text-[11px] text-slate-500">{u.lastOrderAt ? fmtDate(u.lastOrderAt) : '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[u.status] || ''}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-slate-500">{fmtDate(u.createdAt)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUserOrders(u.id)}
                              disabled={u.orderCount === 0}
                              className={`text-[11px] px-2 py-1 rounded-md border whitespace-nowrap ${u.orderCount === 0 ? 'border-white/5 text-slate-700 cursor-default' : expandedUser === u.id ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-white/10 text-slate-300 hover:bg-white/[0.04]'}`}>
                              {expandedUser === u.id ? '▲ Hide' : `▾ Orders`}
                            </button>
                            <WalletAdjustButton userId={u.id} userName={u.name} userEmail={u.email} onDone={() => setUsers([])} />
                          </div>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={11} className="px-4 py-3">
                            {loadingUserOrders === u.id ? (
                              <div className="text-xs text-slate-500 py-2">Loading {u.name}&apos;s orders…</div>
                            ) : (userOrders[u.id]?.length ?? 0) === 0 ? (
                              <div className="text-xs text-slate-600 py-2">No orders for this customer.</div>
                            ) : (
                              <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-800/40">
                                    <tr className="text-slate-500">
                                      <th className="px-3 py-2 text-left font-medium">Service</th>
                                      <th className="px-3 py-2 text-left font-medium">Target</th>
                                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                                      <th className="px-3 py-2 text-right font-medium">Paid</th>
                                      <th className="px-3 py-2 text-left font-medium">Progress</th>
                                      <th className="px-3 py-2 text-left font-medium">Status</th>
                                      <th className="px-3 py-2 text-left font-medium">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {userOrders[u.id].map(o => (
                                      <tr key={o.id} className="border-t border-white/[0.04]">
                                        <td className="px-3 py-2 text-white">{o.serviceType}</td>
                                        <td className="px-3 py-2 text-slate-400 max-w-[200px] truncate">
                                          <a href={o.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">{o.targetUrl}</a>
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-300">{o.quantity.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right text-emerald-400">{fmt(o.amountPaid)}</td>
                                        <td className="px-3 py-2 text-slate-400">{o.completedQuantity.toLocaleString()}/{o.quantity.toLocaleString()} ({o.completionPercentage}%)</td>
                                        <td className="px-3 py-2">
                                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">{fmtDate(o.createdAt)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={userPage} total={userTotal} setPage={setUserPage} />
            </div>
          </>
        )}

        {/* ── PAYMENTS tab ───────────────────────────────────────────────── */}
        {tab === 'Payments' && (
          <>
            {/* Stats */}
            {payStats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total deposited',    value: fmt(payStats.totalDeposited),                            color: 'text-emerald-400' },
                  { label: 'Total deposits',     value: `${(payStats.totalTransactions ?? 0).toLocaleString()} deposits`, color: 'text-blue-400' },
                  { label: 'Avg per deposit',    value: payStats.totalTransactions > 0 ? fmt(Math.round((payStats.totalDeposited ?? 0) / payStats.totalTransactions)) : '₦0', color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPayPage(0); }}
                  placeholder="Search by ref or description…"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/[0.06] text-white text-sm rounded-lg focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ID</th>
                      <SortTh label="User"        col="userName"    sort={paySort} setSort={setPaySort} />
                      <SortTh label="Type"        col="type"        sort={paySort} setSort={setPaySort} />
                      <SortTh label="Amount"      col="amount"      sort={paySort} setSort={setPaySort} />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Description</th>
                      <SortTh label="Date"        col="createdAt"   sort={paySort} setSort={setPaySort} />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedPayments.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">No transactions found</td></tr>
                    ) : sortedPayments.map((p, i) => (
                      <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-center text-xs text-slate-600 font-mono">{payPage * LIMIT + i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.id.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="text-white font-medium">{p.userName}</div>
                          <div className="text-slate-500">{p.userEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${STATUS_COLORS[p.type] || 'text-slate-400'}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-white">{fmt(p.amount)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.reference || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{p.description}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={payPage} total={payTotal} setPage={setPayPage} />
            </div>
          </>
        )}

        {/* ── REFERRALS tab ──────────────────────────────────────────────── */}
        {tab === 'Referrals' && (
          <>
            {refStats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Referrers',   value: refStats.totalReferrers, color: 'text-white' },
                  { label: 'Sign-ups',    value: refStats.totalReferrals, color: 'text-blue-400' },
                  { label: 'Qualified',   value: refStats.totalQualified, color: 'text-yellow-400' },
                  { label: 'Paid out',    value: refStats.totalPaid,      color: 'text-emerald-400' },
                  { label: 'Total ₦',     value: `₦${refStats.totalPaidOut?.toLocaleString()}`, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900 border border-white/[0.06] rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-10">#</th>
                      <SortTh label="User"          col="name"            sort={refSort} setSort={setRefSort} />
                      <SortTh label="Email"         col="email"           sort={refSort} setSort={setRefSort} />
                      <SortTh label="Registrations" col="registrations"   sort={refSort} setSort={setRefSort} />
                      <SortTh label="Qualified"     col="qualified"       sort={refSort} setSort={setRefSort} />
                      <SortTh label="Paid"          col="paid"            sort={refSort} setSort={setRefSort} />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Conversion</th>
                      <SortTh label="Total Earned"  col="totalEarnings"   sort={refSort} setSort={setRefSort} />
                      <SortTh label="Available"     col="availableEarnings" sort={refSort} setSort={setRefSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedRefs.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">No referral data yet</td></tr>
                    ) : sortedRefs.map((r, i) => (
                      <tr key={r.userId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-center text-xs text-slate-600 font-mono">{i + 1}</td>
                        <td className="px-4 py-3 text-xs text-white font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{r.email}</td>
                        <td className="px-4 py-3 text-xs text-white">{r.registrations}</td>
                        <td className="px-4 py-3 text-xs text-yellow-400">{r.qualified}</td>
                        <td className="px-4 py-3 text-xs text-emerald-400">{r.paid}</td>
                        <td className="px-4 py-3 text-xs text-white">
                          {r.registrations > 0 ? `${Math.round((r.qualified / r.registrations) * 100)}%` : '0%'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-white">₦{r.totalEarnings.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-emerald-400">₦{r.availableEarnings.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── REQUESTS tab ───────────────────────────────────────────────── */}
        {tab === 'Requests' && (
          <>
            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['all', 'new', 'reviewing', 'contacted', 'quoted', 'active', 'completed', 'rejected'].map(s => (
                <button key={s}
                  onClick={() => setReqStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                    reqStatusFilter === s
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'bg-slate-800 text-slate-400 border-white/[0.06] hover:border-white/20'
                  }`}>
                  {s === 'all' ? `All (${reqTotal})` : `${s} ${reqStatusCounts[s] ? `(${reqStatusCounts[s]})` : ''}`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-600">Loading requests…</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/60 border border-white/[0.06] rounded-xl">
                <div className="text-4xl mb-3">📬</div>
                <div className="text-slate-400 font-semibold">No custom requests yet</div>
                <div className="text-slate-600 text-sm mt-1">Requests submitted via the Custom Order page will appear here.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <RequestCard key={r.id} request={r} expanded={reqExpanded === r.id}
                    onToggle={() => setReqExpanded(reqExpanded === r.id ? null : r.id)}
                    adminFetch={adminFetch} onUpdated={() => {
                      // Refresh
                      const p: any = { limit: LIMIT, offset: 0 };
                      if (reqStatusFilter !== 'all') p.status = reqStatusFilter;
                      adminFetch('/api/sabi/admin/custom-requests' + qs(p)).then(r => r.json()).then(d => {
                        if (d.success) { setRequests(d.requests || []); setReqTotal(d.total ?? 0); setReqStatusCounts(d.statusCounts || {}); }
                      });
                    }} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SETTINGS tab ───────────────────────────────────────────────── */}
        {tab === 'Reconcile' && <ReconcileTab adminFetch={adminFetch} />}

        {tab === 'Settings' && (
          <div className="max-w-lg">
            <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Platform Settings</h2>
              <p className="text-slate-400 text-sm">Manage WhatsApp support number, order limits and more.</p>
              <Link href="/sabi/admin/settings"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl transition hover:from-blue-600 hover:to-purple-700">
                <FiSettings className="w-4 h-4" />
                Open Settings
              </Link>
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-2">
                <Link href="/sabi/admin/promos"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition">
                  🎁 Manage Promo Codes
                </Link>
                <Link href="/sabi/admin/staff"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition">
                  🛡️ Staff Access
                </Link>
                <Link href="/sabi/staff"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition">
                  🧾 Staff Console
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
