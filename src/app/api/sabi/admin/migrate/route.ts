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
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

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
  // Accepts both SABI session cookie AND admin token header
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized — must be logged in as admin' }, { status: 401 });
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

  // Add missing columns to SabiUser table (session + auth fields)
  // Run this if login/registration fails — these columns may be missing in prod Turso
  if (action === 'add_sabiuser_columns') {
    const results: { step: string; status: string; note?: string }[] = [];
    const cols = [
      { name: 'sessionToken',    sql: `ALTER TABLE "SabiUser" ADD COLUMN "sessionToken" TEXT` },
      { name: 'sessionExpiry',   sql: `ALTER TABLE "SabiUser" ADD COLUMN "sessionExpiry" DATETIME` },
      { name: 'googleId',        sql: `ALTER TABLE "SabiUser" ADD COLUMN "googleId" TEXT` },
      { name: 'verifyCode',      sql: `ALTER TABLE "SabiUser" ADD COLUMN "verifyCode" TEXT` },
      { name: 'verifyCodeExpiry',sql: `ALTER TABLE "SabiUser" ADD COLUMN "verifyCodeExpiry" DATETIME` },
      { name: 'referralCode',    sql: `ALTER TABLE "SabiUser" ADD COLUMN "referralCode" TEXT` },
      { name: 'referredByCode',  sql: `ALTER TABLE "SabiUser" ADD COLUMN "referredByCode" TEXT` },
      { name: 'phone',           sql: `ALTER TABLE "SabiUser" ADD COLUMN "phone" TEXT` },
      { name: 'avatarUrl',       sql: `ALTER TABLE "SabiUser" ADD COLUMN "avatarUrl" TEXT` },
      { name: 'notifyEmail',     sql: `ALTER TABLE "SabiUser" ADD COLUMN "notifyEmail" INTEGER NOT NULL DEFAULT 1` },
    ];
    for (const col of cols) {
      try {
        await prisma.$executeRawUnsafe(col.sql);
        results.push({ step: `ADD SabiUser.${col.name}`, status: 'OK' });
      } catch (err: any) {
        const msg = err?.message || String(err);
        results.push({ step: `ADD SabiUser.${col.name}`, status: msg.includes('already exists') || msg.includes('duplicate') ? 'ALREADY_EXISTS' : 'ERROR', note: msg });
      }
    }
    // Also add unique index on googleId
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SabiUser_googleId_key" ON "SabiUser"("googleId") WHERE "googleId" IS NOT NULL`);
      results.push({ step: 'IDX SabiUser.googleId', status: 'OK' });
    } catch (err: any) {
      results.push({ step: 'IDX SabiUser.googleId', status: 'ERROR', note: err?.message });
    }
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SabiUser_referralCode_key" ON "SabiUser"("referralCode") WHERE "referralCode" IS NOT NULL`);
      results.push({ step: 'IDX SabiUser.referralCode', status: 'OK' });
    } catch (err: any) {
      results.push({ step: 'IDX SabiUser.referralCode', status: 'ERROR', note: err?.message });
    }
    return NextResponse.json({ ok: true, results });
  }

  // Add missing columns to SABIAdminConfig (supportWhatsapp, updatedBy)
  // Run this if settings page fails to save — columns may be missing in prod Turso
  if (action === 'add_config_columns') {
    const results: { step: string; status: string; note?: string }[] = [];
    // Create the table in case it doesn't exist at all
    results.push({ step: 'CREATE SABIAdminConfig', ...(await run(`
      CREATE TABLE IF NOT EXISTS "SABIAdminConfig" (
        "id"               TEXT NOT NULL PRIMARY KEY,
        "minOrderQuantity" INTEGER NOT NULL DEFAULT 5,
        "maxOrderQuantity" INTEGER NOT NULL DEFAULT 5000,
        "supportWhatsapp"  TEXT,
        "updatedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy"        TEXT,
        "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)) });
    // Add columns if table already exists but columns are missing
    for (const col of [
      { name: 'supportWhatsapp', sql: `ALTER TABLE "SABIAdminConfig" ADD COLUMN "supportWhatsapp" TEXT` },
      { name: 'updatedBy',       sql: `ALTER TABLE "SABIAdminConfig" ADD COLUMN "updatedBy" TEXT` },
    ]) {
      try {
        await prisma.$executeRawUnsafe(col.sql);
        results.push({ step: `ADD SABIAdminConfig.${col.name}`, status: 'OK' });
      } catch (err: any) {
        const msg = err?.message || String(err);
        results.push({ step: `ADD SABIAdminConfig.${col.name}`, status: msg.includes('already exists') || msg.includes('duplicate') ? 'ALREADY_EXISTS' : 'ERROR', note: msg });
      }
    }
    return NextResponse.json({ ok: true, results });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
