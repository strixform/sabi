'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, type ReactNode, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { SERVICES_CATALOG } from '@/lib/servicesCatalog';

// Services (sorted by platform then name) for the "by service" review filter — lets
// staff pull up every order for one service to tell a systemic issue from a one-off.
const SERVICE_FILTER_OPTIONS = [...SERVICES_CATALOG]
  .sort((a, b) => (a.category + a.name).localeCompare(b.category + b.name))
  .map(s => ({ id: s.id, label: s.name }));

// Click-to-copy chip. Rendered as a span (not a button) so it can live inside the
// card's header button without nesting buttons; stops propagation so copying does
// not also toggle the card open/closed. Shows a brief ✓ after copying.
function Copyable({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = (e: SyntheticEvent) => {
    e.stopPropagation(); e.preventDefault();
    navigator.clipboard?.writeText(value);
    setDone(true); setTimeout(() => setDone(false), 1200);
  };
  return (
    <span role="button" tabIndex={0} onClick={copy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') copy(e); }}
      title="Click to copy"
      className={`inline-flex items-center gap-1 cursor-pointer hover:text-white ${className || ''}`}>
      {children}<span className="opacity-50">{done ? '✓' : '⧉'}</span>
    </span>
  );
}

type Tab = 'proofs' | 'find' | 'review' | 'taskers' | 'reuploads' | 'checked' | 'refunds' | 'refills' | 'requests' | 'partnerships';

interface Order {
  id: string; serviceType: string; targetUrl: string; quantity: number;
  completedQuantity: number | null; status: string; createdAt: string;
  staffChecked?: boolean; staffCheckedAt?: string | null; staffCheckedBy?: string | null;
  startCount?: number | null; startScreenshotUrl?: string | null;
  refillOf?: string | null; isRefill?: boolean;
  user?: { email: string; name: string; businessName?: string | null } | null;
}
interface ProofFlag { status: string; reason: string | null; reuploadedAt: string | null; }
interface Proof {
  id: string; proofUrl: string | null; proofText: string | null; status: string; createdAt: string;
  flag?: ProofFlag | null; staffApproved?: boolean;
  username?: string | null; bankName?: string | null; accountName?: string | null;
  // Before/after proof the tasker uploaded + the numbers they reported.
  beforeUrl?: string | null; afterUrl?: string | null; accountUsername?: string | null;
  countBefore?: string | null; countAfter?: string | null;
  // Auto-triage: this exact screenshot was reused on other proofs.
  duplicateImage?: boolean; duplicateCount?: number; duplicateCrossUser?: boolean;
  // Auto-triage: OCR ran and the tasker's @username was NOT visible in the screenshot.
  handleMissing?: boolean;
  // Tasker trust — overall reputation of the person who submitted this proof.
  trustScore?: number; trustLevel?: string; // trusted | normal | low | flagged
  commentUsed?: string | null; // the exact comment the tasker posted (comment tasks)
  approvedBy?: string | null; flaggedBy?: string | null; // owner-only staff attribution
}
interface Refill {
  id: string; orderId: string; serviceType: string; targetUrl: string;
  refillQuantity: number; reason: string | null; status: string; createdAt: string;
  startCount?: number | null; startScreenshotUrl?: string | null;
  originalQuantity?: number | null; completedQuantity?: number | null; estimatedCount?: number | null;
}
interface CustomReq {
  id: string; category?: string; status: string; description: string;
  name: string; email: string; whatsapp: string; targetUrl?: string | null;
  targetPlatform?: string | null; quantity?: number | null; budget?: string | null; createdAt: string;
}

const isImg = (u?: string | null) => !!u && /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(u);

// Parse a reported count like "1,240" → 1240. Returns null if not a clean number.
const numFromCount = (s?: string | null): number | null => {
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};
// A proof is "numbers-down" when the tasker's own after ≤ before — i.e. the action
// produced no gain. Strong signal the task wasn't really done (auto-flag candidate).
const numbersDown = (p: Proof): boolean => {
  const b = numFromCount(p.countBefore), a = numFromCount(p.countAfter);
  return b !== null && a !== null && a <= b;
};
// Combined auto-triage suspicion: higher = more red flags. Sorts the worst to the top.
// Reused-across-users screenshot is the strongest signal, then reused image, then no-gain.
const suspScore = (p: Proof): number =>
  (p.duplicateImage && p.duplicateCrossUser ? 3 : 0) +
  (p.duplicateImage ? 2 : 0) +
  (p.handleMissing ? 2 : 0) +
  (p.trustLevel === 'flagged' ? 3 : p.trustLevel === 'low' ? 1 : 0) +
  (numbersDown(p) ? 1 : 0);

// Small chip describing the tasker's trust tier.
const TRUST_CHIP: Record<string, { label: string; cls: string }> = {
  trusted: { label: '🟢 trusted tasker', cls: 'text-emerald-300 bg-emerald-500/15' },
  normal:  { label: '⚪ normal', cls: 'text-slate-300 bg-white/5' },
  low:     { label: '🟠 low trust', cls: 'text-amber-300 bg-amber-500/15' },
  flagged: { label: '🔴 flagged tasker', cls: 'text-red-300 bg-red-500/20' },
};
const fmtSvc = (s?: string | null) => (s || 'request').replace(/_/g, ' ');

// Preset flag reasons staff can pick (plus a free-text box for anything else).
const FLAG_REASONS = [
  'Wrong account/page — proof is for a different target',
  'Screenshot does not show the action completed',
  'Fake, edited or reused screenshot',
  'Action not actually performed (no like/follow/comment visible)',
  'Engagement dropped / was undone',
  'Comment does not match the buyer’s brief',
  'Mentioned Gamerz / revealed the source',
  'Low quality or spammy engagement',
  'Blurry or unreadable screenshot',
];

// Auth is by login session cookie — owner (admin-email account) or staff. No
// token needed; same-origin cookies are sent automatically.
function af(url: string, opts: RequestInit = {}) {
  return fetch(url, opts);
}

export default function StaffConsole() {
  const [role, setRole] = useState<'owner' | 'staff' | null | 'loading'>('loading');
  const [tab, setTab] = useState<Tab>('review');

  const checkRole = useCallback(() => {
    setRole('loading');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000); // never hang on "Loading…"
    fetch('/api/sabi/admin/whoami', { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRole(d?.role || null))
      .catch(() => setRole(null))
      .finally(() => clearTimeout(t));
  }, []);

  useEffect(() => { checkRole(); }, [checkRole]);

  // Live "re-uploads waiting for re-review" count — refreshed on load + every 60s.
  const [resub, setResub] = useState(0);
  useEffect(() => {
    if (!role || role === 'loading') return;
    const poll = () => af('/api/sabi/admin/resubmitted').then(r => (r.ok ? r.json() : null)).then(d => d && setResub(d.count || 0)).catch(() => {});
    poll();
    const i = setInterval(poll, 60000);
    return () => clearInterval(i);
  }, [role]);

  if (role === 'loading') return <div className="min-h-screen bg-[#030507] text-slate-400 flex items-center justify-center">Loading…</div>;
  if (!role) return (
    <div className="min-h-screen bg-[#030507] text-slate-300 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-black text-white mb-2">Staff access only</h1>
        <p className="text-sm text-slate-500 mb-4">Sign in with the SABI account that&apos;s registered as admin or staff, then reload.</p>
        <div className="flex gap-2 justify-center">
          <Link href="/sabi/login" className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm">Sign in</Link>
          <button onClick={checkRole} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm">Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030507] text-slate-200 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black flex items-center gap-2">🛡️ Staff Console</h1>
          {role === 'owner' && <Link href="/sabi/admin/staff" className="text-sm text-blue-400 hover:underline">Manage staff →</Link>}
        </div>
        <p className="text-xs text-slate-500 mb-4">Review delivery proofs, confirm coherence, and handle refill & custom requests.</p>

        <PersonalizeBanner />

        {resub > 0 && (
          <button onClick={() => setTab('reuploads')}
            className="w-full text-left mb-4 rounded-xl px-4 py-3 flex items-center gap-2 transition hover:brightness-110"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)' }}>
            <span className="text-lg">🔁</span>
            <span className="text-sm font-bold text-yellow-300">{resub} re-upload{resub > 1 ? 's' : ''} waiting for re-review</span>
            <span className="text-xs text-yellow-200/70 ml-auto">Open Re-uploads →</span>
          </button>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            ['review', '🕵️ Tasker Review'],
            ['proofs', '🧾 Orders & Proofs'],
            ['find', '🔍 Find Orders'],
            ['taskers', '🔎 Taskers'],
            ['reuploads', `🔁 Re-uploads${resub > 0 ? ` (${resub})` : ''}`],
            ['checked', '✅ Checked Orders'],
            ['refunds', '↩️ Refunds'],
            ['refills', '🔁 Refills'],
            ['requests', '📋 Requests'],
            ['partnerships', '🤝 Partnerships'],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'proofs' && <ProofsTab owner={role === 'owner'} />}
        {tab === 'find' && <FindOrdersTab />}
        {tab === 'review' && <TaskerReviewTab />}
        {tab === 'taskers' && <TaskerLookupTab />}
        {tab === 'reuploads' && <ReuploadsTab />}
        {tab === 'checked' && <CheckedOrdersTab />}
        {tab === 'refunds' && <StaffRefundsTab />}
        {tab === 'refills' && <RefillsTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'partnerships' && <PartnershipsTab />}
      </div>
    </div>
  );
}

// ─── Orders & Proofs ─────────────────────────────────────────────────────────
// Staff refill — type a quantity to top up THIS order with fresh, non-banned taskers.
// Manual refill — staff top up ANY order by id, straight to fresh taskers. Lives on
// the Refill page (no longer embedded in Orders & Proofs).
function ManualRefillTool() {
  const [orderId, setOrderId] = useState('');
  const [qty, setQty]   = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState('');
  const submit = async () => {
    const q = Math.floor(Number(qty) || 0);
    if (!orderId.trim()) { setMsg('❌ Enter the order id'); return; }
    if (q < 1) { setMsg('❌ Enter a quantity'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await af('/api/sabi/admin/refills', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim(), quantity: q }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok && d.success ? `✅ ${d.message}` : `❌ ${d.error || 'Failed'}`);
      if (res.ok) { setQty(''); setOrderId(''); }
    } catch { setMsg('❌ Network error'); }
    finally { setBusy(false); }
  };
  return (
    <div className="mb-4 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl px-3 py-3">
      <div className="text-[11px] text-emerald-300 font-bold mb-2">🔄 Manual refill (any order → fresh taskers)</div>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Order id"
          className="flex-1 min-w-[140px] bg-[#0F1420] border border-white/10 rounded-lg px-3 py-2 text-sm" />
        <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty"
          className="w-24 bg-[#0F1420] border border-white/10 rounded-lg px-3 py-2 text-sm" />
        <button onClick={submit} disabled={busy}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50">
          {busy ? '…' : 'Create refill'}
        </button>
      </div>
      <div className="text-[10px] text-slate-500 mt-1.5">Free top-up — buyer not charged · goes to fresh taskers (anyone who did this order is blocked).</div>
      {msg && <div className={`text-[10px] mt-1 ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</div>}
    </div>
  );
}

// A personal banner so the console feels like home — a photo they love + a greeting +
// an accent colour. Stored per-device (localStorage), private to them, no backend.
function PersonalizeBanner() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<{ photo?: string; name?: string; msg?: string; accent?: string }>({});
  useEffect(() => {
    try { setCfg(JSON.parse(localStorage.getItem('sabi_staff_home') || '{}')); } catch {}
  }, []);
  const save = (next: typeof cfg) => { setCfg(next); try { localStorage.setItem('sabi_staff_home', JSON.stringify(next)); } catch {} };
  const onPhoto = (file: File) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const c = document.createElement('canvas');
        const scale = Math.min(1, 900 / img.width);
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
        save({ ...cfg, photo: c.toDataURL('image/jpeg', 0.72) });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  const accent = cfg.accent || '#3b82f6';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="mb-4 rounded-2xl overflow-hidden border" style={{ borderColor: `${accent}55` }}>
      {/* Banner header — fixed height; the overlay is pointer-events-none so it NEVER blocks clicks */}
      <div className="relative h-24 sm:h-28">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: cfg.photo ? `url(${cfg.photo})` : `linear-gradient(135deg, ${accent}, #0b0f17)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/10 pointer-events-none" />
        <div className="absolute inset-0 p-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-white font-black text-lg leading-tight truncate">{greet}{cfg.name ? `, ${cfg.name}` : ''} 💙</div>
            <div className="text-slate-200 text-xs truncate">{cfg.msg || 'Welcome to your console — you make delivery honest. 🛡️'}</div>
          </div>
          <button onClick={() => setOpen(o => !o)} className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 border border-white/20">
            {open ? '✕ Close' : '🎨 Personalize'}
          </button>
        </div>
      </div>
      {/* Editor — normal flow BELOW the banner, so every control is clickable */}
      {open && (
        <div className="p-4 bg-[#0B0F17] border-t border-white/10 space-y-3">
          <div className="text-xs text-slate-400">Make this space yours — add a photo you love (family, your group, anything), your name, and a note. It shows only to you, on this device.</div>

          <div>
            <div className="text-[10px] font-black tracking-wide text-slate-400 mb-1">📷 YOUR PHOTO</div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cfg.photo && <img src={cfg.photo} alt="you" className="w-12 h-12 rounded-lg object-cover border border-white/10" />}
              <label className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-500">
                {cfg.photo ? 'Change photo' : 'Upload a photo'}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
              </label>
              {cfg.photo && <button onClick={() => save({ ...cfg, photo: undefined })} className="text-xs text-red-300 hover:underline">Remove</button>}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black tracking-wide text-slate-400 mb-1">🎨 ACCENT COLOUR</div>
            <div className="flex gap-2">
              {['#3b82f6', '#10b981', '#ef4444', '#a855f7', '#f59e0b', '#ec4899'].map(c => (
                <button key={c} type="button" onClick={() => save({ ...cfg, accent: c })} className="w-7 h-7 rounded-full border-2 transition" style={{ background: c, borderColor: accent === c ? '#fff' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black tracking-wide text-slate-400 mb-1">👤 YOUR NAME</div>
            <input value={cfg.name || ''} onChange={e => save({ ...cfg, name: e.target.value.slice(0, 24) })} placeholder="e.g. Ada"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50" />
          </div>

          <div>
            <div className="text-[10px] font-black tracking-wide text-slate-400 mb-1">💬 A NOTE TO YOURSELF</div>
            <input value={cfg.msg || ''} onChange={e => save({ ...cfg, msg: e.target.value.slice(0, 80) })} placeholder="e.g. Stay sharp — every check protects a customer."
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">Saved automatically · private to this device.</span>
            <button onClick={() => setOpen(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Look up any tasker and see every task they've submitted (title, Task ID, status, proof).
function TaskerLookupTab() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[] | null>(null);

  const run = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setData(null); setCandidates(null);
    try {
      const res = await fetch(`/api/sabi/orders/tasker-lookup?q=${encodeURIComponent(query.trim())}`);
      const d = await res.json();
      if (!res.ok) { if (d.candidates) setCandidates(d.candidates); else setError(d.error || 'Lookup failed'); return; }
      setData(d);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); run(q); }} className="flex gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tasker email or username"
          className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500/50" />
        <button disabled={loading || !q.trim()} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-sm font-bold disabled:opacity-40">{loading ? '…' : 'Look up'}</button>
      </form>

      {error && <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}

      {candidates && (
        <div className="rounded-lg border border-white/10 divide-y divide-white/5">
          <div className="p-2 text-xs text-slate-500">{candidates.length} matches — pick one:</div>
          {candidates.map((c: any) => (
            <button key={c.id} onClick={() => { setQ(c.username || c.email); run(c.username || c.email); }} className="block w-full text-left p-2.5 text-sm hover:bg-white/5">
              {c.username} <span className="text-slate-500">· {c.email}</span>
            </button>
          ))}
        </div>
      )}

      {data && (
        <div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mb-3">
            <div className="text-sm font-black text-white">{data.tasker.username} {data.tasker.isBanned && <span className="text-red-400 text-xs">🚫 banned</span>}</div>
            <div className="text-xs text-slate-500">{data.tasker.email}</div>
            {data.tasker.trustLevel && <div className="text-[11px] text-slate-400 mt-0.5">Trust: {data.tasker.trustLevel} ({data.tasker.trustScore}/100) · {data.total} task(s) submitted</div>}
          </div>
          <div className="rounded-lg border border-white/10 divide-y divide-white/5">
            {data.tasks.length === 0 && <div className="p-3 text-sm text-slate-600">No tasks submitted.</div>}
            {data.tasks.map((t: any) => (
              <div key={t.completionId} className="p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-200 truncate">{t.title}</div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${t.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : t.status === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>{t.status}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                  <Copyable value={t.taskId} className="font-mono text-amber-400/80">🔖 {t.taskId}</Copyable>
                  {t.proofUrl && <a href={t.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">proof ↗</a>}
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProofsTab({ owner }: { owner: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all'); // show every order by default
  const [service, setService] = useState(''); // filter to one service (serviceType id)
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, { loading: boolean; items: Proof[]; total: number; approved: number }>>({});
  const [proofBusy, setProofBusy] = useState<string | null>(null);
  // Flag-reason modal
  const [flagTarget, setFlagTarget] = useState<{ orderId: string; completionId: string } | null>(null);
  const [flagPresets, setFlagPresets] = useState<string[]>([]);
  const [flagNote, setFlagNote] = useState('');
  const [flagFixHint, setFlagFixHint] = useState('');
  const [flagExampleUrl, setFlagExampleUrl] = useState('');
  const [flagExampleBusy, setFlagExampleBusy] = useState(false);
  // Expandable proof detail + "just viewed" tracking (so clamped cards don't confuse staff).
  const [detailProof, setDetailProof] = useState<{ orderId: string; p: Proof } | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem('sabi_viewed_proofs') || '[]')); } catch { return new Set(); }
  });
  const markViewed = (id: string) => setViewed(prev => {
    if (prev.has(id)) return prev;
    const next = new Set(prev); next.add(id);
    try { localStorage.setItem('sabi_viewed_proofs', JSON.stringify([...next].slice(-2000))); } catch {}
    return next;
  });
  const openDetail = (orderId: string, p: Proof) => { markViewed(p.id); setDetailProof({ orderId, p }); };

  const load = useCallback(() => {
    setLoading(true);
    const q = status === 'all' ? '' : `&status=${status}`;
    const s = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    const sv = service ? `&service=${encodeURIComponent(service)}` : '';
    // Only orders NOT yet marked checked — checked ones live in the "Checked Orders" tab.
    af(`/api/sabi/admin/staff-orders?checked=0&limit=50${q}${s}${sv}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { setOrders(d?.orders || []); setTotal(d?.total ?? (d?.orders?.length || 0)); })
      .catch(() => { setOrders([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [status, search, service]);
  useEffect(() => { load(); }, [load]);

  // Approve a single proof (staff confirms it's correct → won't be re-checked).
  const approveProof = async (orderId: string, completionId: string) => {
    setProofBusy(completionId);
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action: 'approve' }),
      });
      if (res.ok) setProofs(p => {
        const cur = p[orderId]; if (!cur) return p;
        return { ...p, [orderId]: { ...cur, items: cur.items.map(it => it.id === completionId ? { ...it, staffApproved: true } : it) } };
      });
    } finally { setProofBusy(null); }
  };

  // Bulk selection per order → approve or flag many proofs at once.
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const toggleSel = (orderId: string, cid: string) => setSelected(s => {
    const cur = new Set(s[orderId] || []);
    cur.has(cid) ? cur.delete(cid) : cur.add(cid);
    return { ...s, [orderId]: cur };
  });
  const selCount = (orderId: string) => (selected[orderId]?.size || 0);
  const setAllSel = (orderId: string, ids: string[]) => setSelected(s => ({ ...s, [orderId]: new Set(ids) }));
  const clearSel = (orderId: string) => setSelected(s => ({ ...s, [orderId]: new Set() }));

  const bulkAct = async (orderId: string, action: 'approve' | 'flag') => {
    const ids = [...(selected[orderId] || [])];
    if (!ids.length) return;
    let reason = '';
    if (action === 'flag') { reason = prompt('Flag reason for the selected proofs (tasker sees this):') || ''; if (!reason) return; }
    setProofBusy('bulk:' + orderId);
    try {
      await Promise.all(ids.map(cid => af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId: cid, action, reason }),
      })));
      setProofs(p => {
        const cur = p[orderId]; if (!cur) return p;
        return { ...p, [orderId]: { ...cur, items: cur.items.map(it => !ids.includes(it.id) ? it
          : action === 'approve' ? { ...it, staffApproved: true }
          : { ...it, flag: { status: 'flagged', reason, reuploadedAt: null } }) } };
      });
      clearSel(orderId);
    } finally { setProofBusy(null); }
  };

  // Mark the whole order reviewed → it leaves this list and moves to Checked Orders.
  const [checking, setChecking] = useState<string | null>(null);
  const markChecked = async (orderId: string) => {
    setChecking(orderId);
    try {
      const res = await af('/api/sabi/admin/order-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, checked: true }),
      });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== orderId));
    } finally { setChecking(null); }
  };

  const loadProofs = (id: string) => {
    setProofs(p => ({ ...p, [id]: { loading: true, items: [], total: 0, approved: 0 } }));
    af(`/api/sabi/orders/proofs?orderId=${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setProofs(p => ({ ...p, [id]: { loading: false, items: d?.proofs || [], total: d?.total || 0, approved: d?.approved || 0 } })))
      .catch(() => setProofs(p => ({ ...p, [id]: { loading: false, items: [], total: 0, approved: 0 } })));
  };

  const toggle = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!proofs[id]) loadProofs(id);
  };

  // Open the reason picker for a flag. Clearing skips it (no reason needed).
  const openFlag = (orderId: string, completionId: string) => {
    setFlagTarget({ orderId, completionId });
    setFlagPresets([]);
    setFlagNote('');
    setFlagFixHint('');
    setFlagExampleUrl('');
  };

  // Upload the "correct example" image → gamerz360 watermarks + stores it, returns URL.
  const uploadFlagExample = async (file: File) => {
    setFlagExampleBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await af('/api/sabi/admin/flag-example-upload', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.url) setFlagExampleUrl(d.url);
      else alert(d.error || 'Could not upload the example image.');
    } finally { setFlagExampleBusy(false); }
  };

  // Flag (or clear) a SPECIFIC proof → gamerz360 notifies that exact tasker, and
  // surfaces whether this flag triggered a final warning or auto-suspension.
  const doFlag = async (orderId: string, completionId: string, action: 'flag' | 'clear', reason = '', fixHint = '', exampleImageUrl = '') => {
    setProofBusy(completionId);
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action, reason, fixHint: fixHint || undefined, exampleImageUrl: exampleImageUrl || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.success) {
        setProofs(p => {
          const cur = p[orderId]; if (!cur) return p;
          return { ...p, [orderId]: { ...cur, items: cur.items.map(it => it.id === completionId
            ? { ...it, flag: action === 'clear' ? null : { status: 'flagged', reason, reuploadedAt: null } } : it) } };
        });
        if (action === 'flag') {
          if (d.suspended) alert('🚫 This was the final strike — the tasker has been AUTO-SUSPENDED.');
          else if (d.finalWarning) alert('🚨 Final warning sent — the tasker will be suspended on their next flag.');
        }
      } else {
        alert(d.error || 'Could not flag this proof.');
      }
    } finally { setProofBusy(null); }
  };

  const submitFlag = async () => {
    if (!flagTarget) return;
    const reason = [...flagPresets, flagNote.trim()].filter(Boolean).join(' · ');
    if (!reason) { alert('Pick at least one reason or type one.'); return; }
    const { orderId, completionId } = flagTarget;
    const fixHint = flagFixHint.trim();
    const exampleUrl = flagExampleUrl;
    setFlagTarget(null);
    await doFlag(orderId, completionId, 'flag', reason, fixHint, exampleUrl);
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        👉 Tap an order to open its delivery proofs. Check each proof matches the target account. If one doesn&apos;t, tap <b className="text-red-300">⚠️ Flag</b> on that proof — the tasker is told to re-upload within 12h. When they re-upload (🔁), re-check and <b className="text-emerald-300">✅ Clear</b> it.
      </p>
      {/* Search by customer email, name, or order ID */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2 mb-3">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by customer email, name, or order ID…"
          className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-2 rounded-lg text-sm font-bold bg-white/10 text-slate-300">Clear</button>}
      </form>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {['all', 'executing', 'completed', 'processing'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${status === s ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>{s}</button>
        ))}
        {/* Review every order for one service — spot a systemic issue vs a one-off. */}
        <select value={service} onChange={(e) => setService(e.target.value)}
          title="Review every order for one service"
          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F1420] border outline-none max-w-[220px] ${service ? 'border-blue-500/50 text-white' : 'border-white/[0.08] text-slate-400'}`}>
          <option value="">All services</option>
          {SERVICE_FILTER_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {service && (
          <button onClick={() => setService('')} className="px-2 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-slate-300">✕</button>
        )}
      </div>
      {!loading && orders.length > 0 && (
        <div className="text-[11px] font-bold text-slate-400 mb-2">
          {total.toLocaleString()} order{total === 1 ? '' : 's'}{service ? ' for this service' : ''}
          {orders.length < total ? ` · showing first ${orders.length}` : ''}
        </div>
      )}
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : orders.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No {status} orders.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const pf = proofs[o.id];
            const flaggedCount = pf?.items.filter(it => it.flag && it.flag.status !== 'cleared').length || 0;
            const resubCount = pf?.items.filter(it => it.flag?.status === 'resubmitted').length || 0;
            return (
              <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] overflow-hidden">
                <button onClick={() => toggle(o.id)} className="w-full text-left p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Copyable value={o.id} className="text-[10px] font-mono text-violet-300">SABI #{o.id}</Copyable>
                      {o.isRefill && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">↻ REFILL{o.refillOf ? ` of #${o.refillOf}` : ''}</span>}
                    </div>
                    <div className="font-bold capitalize text-sm">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                    <span role="link" tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); window.open(o.targetUrl, '_blank', 'noopener,noreferrer'); } }}
                      className="block text-xs text-blue-400 hover:underline cursor-pointer truncate max-w-[240px]">{o.targetUrl} ↗</span>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {o.user?.email ? <Copyable value={o.user.email} className="text-slate-400">{o.user.email}</Copyable> : <span>—</span>}
                      <span>· {new Date(o.createdAt).toLocaleDateString()}</span>
                      <Copyable value={o.targetUrl} className="text-slate-500">copy link</Copyable>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{o.status}</span>
                    {resubCount > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">🔁 {resubCount} re-uploaded</span>
                      : flaggedCount > 0
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">⚠️ {flaggedCount} flagged</span>
                      : <span className="text-[10px] font-bold text-blue-400">{expanded === o.id ? 'Hide ▴' : 'Review proof ▾'}</span>}
                  </div>
                </button>
                {expanded === o.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.06]">
                    {/* Target link — open it in a new tab to confirm the proofs are for THIS account */}
                    <div className="mt-3 flex items-center gap-2 bg-blue-500/[0.07] border border-blue-500/20 rounded-lg px-3 py-2">
                      <span className="text-[11px] text-slate-400 shrink-0">🎯 Target:</span>
                      <a href={o.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline break-all flex-1 min-w-0">{o.targetUrl}</a>
                      <a href={o.targetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-300 hover:text-white shrink-0 whitespace-nowrap">Open ↗</a>
                      <Copyable value={o.targetUrl} className="text-[10px] text-slate-400 shrink-0">Copy</Copyable>
                    </div>
                    {/* Buyer's starting count + "before" screenshot (compulsory at order time). */}
                    {(o.startCount != null || o.startScreenshotUrl) && (
                      <div className="mt-3 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                        <span className="text-[11px] text-slate-400 shrink-0">📊 Start count:</span>
                        <span className="text-xs font-bold text-white">{o.startCount != null ? o.startCount.toLocaleString() : '—'}</span>
                        {o.startScreenshotUrl && <a href={o.startScreenshotUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-400 hover:underline ml-auto shrink-0">view before-shot ↗</a>}
                      </div>
                    )}
                    {!pf || pf.loading ? <p className="text-slate-500 text-sm py-4">Loading proofs…</p> : (
                      <>
                        <div className="flex items-center justify-between gap-2 my-3 flex-wrap">
                          <div className="text-[11px] text-slate-500">{pf.total} proof(s) · {pf.approved} approved{selCount(o.id) > 0 ? ` · ${selCount(o.id)} selected` : ''}</div>
                          {pf.items.length > 0 && (() => {
                            const selectable = pf.items.filter(it => !(it.flag && it.flag.status !== 'cleared')).map(it => it.id);
                            const allSel = selectable.length > 0 && selectable.every(id => selected[o.id]?.has(id));
                            return (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => allSel ? clearSel(o.id) : setAllSel(o.id, selectable)}
                                  className="px-2 py-1 rounded bg-white/10 text-slate-300 text-[10px] font-bold hover:bg-white/20">{allSel ? 'Unselect all' : 'Select all'}</button>
                                <button disabled={selCount(o.id) === 0 || !!proofBusy} onClick={() => bulkAct(o.id, 'approve')}
                                  className="px-2 py-1 rounded bg-emerald-600/80 text-white text-[10px] font-bold disabled:opacity-40">✓ Approve sel.</button>
                                <button disabled={selCount(o.id) === 0 || !!proofBusy} onClick={() => bulkAct(o.id, 'flag')}
                                  className="px-2 py-1 rounded bg-red-600/80 text-white text-[10px] font-bold disabled:opacity-40">⚠️ Flag sel.</button>
                              </div>
                            );
                          })()}
                        </div>
                        {pf.items.length === 0 ? <p className="text-slate-600 text-xs pb-2">No proof uploaded yet.</p> : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-1">
                            {[...pf.items].sort((a, b) => suspScore(b) - suspScore(a)).map(p => {
                              const fl = p.flag && p.flag.status !== 'cleared' ? p.flag : null;
                              const resub = fl?.status === 'resubmitted';
                              const badNums = numbersDown(p); // after ≤ before → no gain
                              const dupImg = !!p.duplicateImage; // same screenshot reused elsewhere
                              const noHandle = !!p.handleMissing; // OCR: @username not in the shot
                              const suspicious = badNums || dupImg || noHandle;
                              return (
                              <div key={p.id} className={`relative rounded-lg overflow-hidden bg-black/30 border ${selected[o.id]?.has(p.id) ? 'border-blue-500/70 ring-1 ring-blue-500/40' : fl ? (resub ? 'border-yellow-500/40' : 'border-red-500/40') : suspicious ? 'border-red-500/60 ring-1 ring-red-500/30' : viewed.has(p.id) ? 'border-white/[0.06] opacity-75' : 'border-white/[0.06]'}`}>
                                {!fl && (
                                  <label className="absolute top-1 left-1 z-10 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!selected[o.id]?.has(p.id)} onChange={() => toggleSel(o.id, p.id)}
                                      className="w-4 h-4 accent-blue-500" />
                                  </label>
                                )}
                                {viewed.has(p.id) && <div className="absolute top-1 right-1 z-10 text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-600/80 text-white">👁 viewed</div>}
                                {/* BEFORE → AFTER — tap either (or the card) to open the full detail view, NOT download */}
                                <button type="button" onClick={() => openDetail(o.id, p)} className="grid grid-cols-2 gap-px bg-white/[0.06] w-full">
                                  <div className="relative">
                                    <div className="absolute bottom-0.5 left-0.5 z-10 text-[7px] font-black px-1 rounded bg-black/75 text-slate-300">BEFORE</div>
                                    {isImg(p.beforeUrl)
                                      // eslint-disable-next-line @next/next/no-img-element
                                      ? <img src={p.beforeUrl!} alt="before" loading="lazy" className="w-full h-20 object-cover hover:opacity-90" />
                                      : <div className="flex items-center justify-center h-20 text-[9px] text-slate-600">{p.beforeUrl ? 'view' : '—'}</div>}
                                  </div>
                                  <div className="relative">
                                    <div className="absolute bottom-0.5 left-0.5 z-10 text-[7px] font-black px-1 rounded bg-black/75 text-emerald-300">AFTER</div>
                                    {isImg(p.proofUrl)
                                      // eslint-disable-next-line @next/next/no-img-element
                                      ? <img src={p.proofUrl!} alt="after" loading="lazy" className="w-full h-20 object-cover hover:opacity-90" />
                                      : <div className="flex items-center justify-center h-20 text-lg">{p.proofUrl ? '🔍' : '✅'}</div>}
                                  </div>
                                </button>
                                {/* The numbers the tasker reported — the quick coherence check for staff.
                                    When after ≤ before (no gain) we flag it red so staff catch it fast. */}
                                {(p.countBefore || p.countAfter) && (
                                  <div className={`px-1.5 py-1 text-center ${badNums ? 'text-red-300 bg-red-500/15' : 'text-white bg-blue-500/10'}`}>
                                    <div className="text-[8px] font-black tracking-widest opacity-70">COUNT (BEFORE → AFTER)</div>
                                    <div className="text-[11px] font-black">
                                      {p.countBefore ?? '?'} <span className={badNums ? 'text-red-400' : 'text-blue-300'}>→</span> {p.countAfter ?? '?'}
                                    </div>
                                    {badNums && <div className="text-[8.5px] font-bold text-red-400 mt-0.5">⚠️ NO GAIN — after ≤ before</div>}
                                  </div>
                                )}
                                {/* Auto-triage: this exact screenshot was reused on other proofs */}
                                {dupImg && (
                                  <div className="px-1.5 py-1 text-center bg-red-500/20">
                                    <div className="text-[9px] font-black text-red-300">🔁 DUPLICATE IMAGE{p.duplicateCount ? ` ×${p.duplicateCount}` : ''}</div>
                                    <div className="text-[8px] font-bold text-red-400">
                                      {p.duplicateCrossUser ? 'same shot used by other taskers — reuse ring' : 'same shot reused on another proof'}
                                    </div>
                                  </div>
                                )}
                                {/* Auto-triage: OCR couldn't find the tasker's handle in the screenshot */}
                                {noHandle && (
                                  <div className="px-1.5 py-1 text-center bg-amber-500/20">
                                    <div className="text-[9px] font-black text-amber-300">⚠️ @HANDLE NOT IN SHOT</div>
                                    <div className="text-[8px] font-bold text-amber-400/90">typed username isn&apos;t visible in the image — verify</div>
                                  </div>
                                )}
                                {/* Tasker trust — the reputation of the person behind this proof */}
                                {p.trustLevel && (
                                  <div className="px-1.5 pt-1 flex items-center gap-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${(TRUST_CHIP[p.trustLevel] || TRUST_CHIP.normal).cls}`}>
                                      {(TRUST_CHIP[p.trustLevel] || TRUST_CHIP.normal).label}
                                    </span>
                                    {typeof p.trustScore === 'number' && <span className="text-[8px] text-slate-500">{p.trustScore}/100</span>}
                                  </div>
                                )}
                                {/* The exact comment the tasker posted (comment tasks) — check it vs the shot */}
                                {p.commentUsed && (
                                  <div className="px-1.5 py-1 text-[9px]" style={{ color:'#93C5FD' }}>💬 <span className="italic">&ldquo;{p.commentUsed}&rdquo;</span></div>
                                )}
                                {/* The account the tasker used for the action */}
                                {p.accountUsername && <div className="px-1.5 pt-1 text-[9px] font-bold text-cyan-400/90 truncate">📱 {p.accountUsername}</div>}
                                {/* Raw proof text only when it carries extra info (e.g. a comment), not the count line */}
                                {p.proofText && !/before:/i.test(p.proofText)
                                  ? <div className="px-1.5 py-1 text-[9px] text-slate-400 truncate">{p.proofText}</div>
                                  : (!p.countBefore && !p.countAfter && <div className="px-1.5 py-1 text-[9px] text-slate-400 truncate">{p.status}</div>)}
                                {/* Tasker identity — spot two screenshots from the SAME person (double account) */}
                                {(p.username || p.bankName) && (
                                  <div className="px-1.5 pb-1 text-[8.5px] leading-tight text-slate-500">
                                    {p.username && <div className="truncate">👤 {p.username}</div>}
                                    {(p.bankName || p.accountName) && <div className="truncate text-amber-400/80">🏦 {[p.bankName, p.accountName].filter(Boolean).join(' · ')}</div>}
                                  </div>
                                )}
                                {p.staffApproved && !fl && <div className="px-1.5 text-[9px] font-bold text-emerald-400">✓ approved</div>}
                                {/* Owner-only: which staff member worked this proof */}
                                {owner && (p.approvedBy || p.flaggedBy) && (
                                  <div className="px-1.5 text-[8px] font-bold" style={{ color:'#a78bfa' }}>
                                    👁️ {fl ? `flagged by ${p.flaggedBy || '—'}` : `approved by ${p.approvedBy || '—'}`}
                                  </div>
                                )}
                                {fl && <div className={`px-1.5 text-[9px] font-bold ${resub ? 'text-yellow-300' : 'text-red-300'}`}>{resub ? '🔁 re-uploaded' : '⚠️ flagged'}{fl.reason ? ` · ${fl.reason}` : ''}</div>}
                                <div className="p-1.5 flex gap-1">
                                  {!fl && !p.staffApproved && (
                                    <button onClick={() => approveProof(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50">✓ Approve</button>
                                  )}
                                  {!fl && (
                                    <button onClick={() => openFlag(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag</button>
                                  )}
                                  {fl && (
                                    <button onClick={() => doFlag(o.id, p.id, 'clear')} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50">✅ {resub ? 'Re-verify' : 'Clear'}</button>
                                  )}
                                  {resub && (
                                    <button onClick={() => openFlag(o.id, p.id)} disabled={proofBusy === p.id}
                                      className="flex-1 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold disabled:opacity-50">⚠️ Flag again</button>
                                  )}
                                </div>
                              </div>
                            );})}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.05]">
                          <button onClick={() => loadProofs(o.id)} className="text-[10px] text-blue-400 hover:underline">↻ Refresh proofs</button>
                          {/* Done reviewing this order → moves it to Checked Orders, shrinking the queue */}
                          <button onClick={() => markChecked(o.id)} disabled={checking === o.id}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black disabled:opacity-50">
                            {checking === o.id ? 'Saving…' : '✓ Mark order checked'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Proof detail — the "inner page" so a clamped card isn't confusing to work on */}
      {detailProof && (() => {
        const { orderId, p } = detailProof;
        const fl = p.flag && p.flag.status !== 'cleared' ? p.flag : null;
        const bad = numbersDown(p);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" onClick={() => setDetailProof(null)}>
            <div className="bg-[#0B0F17] border border-white/10 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0B0F17]">
                <div className="text-sm font-black text-white">Proof detail</div>
                <button onClick={() => setDetailProof(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {([{ lbl: 'BEFORE', url: p.beforeUrl }, { lbl: 'AFTER', url: p.proofUrl }]).map(({ lbl, url }) => (
                    <div key={lbl}>
                      <div className="text-[9px] font-black text-slate-400 mb-1">{lbl}</div>
                      {isImg(url)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <a href={url!} target="_blank" rel="noopener noreferrer"><img src={url!} alt={lbl} className="w-full rounded-lg border border-white/10" /></a>
                        : url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">open ↗</a>
                          : <div className="text-xs text-slate-600">—</div>}
                    </div>
                  ))}
                </div>
                {(p.countBefore || p.countAfter) && (
                  <div className={`rounded-lg px-3 py-2 text-center font-black ${bad ? 'text-red-300 bg-red-500/15' : 'text-white bg-blue-500/10'}`}>
                    COUNT (BEFORE → AFTER): {p.countBefore ?? '?'} → {p.countAfter ?? '?'}{bad && <div className="text-[10px] text-red-400 mt-0.5">⚠️ NO GAIN — after ≤ before</div>}
                  </div>
                )}
                {p.commentUsed && <div className="text-xs text-blue-300 bg-white/[0.03] rounded-lg px-3 py-2">💬 &ldquo;{p.commentUsed}&rdquo;</div>}
                <div className="text-xs text-slate-300 space-y-1">
                  {p.accountUsername && <div>📱 Account used: <b>{p.accountUsername}</b></div>}
                  {p.username && <div>👤 Tasker: <b>{p.username}</b></div>}
                  {(p.bankName || p.accountName) && <div className="text-amber-400/90">🏦 {[p.bankName, p.accountName].filter(Boolean).join(' · ')}</div>}
                  {p.trustLevel && <div>Trust: <b>{p.trustLevel}</b> ({p.trustScore}/100)</div>}
                  {p.duplicateImage && <div className="text-red-300">🔁 Duplicate image{p.duplicateCrossUser ? ' — reuse ring' : ''}</div>}
                  {p.handleMissing && <div className="text-amber-300">⚠️ Handle not found in shot (OCR)</div>}
                  {fl && <div className="text-red-300">⚠️ Flagged{fl.reason ? `: ${fl.reason}` : ''}</div>}
                </div>
                <div className="flex gap-2 pt-1">
                  {!fl && !p.staffApproved && (
                    <button onClick={() => { approveProof(orderId, p.id); setDetailProof(null); }} disabled={proofBusy === p.id}
                      className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50">✓ Approve</button>
                  )}
                  {!fl && (
                    <button onClick={() => { setDetailProof(null); openFlag(orderId, p.id); }} disabled={proofBusy === p.id}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-50">⚠️ Flag</button>
                  )}
                  {fl && (
                    <button onClick={() => { doFlag(orderId, p.id, 'clear'); setDetailProof(null); }} disabled={proofBusy === p.id}
                      className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50">✅ Clear</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Flag-reason picker */}
      {flagTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setFlagTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#0b0f1a] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-black text-white mb-1">Why are you flagging this proof?</h3>
            <p className="text-xs text-slate-400 mb-3">The tasker sees this and must re-upload within 12h. Pick all that apply, and/or add a note.</p>
            <div className="space-y-1.5 mb-3 max-h-[42vh] overflow-y-auto">
              {FLAG_REASONS.map(r => {
                const on = flagPresets.includes(r);
                return (
                  <button key={r} type="button"
                    onClick={() => setFlagPresets(prev => on ? prev.filter(x => x !== r) : [...prev, r])}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition border ${on ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:border-white/20'}`}>
                    {on ? '☑ ' : '☐ '}{r}
                  </button>
                );
              })}
            </div>
            <textarea value={flagNote} onChange={e => setFlagNote(e.target.value.slice(0, 280))} rows={2}
              placeholder="Add a specific note (or type your own reason)…"
              className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/40 resize-none mb-3" />

            {/* Help the tasker fix it — how-to + a watermarked correct-example image */}
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 mb-3">
              <div className="text-[11px] font-bold text-emerald-300 mb-1.5">✅ Help them fix it (optional — sent to the tasker)</div>
              <textarea value={flagFixHint} onChange={e => setFlagFixHint(e.target.value.slice(0, 500))} rows={2}
                placeholder="How to do it correctly, step by step…"
                className="w-full bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/40 resize-none mb-2" />
              {flagExampleUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagExampleUrl} alt="example" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                  <span className="text-[11px] text-emerald-300">✅ Watermarked example attached</span>
                  <button onClick={() => setFlagExampleUrl('')} className="text-[11px] text-red-300 hover:underline ml-auto">remove</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-white/15 px-3 py-2 text-[11px] text-slate-400 hover:border-emerald-500/40">
                  {flagExampleBusy ? 'Uploading…' : '📎 Upload a correct-example screenshot (auto-watermarked)'}
                  <input type="file" accept="image/*" className="hidden" disabled={flagExampleBusy}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadFlagExample(f); }} />
                </label>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setFlagTarget(null)} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-slate-300 hover:bg-white/20">Cancel</button>
              <button onClick={submitFlag} disabled={flagExampleBusy} className="px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-40">Flag proof</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Re-uploads (flagged → resubmitted, awaiting re-review) ─────────────────────
function ReuploadsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    af('/api/sabi/admin/resubmitted').then(r => (r.ok ? r.json() : null))
      .then(d => setItems(d?.items || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (completionId: string, action: 'clear' | 'flag', reason = '') => {
    setBusy(completionId); setMsg('');
    try {
      const res = await af('/api/sabi/admin/flag-proof', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action, reason }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.success) { setItems(prev => prev.filter(i => i.completionId !== completionId)); setMsg(action === 'clear' ? 'Approved.' : 'Flagged again — tasker must re-upload.'); }
      else setMsg(d?.error || 'Action failed');
    } finally { setBusy(null); }
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
        🔁 Proofs taskers RE-UPLOADED after you flagged them — review each one here as it comes. <b className="text-emerald-300">✅ Re-verify</b> if it&apos;s now correct, or <b className="text-red-300">⚠️ Flag again</b> if still wrong. They stay out of the main &quot;Orders &amp; Proofs&quot; list so nothing gets buried.
      </p>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : items.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No re-uploads waiting. ✅</p>
      ) : (
        <div className="space-y-2.5">
          {msg && <p className="text-[11px] font-bold text-emerald-300">{msg}</p>}
          {items.map(it => (
            <div key={it.completionId} className="rounded-xl bg-white/[0.025] border border-yellow-500/30 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {it.sabiOrderId && <div className="text-[10px] font-mono text-violet-300">SABI #{it.sabiOrderId}</div>}
                  <div className="text-sm font-bold text-white truncate mt-0.5">{fmtSvc(it.campaignTitle) || 'Re-uploaded proof'}</div>
                  {/* Target link — staff cross-check the re-upload against THIS account */}
                  {it.targetUrl && (
                    <div className="flex items-center gap-2 mt-1 bg-blue-500/[0.07] border border-blue-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] text-slate-400 shrink-0">🎯</span>
                      <a href={it.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline break-all flex-1 min-w-0">{it.targetUrl}</a>
                      <a href={it.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-300 shrink-0">Open ↗</a>
                    </div>
                  )}
                  {it.reason && <p className="text-[11px] mt-1 text-red-300/90">Original flag: {it.reason}</p>}
                  <div className="text-[10px] text-slate-600 mt-1">re-uploaded {it.reuploadedAt ? new Date(it.reuploadedAt).toLocaleString() : '—'}</div>
                </div>
                {it.newProofUrl && (isImg(it.newProofUrl)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <a href={it.newProofUrl} target="_blank" rel="noreferrer" className="shrink-0"><img src={it.newProofUrl} alt="re-upload" loading="lazy" className="w-20 h-20 object-cover rounded-lg" /></a>
                  : <a href={it.newProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline shrink-0">view ↗</a>)}
              </div>
              <div className="flex gap-2 mt-2.5">
                <button disabled={busy === it.completionId} onClick={() => act(it.completionId, 'clear')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">✅ Re-verify (approve)</button>
                <button disabled={busy === it.completionId} onClick={() => { const r = prompt('Why is it still wrong? (tasker sees this)'); if (r) act(it.completionId, 'flag', r); }} className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs font-bold disabled:opacity-50">⚠️ Flag again</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Checked Orders (already reviewed) ──────────────────────────────────────────
// ─── Tasker Review — per-tasker 20% audit. INTERNAL: never expose the mechanics to
// taskers. Flag bad proofs; the system applies the outcome + gates their withdrawals.
function TaskerReviewTab() {
  const [queue, setQueue] = useState<any[] | null>(null);
  const [suspended, setSuspended] = useState<any[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [active, setActive] = useState<any>(null);         // { userId, username, ... }
  const [sample, setSample] = useState<any>(null);          // { poolIds, poolSize, threshold, sample[] }
  const [loadingS, setLoadingS] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const loadQueue = useCallback(() => {
    setLoadingQ(true);
    af('/api/sabi/admin/tasker-review').then(r => (r.ok ? r.json() : null))
      .then(d => { setQueue(d?.queue || []); setSuspended(d?.suspended || []); }).catch(() => setQueue([])).finally(() => setLoadingQ(false));
  }, []);

  const resolve = async (userId: string, action: 'forgive' | 'unsuspend', name: string) => {
    const msgTxt = action === 'forgive'
      ? `Forgive ${name}? Un-suspends and RESTORES their points (use only if the flags were wrong).`
      : `Reinstate ${name} as a FRESH tasker? They keep the account but LOSE all old tasks and points.`;
    if (!confirm(msgTxt)) return;
    try {
      const res = await af('/api/sabi/admin/tasker-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId }) });
      if (res.ok) { setMsg(`${name}: ${action === 'forgive' ? 'forgiven & restored' : 'reinstated fresh'}`); loadQueue(); }
    } catch {}
  };
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const openTasker = async (t: any) => {
    setActive(t); setSample(null); setFlagged(new Set()); setMsg(''); setLoadingS(true);
    try {
      const r = await af(`/api/sabi/admin/tasker-review?userId=${encodeURIComponent(t.userId)}`);
      const d = r.ok ? await r.json() : null;
      setSample(d || null);
    } catch { setSample(null); } finally { setLoadingS(false); }
  };

  const toggle = (id: string) => setFlagged(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const apply = async () => {
    if (!active || !sample) return;
    const T = sample.threshold;
    const n = flagged.size;
    const verdict = n === 0 ? 'clean → approved (48h)' : n < T ? `${n} flag(s) → approved, must redo (24h)` : n === T ? `${n} flags → held until fixed` : `${n} flags → SUSPENDED`;
    if (!confirm(`Apply review for ${active.username || active.userId}?\n\nPool ${sample.poolSize} · threshold ${T} · flagged ${n}\nOutcome: ${verdict}\n\nFlagged tasks lose their points permanently.`)) return;
    setBusy(true); setMsg('');
    try {
      const res = await af('/api/sabi/admin/tasker-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', userId: active.userId, poolIds: sample.poolIds, flaggedIds: Array.from(flagged) }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setMsg(`✅ ${active.username || 'Tasker'}: ${d.status}${d.status === 'suspended' ? ' (removed from withdrawal list)' : ''} · ${d.flags} flagged`);
        setActive(null); setSample(null); loadQueue();
      } else setMsg(d.error || 'Apply failed.');
    } catch { setMsg('Network error.'); } finally { setBusy(false); }
  };

  if (active) {
    const T = sample?.threshold ?? 2;
    return (
      <div>
        <button onClick={() => { setActive(null); setSample(null); }} className="text-xs text-slate-400 hover:text-white mb-3">← Back to queue</button>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 mb-3">
          <div className="font-bold">{active.username || 'Tasker'} <span className="text-slate-500 text-xs">{active.email || ''}</span></div>
          <div className="text-xs text-slate-400 mt-1">Pool {sample?.poolSize ?? '…'} new tasks · reviewing a random {sample?.sample?.length ?? 0} · fix/suspend threshold <b>{T}</b></div>
          <p className="text-[11px] text-amber-300/80 mt-1">Flag any proof that&apos;s a duplicate, wrong account, or didn&apos;t do the task. Flagged tasks lose their points permanently.</p>
        </div>
        {loadingS ? <p className="text-slate-500 py-8 text-center">Loading sample…</p> : !sample?.sample?.length ? (
          <p className="text-slate-500 py-8 text-center">No new tasks to review for this tasker.</p>
        ) : (
          <>
            <div className="space-y-2">
              {sample.sample.map((p: any) => {
                const on = flagged.has(p.completionId);
                return (
                  <div key={p.completionId} className={`rounded-xl border p-3 ${on ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold capitalize truncate">{p.campaignTitle || 'task'}</span>
                      <span className="text-[10px] text-cyan-400">+{p.pointsEarned} pts</span>
                      {p.duplicateImage && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">🔁 DUPLICATE IMAGE</span>}
                      {p.handleMissing && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">🕵 HANDLE NOT FOUND</span>}
                    </div>
                    {p.targetUrl && <a href={p.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline break-all">{p.targetUrl}</a>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-slate-400">
                      {p.accountUsername && <span>handle: <span className="text-slate-200">{p.accountUsername}</span></span>}
                      {(p.countBefore || p.countAfter) && <span>count: <span className="text-slate-200">{p.countBefore ?? '?'} → {p.countAfter ?? '?'}</span></span>}
                    </div>
                    {p.commentUsed && <div className="text-[10px] text-slate-400 mt-0.5">comment: <span className="text-slate-200">“{p.commentUsed}”</span></div>}
                    {/* Before / After proof screenshots */}
                    <div className="flex gap-2 mt-2">
                      {[{ u: p.beforeUrl, l: 'BEFORE' }, { u: p.afterUrl, l: 'AFTER' }].map(({ u, l }) => (
                        <div key={l} className="flex-1 min-w-0">
                          <div className="text-[9px] font-bold text-slate-500 mb-0.5">{l}</div>
                          {isImg(u)
                            ? <a href={u!} target="_blank" rel="noopener noreferrer"><img src={u!} alt={l} loading="lazy" className="w-full h-28 object-cover rounded-lg border border-white/10 hover:border-blue-400/50" /></a>
                            : u ? <a href={u} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline">open ↗</a>
                            : <div className="h-28 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-[10px] text-slate-600">none</div>}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => toggle(p.completionId)}
                      className={`mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold ${on ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                      {on ? '⚑ Flagged — points will be removed' : 'Flag this proof'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="sticky bottom-0 mt-3 py-3 bg-[#0A0D14]/90 backdrop-blur flex items-center gap-3">
              <span className="text-xs text-slate-400"><b className="text-red-300">{flagged.size}</b> flagged {flagged.size >= T && <span className="text-red-400 font-bold">· {flagged.size > T ? 'SUSPEND' : 'HOLD'}</span>}</span>
              <button onClick={apply} disabled={busy} className="ml-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold disabled:opacity-40">
                {busy ? 'Applying…' : 'Apply review'}
              </button>
            </div>
          </>
        )}
        {msg && <p className="text-sm text-slate-300 mt-2">{msg}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        🕵️ Taskers with new work awaiting audit. Open one, review the random 20% sample, flag the bad proofs — the system gates their withdrawals automatically. <b>Internal only.</b>
      </p>
      {msg && <p className="text-sm text-emerald-300 mb-2">{msg}</p>}
      {loadingQ ? <p className="text-slate-500 py-10 text-center">Loading queue…</p>
        : (queue?.length ?? 0) === 0 ? <p className="text-slate-500 py-10 text-center">No taskers awaiting review. ✅</p>
        : (
        <div className="space-y-2">
          {queue!.map(t => (
            <button key={t.userId} onClick={() => openTasker(t)}
              className="w-full text-left rounded-xl bg-white/[0.025] border border-white/[0.07] p-3 hover:border-blue-500/40 transition flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{t.username || 'Tasker'} <span className="text-slate-500 text-xs">{t.email || ''}</span></div>
                <div className="text-[10px] text-slate-500">
                  {t.poolSize} new task{t.poolSize === 1 ? '' : 's'} · review {Math.min(t.poolSize, Math.max(2, Math.ceil(t.poolSize * 0.2)))} · threshold {t.threshold}
                  {t.status && t.status !== 'never_reviewed' ? ` · was ${t.status}${t.redoOwed ? ` · owes ${t.redoOwed} redo` : ''}` : ' · never reviewed'}
                </div>
              </div>
              <span className="text-xs text-blue-400 shrink-0">Review →</span>
            </button>
          ))}
        </div>
      )}

      {suspended.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] font-bold text-red-300 mb-2">⛔ Suspended by review · {suspended.length} (removed from withdrawal list)</div>
          <div className="space-y-2">
            {suspended.map(s => (
              <div key={s.userId} className="rounded-xl bg-red-500/[0.05] border border-red-500/20 p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{s.username || 'Tasker'} <span className="text-slate-500 text-xs">{s.email || ''}</span></div>
                  <div className="text-[10px] text-slate-500">{s.flagsLast} flags{s.suspendedAt ? ` · ${new Date(s.suspendedAt).toLocaleDateString()}` : ''}</div>
                </div>
                <button onClick={() => resolve(s.userId, 'unsuspend', s.username || 'tasker')} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-bold hover:bg-white/20 shrink-0">Reinstate fresh</button>
                <button onClick={() => resolve(s.userId, 'forgive', s.username || 'tasker')} className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 shrink-0">Forgive & restore</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Find Orders — one search across BOTH lanes (to-review + checked), showing a
// user's FULL history: paid orders AND refills. Search by username, email, or id.
function FindOrdersTab() {
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    const q = search.trim();
    if (!q) { setOrders(null); return; }
    setLoading(true);
    try {
      const r = await af(`/api/sabi/admin/staff-orders?checked=all&limit=200&search=${encodeURIComponent(q)}`);
      const d = r.ok ? await r.json() : null;
      setOrders(d?.orders || []);
      setTotal(d?.total ?? (d?.orders?.length || 0));
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [search]);

  const refills = (orders || []).filter(o => o.isRefill).length;

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        🔍 Search a customer&apos;s <b>username, email, or order id</b> to see their <b>full order history</b> — paid orders and refills, whether or not they&apos;ve been checked.
      </p>
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Username, email, or order id…"
          className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none" />
        <button onClick={run} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">Search</button>
        {orders !== null && <button onClick={() => { setSearch(''); setOrders(null); }} className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 text-sm">Clear</button>}
      </div>

      {loading ? <p className="text-slate-500 py-10 text-center">Searching…</p>
        : orders === null ? <p className="text-slate-500 py-10 text-center">Type a username, email, or order id and press Search.</p>
        : orders.length === 0 ? <p className="text-slate-500 py-10 text-center">No orders found for “{search.trim()}”.</p>
        : (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-400 mb-1">{total.toLocaleString()} order{total === 1 ? '' : 's'}{refills > 0 ? ` · ${refills} refill${refills === 1 ? '' : 's'}` : ''}</div>
          {orders.map(o => (
            <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-violet-300">SABI #{o.id}</span>
                {o.isRefill && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">↻ REFILL{o.refillOf ? ` of #${o.refillOf}` : ''}</span>}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${o.status === 'failed' ? 'bg-red-500/15 text-red-300' : o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : o.status === 'cancelled' ? 'bg-white/10 text-slate-400' : 'bg-blue-500/15 text-blue-300'}`}>{o.status}</span>
                {o.staffChecked
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300/80">✓ checked</span>
                  : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/80">🕓 to review</span>}
              </div>
              <div className="text-sm font-bold capitalize truncate mt-1">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
              <div className="text-[10px] text-slate-500 truncate">
                {o.user?.name || o.user?.businessName || '—'}{o.user?.email ? ` · ${o.user.email}` : ''} · {new Date(o.createdAt).toLocaleDateString()}
              </div>
              {o.targetUrl && <a href={o.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline break-all">{o.targetUrl}</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckedOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const s = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    af(`/api/sabi/admin/staff-orders?checked=1&limit=100${s}`).then(r => (r.ok ? r.json() : null))
      .then(d => setOrders(d?.orders || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const undo = async (orderId: string) => {
    setBusy(orderId);
    try {
      const res = await af('/api/sabi/admin/order-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, checked: false }) });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== orderId));
    } finally { setBusy(null); }
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✅ Orders you&apos;ve marked fully checked. Use &quot;Re-open&quot; to send one back to the to-review list.</p>
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order id / email…" className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none" />
      </div>
      {loading ? <p className="text-slate-500 py-10 text-center">Loading…</p> : orders.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">No checked orders yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-violet-300">SABI #{o.id}</span>
                  {o.isRefill && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">↻ REFILL{o.refillOf ? ` of #${o.refillOf}` : ''}</span>}
                </div>
                <div className="text-sm font-bold capitalize truncate">{fmtSvc(o.serviceType)} · <span className="text-cyan-400">{(o.completedQuantity ?? 0).toLocaleString()}/{o.quantity.toLocaleString()}</span></div>
                <div className="text-[10px] text-slate-500">{o.user?.email || '—'} · checked {o.staffCheckedAt ? new Date(o.staffCheckedAt).toLocaleDateString() : ''}{o.staffCheckedBy ? ` by ${o.staffCheckedBy}` : ''}</div>
              </div>
              <button disabled={busy === o.id} onClick={() => undo(o.id)} className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20 disabled:opacity-50 shrink-0">↩ Re-open</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Refunds (customer complaints) ──────────────────────────────────────────────
function StaffRefundsTab() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => { af('/api/sabi/admin/refunds').then(r => (r.ok ? r.json() : null)).then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  const runSearch = async () => {
    if (!search.trim()) { setResults(null); return; }
    const r = await af(`/api/sabi/admin/refunds?search=${encodeURIComponent(search.trim())}`);
    const j = await r.json().catch(() => ({}));
    setResults(j.results || []);
  };
  const card = (o: any) => (
    <div key={o.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-violet-300">SABI #{o.id}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${o.status === 'failed' ? 'bg-red-500/15 text-red-300' : o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>{o.status}</span>
        <span className="text-slate-300 capitalize">{fmtSvc(o.serviceType)}</span>
        <span className="text-slate-500">· {o.delivered.toLocaleString()}/{o.quantity.toLocaleString()} · ₦{o.totalNaira.toLocaleString()}</span>
      </div>
      {(o.email || o.name) && <div className="text-[10px] text-slate-500 mt-1">{o.name || ''} {o.email ? `· ${o.email}` : ''}</div>}
      {o.refundReason && <p className="text-[11px] text-amber-200/90 mt-1">{o.refundReason}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">When a customer complains about a refund, search their order id or email to see its exact status &amp; reason.</p>
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder="Order id or customer email…" className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none" />
        <button onClick={runSearch} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">Search</button>
        {results !== null && <button onClick={() => { setSearch(''); setResults(null); }} className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 text-sm">Clear</button>}
      </div>
      {results !== null ? (
        <div className="space-y-2">{results.length === 0 ? <p className="text-sm text-slate-500">No matching orders.</p> : results.map(card)}</div>
      ) : loading ? <p className="text-slate-500 py-6 text-center">Loading…</p> : (
        <>
          <div>
            <div className="text-[11px] font-bold text-amber-300 mb-2">⏳ About to partial-refund (stalled past 72h) · {d?.pending?.length ?? 0}</div>
            <div className="space-y-2">{(d?.pending?.length ?? 0) === 0 ? <p className="text-xs text-slate-500">Nothing stalled. ✅</p> : d.pending.map(card)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 mb-2">↩️ Recent auto-refunds · {d?.recent?.length ?? 0}</div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">{(d?.recent?.length ?? 0) === 0 ? <p className="text-xs text-slate-500">No refunds. ✅</p> : d.recent.map(card)}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Refills ─────────────────────────────────────────────────────────────────
function RefillsTab() {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [qty, setQty] = useState<Record<string, string>>({}); // staff-decided top-up

  const load = () => {
    setLoading(true);
    af('/api/sabi/admin/refills?status=pending')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { const list = d?.refills || []; setRefills(list); setQty(Object.fromEntries(list.map((r: Refill) => [r.id, String(r.refillQuantity)]))); })
      .catch(() => setRefills([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    // Approving uses the EXACT quantity the staff typed — nothing else gets topped up.
    const q = Math.floor(Number(qty[id]) || 0);
    if (action === 'approve' && q < 1) { alert('Enter the refill quantity to approve.'); return; }
    setBusy(id);
    try {
      const res = await af('/api/sabi/admin/refills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: notes[id] || '', quantity: q }),
      });
      if (res.ok) setRefills(prev => prev.filter(r => r.id !== id));
    } finally { setBusy(null); }
  };

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  return (
    <div className="space-y-3">
      <ManualRefillTool />
      {refills.length === 0 ? <p className="text-slate-500 py-8 text-center">No pending refill requests.</p> : refills.map(r => (
        <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
          <div className="text-[10px] font-mono text-violet-300">SABI #{r.orderId}</div>
          <div className="font-bold capitalize text-sm mt-0.5">{fmtSvc(r.serviceType)} · <span className="text-cyan-400">buyer asked {r.refillQuantity.toLocaleString()}</span></div>
          <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{r.targetUrl} ↗</a>
          <div className="text-[11px] text-slate-500 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>

          {/* Original-order baseline so staff can size the top-up correctly */}
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { l: 'Start count', v: r.startCount != null ? r.startCount.toLocaleString() : '—' },
              { l: 'Bought', v: r.originalQuantity != null ? r.originalQuantity.toLocaleString() : '—' },
              { l: 'Est. final', v: r.estimatedCount != null ? r.estimatedCount.toLocaleString() : '—' },
              { l: 'Delivered', v: r.completedQuantity != null ? r.completedQuantity.toLocaleString() : '—' },
            ].map(s => (
              <div key={s.l} className="rounded-lg bg-black/30 px-2.5 py-1.5">
                <div className="text-[9px] text-slate-500 uppercase">{s.l}</div>
                <div className="text-sm font-bold text-white">{s.v}</div>
              </div>
            ))}
          </div>
          {r.startScreenshotUrl && <a href={r.startScreenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] font-bold text-blue-400 hover:underline mt-1.5">📸 view buyer&apos;s before-shot ↗</a>}
          {r.reason && <div className="text-sm text-slate-300 mt-2 bg-black/30 rounded-lg p-2">“{r.reason}”</div>}

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-400 shrink-0">Refill to approve:</label>
              <input type="number" min={1} value={qty[r.id] ?? ''} onChange={e => setQty(p => ({ ...p, [r.id]: e.target.value }))}
                className="w-28 bg-[#0F1420] border border-emerald-500/30 rounded-lg px-3 py-2 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-500/60" />
              <span className="text-[10px] text-slate-500">only this exact amount is topped up</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                placeholder="Optional note to buyer…"
                className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
              <div className="flex gap-2">
                <button onClick={() => act(r.id, 'approve')} disabled={busy === r.id} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Approve {qty[r.id] ? Number(qty[r.id]).toLocaleString() : ''}</button>
                <button onClick={() => act(r.id, 'reject')} disabled={busy === r.id} className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-sm disabled:opacity-50">Reject</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Requests ─────────────────────────────────────────────────────────
const REQ_STATUSES = ['new', 'reviewing', 'contacted', 'quoted', 'active', 'completed', 'rejected'];
function RequestsTab() {
  const [reqs, setReqs] = useState<CustomReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true); setErr('');
    af('/api/sabi/admin/custom-requests?limit=50')
      .then(async r => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => {
        if (!ok || (d && d.success === false)) { setErr(d?.error || 'Could not load requests. Try again.'); setReqs([]); return; }
        setReqs(d?.requests || []);
      })
      .catch(() => setErr('Network error loading requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: { status?: string; adminNotes?: string }) => {
    setBusy(id);
    try {
      const res = await af('/api/sabi/admin/custom-requests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) load();
    } finally { setBusy(null); }
  };

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  if (err) return (
    <div className="py-10 text-center">
      <p className="text-red-300 text-sm mb-3">⚠️ {err}</p>
      <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white hover:bg-white/20">Retry</button>
    </div>
  );
  if (reqs.length === 0) return <p className="text-slate-500 py-10 text-center">No requests.</p>;
  return (
    <div className="space-y-3">
      {reqs.map(r => (
        <div key={r.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold capitalize text-sm">{fmtSvc(r.category)}{r.targetPlatform ? ` · ${r.targetPlatform}` : ''}{r.quantity ? ` · ${r.quantity.toLocaleString()}` : ''}</div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {r.name} · <a href={`mailto:${r.email}`} className="text-blue-400 hover:underline">{r.email}</a>
                {r.whatsapp && <> · <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">WhatsApp</a></>}
              </div>
              {r.targetUrl && <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline break-all">{r.targetUrl}</a>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0 capitalize">{r.status}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REQ_STATUSES.map(s => (
              <button key={s} onClick={() => update(r.id, { status: s })} disabled={busy === r.id || r.status === s}
                className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition disabled:opacity-40 ${r.status === s ? 'bg-blue-600 text-white' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}>{s}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
              placeholder="Internal note…"
              className="flex-1 bg-[#0F1420] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40" />
            <button onClick={() => update(r.id, { adminNotes: notes[r.id] || '' })} disabled={busy === r.id || !notes[r.id]}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm disabled:opacity-40">Save note</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Partnership / Reseller Requests (read-only for staff) ───────────────────
interface Partnership {
  id: string; brandName?: string | null; domain?: string | null;
  contactPhone?: string | null; notes?: string | null;
  status: string; paidKobo?: number | null; createdAt: string;
}
function PartnershipsTab() {
  const [items, setItems] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true); setErr('');
    af('/api/sabi/admin/partnerships')
      .then(async r => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => {
        if (!ok) { setErr('Could not load partnership requests.'); setItems([]); return; }
        setItems(d?.partnerships || []);
      })
      .catch(() => setErr('Network error loading partnership requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const statusColor = (s: string) =>
    s === 'live' ? 'bg-emerald-500/20 text-emerald-300'
    : s === 'cancelled' ? 'bg-red-500/20 text-red-300'
    : 'bg-yellow-500/15 text-yellow-300';

  if (loading) return <p className="text-slate-500 py-10 text-center">Loading…</p>;
  if (err) return (
    <div className="py-10 text-center">
      <p className="text-red-300 text-sm mb-3">⚠️ {err}</p>
      <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 text-white hover:bg-white/20">Retry</button>
    </div>
  );
  if (items.length === 0) return <p className="text-slate-500 py-10 text-center">No partnership requests.</p>;
  return (
    <div>
      <p className="text-xs text-slate-400 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        🤝 Reseller &amp; partnership requests. View-only — the owner approves and changes status from the admin dashboard.
      </p>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.07]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-sm">{p.brandName || 'Unnamed brand'}</div>
                {p.domain && <a href={/^https?:\/\//i.test(p.domain) ? p.domain : `https://${p.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">{p.domain}</a>}
                <div className="text-[11px] text-slate-500 mt-1">
                  {p.contactPhone && <a href={`https://wa.me/${p.contactPhone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{p.contactPhone}</a>}
                  {p.contactPhone && ' · '}{new Date(p.createdAt).toLocaleDateString()}
                  {typeof p.paidKobo === 'number' && p.paidKobo > 0 && <> · <span className="text-slate-300">₦{(p.paidKobo / 100).toLocaleString()}</span></>}
                </div>
                {p.notes && <div className="text-xs text-slate-300 mt-2 bg-black/30 rounded-lg p-2">{p.notes}</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${statusColor(p.status)}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
