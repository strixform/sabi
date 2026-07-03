import { NextRequest, NextResponse } from 'next/server';
import { findDoubleRefunds } from '@/lib/ledgerCheck';
import { sendAdminAlertEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const preferredRegion = 'sfo1';

// Where the tripwire pings when it catches a double-refund.
const ALERT_EMAIL = 'olusehinde09@gmail.com';

/**
 * Daily double-refund tripwire.
 *
 * Runs findDoubleRefunds() (any order with >1 refund row = a double-refund) and emails
 * ONLY when something is flagged — silence means clean. Turns the on-demand check into a
 * self-watching guard so a recurrence surfaces the next morning, not months later as a
 * weird balance.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await findDoubleRefunds();

  if (result.suspiciousCount > 0) {
    const top = result.offenders.slice(0, 20).map((o) =>
      `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #1e293b;font-family:monospace">${o.orderId}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1e293b">${o.email || o.userId}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1e293b;text-align:center">${o.refundRows}×</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1e293b;text-align:right;color:#f87171">₦${o.extraRefundedNaira.toLocaleString()}</td>
      </tr>`
    ).join('');

    const body = `
      <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">
        <b>${result.suspiciousCount}</b> order(s) have been refunded more than once —
        the double-refund fingerprint. Approx <b>₦${result.totalExtraRefundNaira.toLocaleString()}</b>
        of over-credit across them.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#e2e8f0;margin-top:12px">
        <tr style="color:#94a3b8;text-align:left">
          <th style="padding:6px 10px">Order</th><th style="padding:6px 10px">User</th>
          <th style="padding:6px 10px;text-align:center">Refunds</th><th style="padding:6px 10px;text-align:right">Extra</th>
        </tr>
        ${top}
      </table>
      <p style="font-size:13px;color:#94a3b8;margin-top:16px">
        Correct with <code>/api/sabi/admin/wallet-reconcile?userId=…</code> then POST <code>{action:"apply"}</code>.
        Full list at <code>/api/sabi/admin/ledger-check</code>.
      </p>`;

    await sendAdminAlertEmail(`${result.suspiciousCount} double-refund(s) detected`, body, ALERT_EMAIL);
  }

  return NextResponse.json({
    ok: true,
    suspiciousCount: result.suspiciousCount,
    totalExtraRefundNaira: result.totalExtraRefundNaira,
    emailed: result.suspiciousCount > 0,
  });
}
