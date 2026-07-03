import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/** The buyer's Auto Engagement packages, newest first, each with its submitted posts. */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pkgRes = await sabiExecute({
    sql: `SELECT * FROM SabiEngagementPackage WHERE userId = ? ORDER BY createdAt DESC LIMIT 100`,
    args: [session.id],
  }).catch(() => ({ rows: [] as any[] }));
  const packages = pkgRes.rows as any[];
  if (packages.length === 0) return NextResponse.json({ ok: true, packages: [] });

  const ids = packages.map(p => String(p.id));
  const ph = ids.map(() => '?').join(',');
  const postRes = await sabiExecute({
    sql: `SELECT id, packageId, postUrl, idx, status, releasedKobo, createdAt, completedAt
          FROM SabiEngagementPost WHERE packageId IN (${ph}) ORDER BY idx ASC`,
    args: ids,
  }).catch(() => ({ rows: [] as any[] }));
  const postsByPkg: Record<string, any[]> = {};
  for (const p of postRes.rows as any[]) (postsByPkg[String(p.packageId)] ||= []).push(p);

  return NextResponse.json({
    ok: true,
    packages: packages.map(p => ({
      id: String(p.id),
      platform: p.platform,
      profileUrl: p.profileUrl,
      postsTotal: Number(p.postsTotal),
      postsSubmitted: Number(p.postsSubmitted),
      postsCompleted: Number(p.postsCompleted),
      engagersPerPost: Number(p.engagersPerPost),
      amountKobo: Number(p.amountKobo),
      releasedKobo: Number(p.releasedKobo),
      status: p.status,
      createdAt: p.createdAt,
      posts: postsByPkg[String(p.id)] || [],
    })),
  });
}
