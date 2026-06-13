import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Find (and optionally repair) SabiOrder rows with malformed DateTime values —
 * the kind that make prisma.findMany throw and silently empty a user's order
 * list. Reads use raw SELECT (already resilient); this is for cleaning the data.
 *
 * GET /api/sabi/admin/diagnose-orders            → scan, report offenders
 * GET /api/sabi/admin/diagnose-orders?fix=YES    → repair them (NULL nullable
 *     datetimes; set createdAt/updatedAt to a valid timestamp)
 *
 * Admin only.
 */
const DATETIME_COLS = ['createdAt', 'updatedAt', 'scheduledAt', 'estimatedCompletion', 'completedAt'];
const REQUIRED = new Set(['createdAt', 'updatedAt']); // can't be null — reset to a valid value

function isBadDate(v: any): boolean {
  if (v === null || v === undefined) return false; // null is fine (for nullable cols)
  const s = String(v).trim();
  if (s === '') return true;                                   // empty string → Prisma can't parse
  if (!/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/.test(s)) return true; // not ISO-ish
  return Number.isNaN(Date.parse(s));                          // unparseable
}

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const fix = req.nextUrl.searchParams.get('fix') === 'YES';

  let rows: any[] = [];
  try {
    const r = await sabiExecute({ sql: `SELECT * FROM SabiOrder LIMIT 20000`, args: [] });
    rows = r.rows as any[];
  } catch (e: any) {
    return NextResponse.json({ error: 'Scan failed', detail: e?.message }, { status: 500 });
  }

  const offenders: { id: string; userId: string; column: string; value: any }[] = [];
  for (const row of rows) {
    for (const col of DATETIME_COLS) {
      if (col in row && isBadDate(row[col])) {
        offenders.push({ id: row.id, userId: row.userId, column: col, value: row[col] });
      }
    }
  }

  const byColumn: Record<string, number> = {};
  for (const o of offenders) byColumn[o.column] = (byColumn[o.column] || 0) + 1;
  const affectedUsers = new Set(offenders.map((o) => o.userId)).size;

  if (!fix) {
    return NextResponse.json({
      mode: 'SCAN',
      scanned: rows.length,
      badRows: offenders.length,
      affectedUsers,
      byColumn,
      sample: offenders.slice(0, 25),
      note: offenders.length
        ? 'Re-run with ?fix=YES to repair (nullable datetimes → NULL; createdAt/updatedAt → valid timestamp).'
        : 'No malformed datetime values found. The orders fix already handles the issue; nothing to clean.',
    });
  }

  // ── REPAIR ────────────────────────────────────────────────────────────────
  let fixed = 0;
  for (const o of offenders.slice(0, 2000)) {
    try {
      if (REQUIRED.has(o.column)) {
        await sabiExecute({
          sql: `UPDATE SabiOrder SET "${o.column}" = datetime('now') WHERE id = ?`,
          args: [o.id],
        });
      } else {
        await sabiExecute({
          sql: `UPDATE SabiOrder SET "${o.column}" = NULL WHERE id = ?`,
          args: [o.id],
        });
      }
      fixed++;
    } catch { /* skip individual failures */ }
  }

  return NextResponse.json({
    mode: 'FIXED',
    repaired: fixed,
    ofBadRows: offenders.length,
    affectedUsers,
    note: 'Repaired malformed datetimes. Affected users\' orders will deserialize cleanly now. Safe to re-run.',
  });
}
