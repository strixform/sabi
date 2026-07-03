import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * One-time migration for the Auto Engagement feature. Creates the two tables via raw
 * libSQL DDL (resilient path — not fragile Prisma migrate). Idempotent: IF NOT EXISTS,
 * safe to re-run. Owner only. Hit once after deploy.
 */
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS SabiEngagementPackage (
     id              TEXT PRIMARY KEY,
     userId          TEXT NOT NULL,
     platform        TEXT NOT NULL,
     profileUrl      TEXT NOT NULL,
     postsTotal      INTEGER NOT NULL,
     engagersPerPost INTEGER NOT NULL,
     mixComment      INTEGER NOT NULL DEFAULT 1,
     mixCommentLikes INTEGER NOT NULL DEFAULT 0,
     amountKobo      INTEGER NOT NULL,
     baseKobo        INTEGER NOT NULL,
     postReleaseKobo INTEGER NOT NULL,
     postsSubmitted  INTEGER NOT NULL DEFAULT 0,
     postsCompleted  INTEGER NOT NULL DEFAULT 0,
     releasedKobo    INTEGER NOT NULL DEFAULT 0,
     status          TEXT NOT NULL DEFAULT 'active',
     createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
     updatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_ae_pkg_user ON SabiEngagementPackage(userId)`,
  `CREATE INDEX IF NOT EXISTS idx_ae_pkg_status ON SabiEngagementPackage(status)`,
  `CREATE TABLE IF NOT EXISTS SabiEngagementPost (
     id           TEXT PRIMARY KEY,
     packageId    TEXT NOT NULL,
     userId       TEXT NOT NULL,
     postUrl      TEXT NOT NULL,
     idx          INTEGER NOT NULL,
     status       TEXT NOT NULL DEFAULT 'engaging',
     releasedKobo INTEGER NOT NULL DEFAULT 0,
     gamesz360CampaignId TEXT,
     createdAt    TEXT NOT NULL DEFAULT (datetime('now')),
     completedAt  TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_ae_post_pkg ON SabiEngagementPost(packageId)`,
  `CREATE INDEX IF NOT EXISTS idx_ae_post_status ON SabiEngagementPost(status)`,
];

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const done: string[] = [];
  for (const sql of DDL) {
    await sabiExecute({ sql, args: [] });
    done.push(sql.split('\n')[0].trim());
  }
  return NextResponse.json({ ok: true, ran: done.length, statements: done });
}
