import { sabiExecute } from './tursoClient';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const ACTING_COOKIE = 'sabi_acting_workspace';
export type TeamRole = 'viewer' | 'member' | 'admin';
export const VALID_ROLES: TeamRole[] = ['viewer', 'member', 'admin'];

export interface ActingAccount {
  accountId: string;   // whose data/wallet the request operates on
  actorId: string;     // the logged-in user actually performing it
  role: string;        // 'owner' when on own account, else the team role
  delegated: boolean;  // true when acting inside someone else's workspace
}

/**
 * Resolve the account a request operates on. If the user has switched into a
 * workspace they're an ACTIVE member of (cookie set), the account = that owner;
 * otherwise their own account. Re-verifies membership every call (cookie alone
 * grants nothing). Defaults to the user's OWN account on any doubt — never
 * accidentally targets another account.
 */
export async function getActingAccount(actorId: string): Promise<ActingAccount> {
  try {
    const c = await cookies();
    const ws = c.get(ACTING_COOKIE)?.value;
    if (ws && ws !== actorId) {
      const r = await sabiExecute({
        sql: `SELECT role FROM "SabiTeamMember" WHERE memberUserId = ? AND ownerId = ? AND status = 'active' LIMIT 1`,
        args: [actorId, ws],
      });
      const role = (r.rows[0] as any)?.role;
      if (role) return { accountId: ws, actorId, role, delegated: true };
    }
  } catch { /* fall through to own account */ }
  return { accountId: actorId, actorId, role: 'owner', delegated: false };
}

/** Who can place/modify orders & spend the wallet. Viewers are read-only. */
export function canSpend(role: string): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/** Best-effort attribution/audit of actions taken inside a workspace. */
export async function logTeamAction(ownerId: string, actorId: string, action: string, detail?: string) {
  try {
    await sabiExecute({
      sql: `CREATE TABLE IF NOT EXISTS "SabiTeamAction" (id TEXT PRIMARY KEY, ownerId TEXT, actorId TEXT, action TEXT, detail TEXT, createdAt TEXT)`,
      args: [],
    });
    await sabiExecute({
      sql: `INSERT INTO "SabiTeamAction" (id, ownerId, actorId, action, detail, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), ownerId, actorId, action, detail || null],
    });
  } catch { /* non-fatal */ }
}

/**
 * View-only team seats (Phase 1). An account owner invites teammates by email;
 * once accepted, the teammate can VIEW the owner's orders/activity (read-only) —
 * they cannot spend or place orders. Stored in a guarded raw table (not in the
 * Prisma schema) so it ships without a migration.
 */
export async function ensureTeamTable() {
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS "SabiTeamMember" (
       id           TEXT PRIMARY KEY,
       ownerId      TEXT NOT NULL,
       memberEmail  TEXT NOT NULL,
       memberUserId TEXT,
       role         TEXT NOT NULL DEFAULT 'viewer',
       status       TEXT NOT NULL DEFAULT 'invited',
       token        TEXT,
       invitedAt    TEXT,
       acceptedAt   TEXT
     )`,
    args: [],
  });
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS "SabiTeamMember_owner_idx" ON "SabiTeamMember"(ownerId)`, args: [] }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS "SabiTeamMember_member_idx" ON "SabiTeamMember"(memberUserId)`, args: [] }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS "SabiTeamMember_token_idx" ON "SabiTeamMember"(token)`, args: [] }).catch(() => {});
}

/** True if memberUserId is an ACTIVE member of ownerId's workspace. */
export async function isActiveTeamMember(memberUserId: string, ownerId: string): Promise<boolean> {
  if (!memberUserId || !ownerId) return false;
  const r = await sabiExecute({
    sql: `SELECT 1 FROM "SabiTeamMember" WHERE memberUserId = ? AND ownerId = ? AND status = 'active' LIMIT 1`,
    args: [memberUserId, ownerId],
  }).catch(() => ({ rows: [] as any[] }));
  return r.rows.length > 0;
}

export function newInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
