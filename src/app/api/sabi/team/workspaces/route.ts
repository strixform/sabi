import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureTeamTable, getActingAccount } from '@/lib/sabiTeam';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';

// GET — the workspaces (owner accounts) the signed-in user can view.
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTeamTable();
  const r = await sabiExecute({
    sql: `SELECT t.ownerId, t.role, u.name AS ownerName, u.businessName AS ownerBusiness, u.email AS ownerEmail
          FROM "SabiTeamMember" t JOIN "SabiUser" u ON u.id = t.ownerId
          WHERE t.memberUserId = ? AND t.status = 'active' ORDER BY t.acceptedAt DESC`,
    args: [session.id],
  });
  const acct = await getActingAccount(session.id);
  return NextResponse.json({
    acting: acct.delegated ? { accountId: acct.accountId, role: acct.role } : null,
    workspaces: (r.rows as any[]).map((w) => ({
      ownerId: w.ownerId,
      role: w.role,
      name: w.ownerBusiness || w.ownerName || w.ownerEmail,
    })),
  });
}
