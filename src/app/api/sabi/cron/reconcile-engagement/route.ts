import { NextRequest, NextResponse } from 'next/server';
import { reconcileActivePackages } from '@/lib/reconcileEngagement';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const preferredRegion = 'sfo1';

/**
 * Settles Auto Engagement packages: releases each completed post's escrow, refunds the
 * buyer any undelivered fraction, closes finished packages, and sweeps stale ones.
 * Idempotent (per-post atomic claim), so running it repeatedly is safe.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await reconcileActivePackages();
  return NextResponse.json({ ok: true, ...result });
}
