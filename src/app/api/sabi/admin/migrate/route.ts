/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SABI PROD DB MIGRATION ENDPOINT
 * POST /api/sabi/admin/migrate  { action: string }
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Runs additive DDL on the SABI Turso prod DB.
 * Turso has no automatic migration runner — all schema changes must be
 * applied manually via this endpoint after deploying new schema.
 *
 * Protected by ADMIN_SECRET header (set SABI_ADMIN_SECRET in Vercel env).
 *
 * Actions:
 *   create_referral_table   — creates SabiReferral + index
 *   check_tables            — lists existing tables (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const preferredRegion = 'sfo1';
export const maxDuration = 30;

async function run(sql: string): Promise<{ status: string; note?: string }> {
  try {
    await prisma.$executeRawUnsafe(sql);
    return { status: 'OK' };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('already exists') || msg.includes('duplicate')) return { status: 'ALREADY_EXISTS' };
    return { status: 'ERROR', note: msg };
  }
}

export async function POST(req: NextRequest) {
  // Simple secret-key auth
  const secret = req.headers.get('x-admin-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.SABI_ADMIN_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json().catch(() => ({ action: null }));
  const results: { step: string; status: string; note?: string }[] = [];

  if (action === 'create_referral_table') {
    results.push({
      step: 'CREATE SabiReferral',
      ...(await run(`
        CREATE TABLE IF NOT EXISTS "SabiReferral" (
          "id"           TEXT NOT NULL PRIMARY KEY,
          "referrerId"   TEXT NOT NULL,
          "refereeId"    TEXT NOT NULL UNIQUE,
          "rewardKobo"   INTEGER NOT NULL DEFAULT 50000,
          "referrerPaid" INTEGER NOT NULL DEFAULT 0,
          "refereePaid"  INTEGER NOT NULL DEFAULT 0,
          "triggeredAt"  DATETIME,
          "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)),
    });
    results.push({
      step: 'IDX SabiReferral referrerId',
      ...(await run(`CREATE INDEX IF NOT EXISTS "SabiReferral_referrerId_idx" ON "SabiReferral"("referrerId")`)),
    });
    return NextResponse.json({ ok: true, results });
  }

  if (action === 'check_tables') {
    const tables = ['SabiUser', 'SabiOrder', 'SabiWallet', 'SabiTransaction', 'SabiReferral',
                    'SabiOrderTemplate', 'SabiPromoCode', 'SabiPromoUsage', 'SabiPushSubscription'];
    const counts: Record<string, number | string> = {};
    for (const t of tables) {
      try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as c FROM "${t}"`);
        counts[t] = Number(rows[0]?.c ?? 0);
      } catch { counts[t] = 'MISSING'; }
    }
    return NextResponse.json({ ok: true, tables: counts });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
