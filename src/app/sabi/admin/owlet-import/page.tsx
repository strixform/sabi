'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

/**
 * Browser importer for the Owlet promo allowlist. Auth = your admin SESSION (no
 * secret needed — the endpoint accepts checkSabiAdmin via cookie). Reads the CSV
 * client-side, extracts every email, de-dupes, and POSTs in chunks.
 */
const CHUNK = 15000;

export default function OwletImportPage() {
  const [stats, setStats] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [diag, setDiag] = useState<any>(null);
  const [gLog, setGLog] = useState<string[]>([]);
  const [gBusy, setGBusy] = useState(false);

  async function check() {
    setDiag(null); setGBusy(true);
    try { const d = await (await fetch(`/api/sabi/admin/owlet-grant?email=${encodeURIComponent(email.trim())}`, { credentials: 'include' })).json(); setDiag(d); } catch {}
    setGBusy(false);
  }
  async function grantOne() {
    setGBusy(true);
    try { const d = await (await fetch('/api/sabi/admin/owlet-grant', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) })).json(); setDiag({ ...(d.diag || {}), reason: d.note, justGranted: d.granted > 0 }); if (d.granted > 0) loadStats(); } catch {}
    setGBusy(false);
  }
  async function sweep() {
    setGBusy(true); setGLog(['Starting retroactive sweep…']); let cursor: string | undefined; let total = 0, rounds = 0;
    try {
      while (rounds < 300) {
        const d = await (await fetch('/api/sabi/admin/owlet-grant', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sweep: true, cursor, limit: 300 }) })).json();
        if (!d.success) { setGLog(l => [...l, 'Stopped: ' + (d.error || 'error')]); break; }
        total += d.granted || 0; rounds++;
        setGLog(l => [...l.slice(-30), `Batch ${rounds}: scanned ${d.scanned}, granted ${d.granted} (total ${total})`]);
        if (!d.nextCursor) { setGLog(l => [...l, `✅ Sweep complete — ${total} users credited ₦2,000.`]); break; }
        cursor = d.nextCursor;
      }
      loadStats();
    } catch (e: any) { setGLog(l => [...l, 'Error: ' + (e?.message || e)]); }
    setGBusy(false);
  }

  const loadStats = () => fetch('/api/sabi/admin/owlet-emails', { credentials: 'include' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(setStats).catch(() => setErr('Not authorized — log in as the SABI admin first.'));
  useEffect(() => { loadStats(); }, []);

  const say = (m: string) => setLog(l => [...l.slice(-40), m]);

  const onFile = async (file: File) => {
    setBusy(true); setErr(''); setLog([]);
    try {
      say(`Reading ${file.name} (${(file.size / 1e6).toFixed(1)} MB)…`);
      const text = await file.text();
      const emails = Array.from(new Set((text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || []).map(e => e.trim().toLowerCase())));
      say(`Found ${emails.length.toLocaleString()} unique emails. Uploading…`);
      let added = 0;
      for (let i = 0; i < emails.length; i += CHUNK) {
        const batch = emails.slice(i, i + CHUNK);
        const res = await fetch('/api/sabi/admin/owlet-emails', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: batch }),
        });
        if (!res.ok) { setErr(`Upload failed at ${i.toLocaleString()} (HTTP ${res.status}).`); break; }
        const d = await res.json();
        added += d.added || 0;
        say(`  ${Math.min(i + CHUNK, emails.length).toLocaleString()}/${emails.length.toLocaleString()} · +${(d.added || 0).toLocaleString()} new · total on list: ${(d.total || 0).toLocaleString()}`);
      }
      say(`✅ Done. ${added.toLocaleString()} newly added.`);
      loadStats();
    } catch (e: any) { setErr(e?.message || 'Import failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Owlet Promo — Import Emails</h1>
      <p className="text-slate-400 text-sm mt-1">Upload the Owlet users CSV to the allowlist. Anyone on the list who registers + verifies on SABI gets the ₦2,000 (up to the claim cap).</p>

      {stats && (
        <div className="grid grid-cols-3 gap-3 my-5">
          {[
            { l: 'On list', v: (stats.total || 0).toLocaleString() },
            { l: 'Claimed', v: (stats.claimed || 0).toLocaleString() },
            { l: 'Cap', v: (stats.maxClaims || 0).toLocaleString() },
          ].map(s => (
            <div key={s.l} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.l}</div>
              <div className="text-lg font-bold">{s.v}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs mb-4">Promo: <b className={stats?.enabled ? 'text-emerald-400' : 'text-slate-400'}>{stats?.enabled ? 'ON' : 'OFF'}</b> · grants only fire once emails are loaded.</p>

      <label className={`inline-block px-5 py-3 rounded-xl font-bold cursor-pointer ${busy ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        {busy ? 'Importing…' : 'Choose CSV & import'}
        <input type="file" accept=".csv,.txt" disabled={busy} className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>

      {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
      {log.length > 0 && (
        <pre className="mt-5 text-[11px] bg-black/40 rounded-xl p-4 max-h-96 overflow-auto whitespace-pre-wrap">{log.join('\n')}</pre>
      )}

      {/* ── Fix a missed ₦2,000 ── */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h2 className="text-lg font-bold">Fix a missed ₦2,000</h2>
        <p className="text-slate-400 text-sm mt-1">A user says they registered with their Owlet email but didn't get it? Check why, then grant it retroactively. (Most common cause: they verified before their email was on the list — the grant only fires at verify.)</p>
        <div className="flex gap-2 mt-3">
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="user@email.com" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500/50" />
          <button onClick={check} disabled={gBusy || !email.trim()} className="px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold disabled:opacity-40">Check</button>
        </div>
        {diag && (
          <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3 text-sm space-y-2">
            <div className={diag.eligibleToGrant || diag.justGranted ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>{diag.reason}</div>
            <div className="text-[12px] text-slate-400 grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>On allowlist: <b className="text-slate-200">{String(diag.onList)}</b></span>
              <span>Already claimed: <b className="text-slate-200">{String(diag.claimed)}</b></span>
              <span>SABI account: <b className="text-slate-200">{String(diag.userExists)}</b></span>
              <span>Email verified: <b className="text-slate-200">{String(diag.emailVerified)}</b></span>
              <span>Already credited: <b className="text-slate-200">{String(diag.alreadyCredited)}</b></span>
              <span>Cap reached: <b className="text-slate-200">{String(diag.capReached)}</b></span>
            </div>
            {diag.eligibleToGrant && !diag.justGranted && <button onClick={grantOne} disabled={gBusy} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold disabled:opacity-40">Grant ₦2,000 now</button>}
            {diag.justGranted && <div className="text-emerald-400 font-bold">✅ ₦2,000 credited to their SABI wallet.</div>}
          </div>
        )}
        <div className="mt-5">
          <button onClick={sweep} disabled={gBusy} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold disabled:opacity-40">{gBusy ? 'Working…' : 'Run retroactive sweep (fix everyone at once)'}</button>
          <p className="text-[11px] text-slate-500 mt-1">Grants ₦2,000 to every verified allowlisted user who missed it, up to the cap. Idempotent — safe to re-run.</p>
          {gLog.length > 0 && <pre className="mt-3 text-[11px] bg-black/40 rounded-xl p-3 max-h-64 overflow-auto whitespace-pre-wrap">{gLog.join('\n')}</pre>}
        </div>
      </div>
    </div>
  );
}
