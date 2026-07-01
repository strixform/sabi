import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { getActingAccount } from '@/lib/sabiTeam';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';

// Lightweight "am I acting as another account?" check for the header bar.
// getActingAccount does NO DB query when there's no acting cookie (the common
// case), so this is cheap on every page load.
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ acting: null });
  const acct = await getActingAccount(session.id);
  if (!acct.delegated) return NextResponse.json({ acting: null });
  let name = 'another account';
  try {
    const r = await sabiExecute({ sql: `SELECT businessName, name FROM SabiUser WHERE id = ? LIMIT 1`, args: [acct.accountId] });
    const row = r.rows[0] as any;
    if (row) name = row.businessName || row.name || name;
  } catch { /* ignore */ }
  return NextResponse.json({ acting: { accountId: acct.accountId, role: acct.role, name } });
}
