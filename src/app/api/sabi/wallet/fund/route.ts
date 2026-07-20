import { NextRequest, NextResponse } from 'next/server';
import { resolveSabiCaller, apiRateLimit } from '@/lib/sabiApiAuth';
import { rateLimitResponse } from '@/lib/rateLimit';
import { generateFlwTxRef, initializeFlwPayment } from '@/lib/sabiFlutterwave';
import { sabiExecute } from '@/lib/tursoClient';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


export async function POST(req: NextRequest) {
  try {
    const session = await resolveSabiCaller(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const arl = await apiRateLimit(session, 'fund', 20, 60000);
    if (!arl.allowed) return rateLimitResponse(20, arl.resetTime);

    const { amount } = await req.json();

    if (!amount || amount < 500 || amount > 10000000) {
      return NextResponse.json(
        { error: 'Amount must be between â‚¦500 and â‚¦10,000,000' },
        { status: 400 }
      );
    }

    const txRef = generateFlwTxRef(session.id);
    const result = await initializeFlwPayment({
      email: session.email,
      amount,
      txRef,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sabi/wallet/callback`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Record a server-side pending funding row so this payment can be reconciled
    // later even if the buyer's device/localStorage loses the ref (e.g. they paid
    // by bank transfer from another phone). creditSabiWallet keys credits on the
    // ref and is idempotent, so this never risks a double credit. Best-effort.
    try {
      await sabiExecute({
        sql: `INSERT INTO SabiTransaction (id, userId, type, amount, reference, description, createdAt)
              VALUES (?, ?, 'fund_pending', ?, ?, 'Funding initialized', datetime('now'))`,
        args: [crypto.randomUUID(), session.id, Math.round(amount * 100), txRef],
      });
    } catch { /* non-critical — client-saved ref is the fallback */ }

    return NextResponse.json({
      success: true,
      paymentLink: result.data?.link,
      txRef,
    });
  } catch (error) {
    // Error logging handled by external service
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
