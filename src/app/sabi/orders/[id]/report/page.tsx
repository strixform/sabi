'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Printable campaign report — a clean, light, print-optimized view of an order
 * and the real receipts its taskers uploaded. "Print / Save as PDF" uses the
 * browser print dialog, so no PDF library is needed and screenshots embed fine.
 */
export default function OrderReportPage() {
  const orderId = useParams().id as string;
  const [order, setOrder] = useState<any>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; approved: number; withScreenshot: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareState, setShareState] = useState<'' | 'copied'>('');

  const copyShareLink = async () => {
    try {
      const r = await fetch(`/api/sabi/orders/share-token?orderId=${orderId}`);
      const d = await r.json();
      if (d?.url) {
        await navigator.clipboard.writeText(d.url);
        setShareState('copied');
        setTimeout(() => setShareState(''), 2500);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const [o, p] = await Promise.all([
          fetch(`/api/sabi/orders?id=${orderId}`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`/api/sabi/orders/proofs?orderId=${orderId}`).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (o?.success && o.orders) setOrder(o.orders[0]);
        if (p?.success) { setProofs(p.proofs || []); setMeta({ total: p.total || 0, approved: p.approved || 0, withScreenshot: p.withScreenshot || 0 }); }
      } finally { setLoading(false); }
    })();
  }, [orderId]);

  const isImg = (u?: string | null) =>
    !!u && (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /\.public\.blob\.vercel-storage\.com/i.test(u) || u.startsWith('data:image'));
  const ngn = (k: number) => `₦${(k / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Loading report…</div>;
  if (!order) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Order not found.</div>;

  return (
    <div style={{ background: '#fff', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media print { .no-print { display: none !important; } @page { margin: 14mm; } body { background: #fff; } }
        .rcpt { break-inside: avoid; }
      `}</style>

      {/* Toolbar (hidden in print) */}
      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#0A0D14', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href={`/sabi/orders/${orderId}`} style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← Back to order</a>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyShareLink} style={{ background: 'rgba(167,139,250,0.18)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.35)', padding: '10px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {shareState === 'copied' ? '✓ Link copied!' : '🔗 Copy public link'}
          </button>
          <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', border: 0, padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6d28d9', paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>SABI · Campaign Report</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Verified real-human delivery — sability.io</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
            <div>Order #{order.id?.substring(0, 8)}</div>
            <div>{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Order</div>
            <Row k="Service" v={String(order.serviceType).replace(/_/g, ' ')} />
            <Row k="Quantity" v={Number(order.quantity).toLocaleString()} />
            <Row k="Status" v={String(order.status).toUpperCase()} />
            <Row k="Completion" v={`${order.completionPercentage || 0}%`} />
            <Row k="Target" v={order.targetUrl} mono />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Delivery proof</div>
            <Row k="Completions" v={String(meta?.total ?? 0)} />
            <Row k="Verified" v={String(meta?.approved ?? 0)} />
            <Row k="With screenshot" v={String(meta?.withScreenshot ?? 0)} />
            <Row k="Amount" v={ngn((order.totalPrice || 0) + (order.platformFee || 0))} />
          </div>
        </div>

        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#5b21b6', marginBottom: 24 }}>
          ✅ Every action below was performed by a <b>real Nigerian</b> on the Gamers360 crowd, paid by the platform — not bots. The screenshots are the receipts they uploaded as proof.
        </div>

        {/* Receipts */}
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Receipts ({proofs.length})</div>
        {proofs.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>No receipts uploaded yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {proofs.map((p) => (
              <div key={p.id} className="rcpt" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {isImg(p.proofUrl)
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.proofUrl} alt="Proof" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontSize: 11, color: '#64748b', padding: 6, textAlign: 'center', wordBreak: 'break-all' }}>{p.proofUrl || '✅ Completed'}</div>}
                <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proofText || 'Completed'}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: p.status === 'approved' ? '#dcfce7' : '#fef9c3', color: p.status === 'approved' ? '#15803d' : '#a16207' }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          Generated by SABI · sability.io — real human engagement, verified with receipts.
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12.5 }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{v}</span>
    </div>
  );
}
