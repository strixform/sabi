import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Self-healing column migration — adds the additive columns recent features
 * need, idempotently. Safe to run repeatedly (ALTER ... ADD COLUMN is a no-op
 * once the column exists). Avoids touching the Turso console.
 *
 * GET /api/sabi/admin/migrate-columns   (admin only)
 */
const MIGRATIONS: { table: string; column: string; type: string }[] = [
  { table: 'SabiOrder', column: 'startScreenshotUrl', type: 'TEXT' },
  { table: 'SabiOrder', column: 'rating', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'ratingComment', type: 'TEXT' },
  { table: 'SabiOrder', column: 'startCount', type: 'INTEGER' },
  { table: 'SabiUser', column: 'signupIp', type: 'TEXT' },
];

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const results: { column: string; status: string }[] = [];
  for (const m of MIGRATIONS) {
    try {
      await sabiExecute({ sql: `ALTER TABLE "${m.table}" ADD COLUMN "${m.column}" ${m.type}`, args: [] });
      results.push({ column: `${m.table}.${m.column}`, status: 'ADDED' });
    } catch (e: any) {
      const msg = String(e?.message || e).toLowerCase();
      results.push({ column: `${m.table}.${m.column}`, status: msg.includes('duplicate') || msg.includes('already exists') ? 'ALREADY_EXISTS' : `ERROR: ${e?.message}` });
    }
  }
  return NextResponse.json({ success: true, results });
}
