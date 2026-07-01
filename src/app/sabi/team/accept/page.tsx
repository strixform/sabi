'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

export default function AcceptInvitePage() {
  const [token, setToken] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [needAuth, setNeedAuth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) { setMsg('Missing invite token.'); return; }
    fetch(`/api/sabi/team/accept?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => { if (d.found) setInfo(d); else setMsg('This invite was not found or has expired.'); })
      .catch(() => setMsg('Could not load this invite.'));
  }, []);

  async function accept() {
    setBusy(true); setMsg(''); setNeedAuth(false);
    try {
      const res = await fetch('/api/sabi/team/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const d = await res.json();
      if (res.ok) { setDone(true); setMsg(`You can now view ${d.owner}.`); }
      else if (d.needAuth) { setNeedAuth(true); setMsg(d.error); }
      else setMsg(d.error || 'Could not accept.');
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  const loginNext = typeof window !== 'undefined' ? `/sabi/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}` : '/sabi/login';

  return (
    <div className="mx-auto max-w-md p-6 text-slate-100">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center">
        <h1 className="text-xl font-bold">Team invite</h1>
        {info ? (
          <>
            <p className="mt-3 text-sm text-slate-300">
              You&rsquo;ve been invited to <b>view</b> the orders &amp; activity of <b>{info.owner}</b>.
            </p>
            <p className="mt-1 text-xs text-slate-500">Invited email: {info.invitedEmail}</p>
            {!done && (
              <button onClick={accept} disabled={busy}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-bold disabled:opacity-40">
                {busy ? 'Accepting…' : 'Accept invite'}
              </button>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">{msg || 'Loading…'}</p>
        )}

        {msg && info && <div className={`mt-4 rounded-lg p-3 text-sm ${done ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>{msg}</div>}

        {needAuth && (
          <a href={loginNext} className="mt-3 inline-block text-sm text-blue-400 underline">Sign in with the invited email to accept →</a>
        )}
        {done && (
          <a href="/sabi/team" className="mt-3 inline-block text-sm text-blue-400 underline">Go to Team →</a>
        )}
      </div>
    </div>
  );
}
