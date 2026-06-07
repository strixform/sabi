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

interface Stats {
  totalOrders: number; pendingOrders: number;
  processingOrders: number; completedOrders: number;
  totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  executing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:    'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  banned:    'bg-red-500/15 text-red-400 border-red-500/30',
  deposit:   'bg-emerald-500/15 text-emerald-400',
  order:     'bg-blue-500/15 text-blue-400',
  refund:    'bg-yellow-500/15 text-yellow-400',
  bonus:     'bg-purple-500/15 text-purple-400',
};

const fmt = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
const TABS = ['Orders', 'Users', 'Payments', 'Referrals', 'Settings'] as const;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized]   = useState(false);
  const [adminEmail, setAdminEmail]   = useState('');
  const [tab, setTab]                 = useState<Tab>('Orders');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState('');

  // Orders
  const [orders, setOrders]   = useState<Order[]>([]);
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
    const qs = (p: Record<string, string | number>) =>
      '?' + new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)])).toString();

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
      } catch (e) { console.error('Admin fetch error:', e); }
      finally { setLoading(false); }
    };
    go();
  }, [authorized, tab, orderPage, userPage, payPage, search, statusFilter, adminFetch]);

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
                  { label: 'Revenue', value: fmt(stats.totalRevenue * 100), color: 'text-purple-400' },
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

            {/* Table */}
            <div className="bg-slate-900 border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 border-b border-white/[0.06]">
                    <tr>
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
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedOrders.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600">No orders found</td></tr>
                    ) : sortedOrders.map((o, i) => (
                      <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
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
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ID</th>
                      <SortTh label="Name"      col="name"          sort={userSort} setSort={setUserSort} />
                      <SortTh label="Email"     col="email"         sort={userSort} setSort={setUserSort} />
                      <SortTh label="Balance"   col="balance"       sort={userSort} setSort={setUserSort} />
                      <SortTh label="Spent"     col="totalSpent"    sort={userSort} setSort={setUserSort} />
                      <SortTh label="Status"    col="status"        sort={userSort} setSort={setUserSort} />
                      <SortTh label="Verified"  col="emailVerified" sort={userSort} setSort={setUserSort} />
                      <SortTh label="Created"   col="createdAt"     sort={userSort} setSort={setUserSort} />
                      <SortTh label="Last Auth" col="lastAuth"      sort={userSort} setSort={setUserSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600">Loading…</td></tr>
                    ) : sortedUsers.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600">No users found</td></tr>
                    ) : sortedUsers.map((u, i) => (
                      <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        {/* Count DOWN from total so oldest user = #1, newest = #N */}
                        <td className="px-4 py-3 text-center text-xs text-slate-600 font-mono">{userTotal - (userPage * LIMIT + i)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{u.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-xs text-white font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-emerald-400 font-semibold">{fmt(u.balance)}</td>
                        <td className="px-4 py-3 text-xs text-white">{fmt(u.totalSpent)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[u.status] || ''}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {u.emailVerified
                            ? <span className="text-emerald-400">✓ Yes</span>
                            : <span className="text-slate-500">No</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{u.lastAuth ? fmtDate(u.lastAuth) : '—'}</td>
                      </tr>
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
                  { label: 'Total deposited', value: fmt(payStats.totalDeposited), color: 'text-emerald-400' },
                  { label: 'Total spent',     value: fmt(payStats.totalSpent),     color: 'text-blue-400' },
                  { label: 'Total refunded',  value: fmt(payStats.totalRefunded),  color: 'text-yellow-400' },
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

        {/* ── SETTINGS tab ───────────────────────────────────────────────── */}
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
              <div className="pt-2 border-t border-white/[0.06]">
                <Link href="/sabi/admin/promos"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition">
                  🎁 Manage Promo Codes
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
