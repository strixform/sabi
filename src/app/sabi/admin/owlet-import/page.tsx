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
    </div>
  );
}
