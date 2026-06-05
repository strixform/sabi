import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function db() {
  let url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();
  if (url.startsWith('libsql://')) url = url.replace('libsql://', 'https://');
  return createClient({ url, authToken });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';
  const client = db();
  const log: string[] = [];

  // --- SabiOrder new columns ---
  const orderCols = (await client.execute(`PRAGMA table_info("SabiOrder")`)).rows.map((r: any) => r.name);
  const orderTodo = [
    { name: 'promoCodeId',    ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "promoCodeId" TEXT` },
    { name: 'discountAmount', ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0` },
    { name: 'scheduledAt',    ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "scheduledAt" DATETIME` },
  ].filter(c => !orderCols.includes(c.name));
  log.push(`SabiOrder: will add ${orderTodo.map(c => c.name).join(', ') || '(none)'}`);

  // --- SabiWallet new columns ---
  const walletCols = (await client.execute(`PRAGMA table_info("SabiWallet")`)).rows.map((r: any) => r.name);
  const walletTodo = [
    { name: 'autoTopupEnabled',   ddl: `ALTER TABLE "SabiWallet" ADD COLUMN "autoTopupEnabled" INTEGER NOT NULL DEFAULT 0` },
    { name: 'autoTopupThreshold', ddl: `ALTER TABLE "SabiWallet" ADD COLUMN "autoTopupThreshold" INTEGER NOT NULL DEFAULT 0` },
    { name: 'autoTopupAmount',    ddl: `ALTER TABLE "SabiWallet" ADD COLUMN "autoTopupAmount" INTEGER NOT NULL DEFAULT 0` },
  ].filter(c => !walletCols.includes(c.name));
  log.push(`SabiWallet: will add ${walletTodo.map(c => c.name).join(', ') || '(none)'}`);

  // --- New tables ---
  const newTables = [
    {
      name: 'SabiPromoCode',
      ddl: `CREATE TABLE IF NOT EXISTS "SabiPromoCode" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "code" TEXT NOT NULL,
        "description" TEXT,
        "discountType" TEXT NOT NULL,
        "discountValue" INTEGER NOT NULL,
        "minOrderKobo" INTEGER NOT NULL DEFAULT 0,
        "maxUses" INTEGER,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" DATETIME,
        "active" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      indexes: [
        `CREATE UNIQUE INDEX IF NOT EXISTS "SabiPromoCode_code_key" ON "SabiPromoCode"("code")`,
        `CREATE INDEX IF NOT EXISTS "SabiPromoCode_active_idx" ON "SabiPromoCode"("active")`,
      ],
    },
    {
      name: 'SabiPromoUsage',
      ddl: `CREATE TABLE IF NOT EXISTS "SabiPromoUsage" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "promoId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "savedKobo" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      indexes: [
        `CREATE UNIQUE INDEX IF NOT EXISTS "SabiPromoUsage_promoId_userId_key" ON "SabiPromoUsage"("promoId","userId")`,
        `CREATE INDEX IF NOT EXISTS "SabiPromoUsage_userId_idx" ON "SabiPromoUsage"("userId")`,
      ],
    },
    {
      name: 'SabiReferral',
      ddl: `CREATE TABLE IF NOT EXISTS "SabiReferral" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "referrerId" TEXT NOT NULL,
        "refereeId" TEXT NOT NULL,
        "rewardKobo" INTEGER NOT NULL DEFAULT 50000,
        "referrerPaid" INTEGER NOT NULL DEFAULT 0,
        "refereePaid" INTEGER NOT NULL DEFAULT 0,
        "triggeredAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      indexes: [
        `CREATE UNIQUE INDEX IF NOT EXISTS "SabiReferral_refereeId_key" ON "SabiReferral"("refereeId")`,
        `CREATE INDEX IF NOT EXISTS "SabiReferral_referrerId_idx" ON "SabiReferral"("referrerId")`,
      ],
    },
    {
      name: 'SabiOrderTemplate',
      ddl: `CREATE TABLE IF NOT EXISTS "SabiOrderTemplate" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "targetUrl" TEXT,
        "audienceGender" TEXT,
        "audienceLocation" TEXT,
        "commentGender" TEXT,
        "commentInstructions" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      indexes: [
        `CREATE INDEX IF NOT EXISTS "SabiOrderTemplate_userId_idx" ON "SabiOrderTemplate"("userId")`,
      ],
    },
  ];

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      orderCols: orderTodo.map(c => c.name),
      walletCols: walletTodo.map(c => c.name),
      newTables: newTables.map(t => t.name),
      log,
    });
  }

  for (const c of orderTodo) { await client.execute(c.ddl); log.push(`added SabiOrder.${c.name}`); }
  for (const c of walletTodo) { await client.execute(c.ddl); log.push(`added SabiWallet.${c.name}`); }
  for (const t of newTables) {
    await client.execute(t.ddl);
    for (const ix of t.indexes) await client.execute(ix);
    log.push(`ensured table ${t.name}`);
  }

  // Verify
  const finalOrderCols = (await client.execute(`PRAGMA table_info("SabiOrder")`)).rows.map((r: any) => r.name);
  const finalWalletCols = (await client.execute(`PRAGMA table_info("SabiWallet")`)).rows.map((r: any) => r.name);
  const allNeeded = ['promoCodeId','discountAmount','scheduledAt'];
  const walletNeeded = ['autoTopupEnabled','autoTopupThreshold','autoTopupAmount'];

  return NextResponse.json({
    ok: true,
    orderColsOk: allNeeded.every(n => finalOrderCols.includes(n)),
    walletColsOk: walletNeeded.every(n => finalWalletCols.includes(n)),
    log,
  });
}
