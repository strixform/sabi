'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Public "Verified by SABI" proof report — shareable, no login. Token-gated.
 * Every view advertises SABI (CTA at the bottom).
 */
export default function PublicReportPage() {
  const token = useParams().token as string;
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    fetch(`/api/sabi/public/order-report?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) { setData(d); setState('ok'); } else setState('error'); })
      .catch(() => setState('error'));
  }, [token]);

  const isImg = (u?: string | null) =>
    !!u && (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /\.public\.blob\.vercel-storage\.com/i.test(u) || u.startsWith('data:image'));

  if (state === 'loading') return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Loading…</div>;
  if (state === 'error') return <div style={{ padding: 40, fontFamily: 'system-ui' }}>This proof link is invalid or has expired.</div>;

  const o = data.order, meta = data.meta, proofs = data.proofs as any[];

  return (
    <div style={{ background: '#fff', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@media print { .no-print { display:none !important; } @page { margin: 14mm; } } .rcpt{break-inside:avoid;}`}</style>

      <div className="no-print" style={{ background: '#0A0D14', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: 14 }}>SABI · Verified Proof</span>
        <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', border: 0, padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>🖨️ Save as PDF</button>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 28px' }}>
        <div style={{ borderBottom: '2px solid #6d28d9', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Verified Delivery Report</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Order #{o.idShort} · {String(o.serviceType).replace(/_/g, ' ')} · {o.quantity.toLocaleString()} units</div>
        </div>

        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#5b21b6', marginBottom: 20 }}>
          ✅ This campaign was delivered by <b>real Nigerians</b> on the Gamers360 crowd, paid per task — not bots. Below are the receipts they uploaded as proof.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
          {[
            { l: 'Status', v: String(o.status).toUpperCase() },
            { l: 'Completion', v: `${o.completionPercentage}%` },
            { l: 'Completions', v: String(meta.total) },
            { l: 'Verified', v: String(meta.approved) },
          ].map(s => (
            <div key={s.l} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Receipts ({proofs.length})</div>
        {proofs.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>No receipts uploaded yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {proofs.map((p) => (
              <div key={p.id} className="rcpt" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {isImg(p.proofUrl)
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.proofUrl} alt="Proof" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontSize: 22 }}>✅</div>}
                <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proofText || 'Completed'}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: p.status === 'approved' ? '#dcfce7' : '#fef9c3', color: p.status === 'approved' ? '#15803d' : '#a16207' }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marketing CTA — every shared view advertises SABI */}
        <div className="no-print" style={{ marginTop: 32, padding: 20, borderRadius: 14, textAlign: 'center', background: 'linear-gradient(135deg,#ede9fe,#fae8ff)', border: '1px solid #ddd6fe' }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>Want real traffic like this?</div>
          <div style={{ fontSize: 13, color: '#6b21a8', marginBottom: 12 }}>Real Nigerian fans streaming, voting, posting & engaging — with receipts.</div>
          <a href="https://sability.io/sabi/order" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Order on SABI →</a>
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>sability.io — real human engagement, verified with receipts.</div>
      </div>
    </div>
  );
}
