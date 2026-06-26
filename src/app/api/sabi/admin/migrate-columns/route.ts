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
  // Completion-triggered drip chain
  { table: 'SabiOrder', column: 'dripChainId', type: 'TEXT' },
  { table: 'SabiOrder', column: 'dripIndex', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'dripTotal', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'dripMode', type: 'TEXT' },
  // Custom comments (buyer-provided exact text, JSON array)
  { table: 'SabiOrder', column: 'customComments', type: 'TEXT' },
  // Buyer rating of the delivered order (1-5) + optional note
  { table: 'SabiOrder', column: 'rating', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'ratingNote', type: 'TEXT' },
  // Buyer's "before" starting count + screenshot (now compulsory at order time)
  { table: 'SabiOrder', column: 'startCount', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'startScreenshotUrl', type: 'TEXT' },
  // Staff review: order marked fully checked → moves to "Checked Orders"
  { table: 'SabiOrder', column: 'staffChecked', type: 'INTEGER' },
  { table: 'SabiOrder', column: 'staffCheckedAt', type: 'TEXT' },
  { table: 'SabiOrder', column: 'staffCheckedBy', type: 'TEXT' },
  // Live-watch services: the watch-time (minutes) the buyer chose — drives the
  // tasker's tranche reward on gamerz360.
  { table: 'SabiOrder', column: 'durationMinutes', type: 'INTEGER' },
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
