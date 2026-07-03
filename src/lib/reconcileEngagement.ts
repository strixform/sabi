import { sabiExecute } from './tursoClient';
import { creditSabiRefund } from './sabiRefund';

/**
 * Phase 3 — reconcile Auto Engagement packages.
 *
 * Each package's work orders (customRef 'ae:<pkg>:<post>:<action>') flow through the
 * normal gamers360 pipeline. This closes the loop on the BUYER's escrow:
 *
 *  - When every work order for a post reaches a terminal state, the post is settled:
 *    release the delivered fraction of that post's escrow (postReleaseKobo) and REFUND
 *    the buyer the undelivered remainder — "you only pay for what's delivered".
 *  - A post is settled at most ONCE via an atomic status claim (engaging → completed),
 *    so it can never double-refund (the bug class we hardened this session).
 *  - When all posts are completed, the package closes.
 *  - Stale sweep: a package left with un-submitted post slots past the deadline refunds
 *    those unused slots and closes, so escrow is never stuck forever.
 *
 * Money moves only through creditSabiRefund (audited refund ledger row).
 */

const STALE_DAYS = 30; // after this, refund un-submitted post slots and close the package
const TERMINAL = ['completed', 'failed', 'cancelled'];

async function settlePost(pkg: any, post: any): Promise<void> {
  const orders = await sabiExecute({
    sql: `SELECT status, quantity, completedQuantity FROM SabiOrder WHERE customRef LIKE ?`,
    args: [`ae:${pkg.id}:${post.id}:%`],
  }).catch(() => ({ rows: [] as any[] }));
  const rows = orders.rows as any[];
  if (rows.length === 0) return; // dispatch hasn't landed yet — leave it

  const allTerminal = rows.every(o => TERMINAL.includes(String(o.status)));
  if (!allTerminal) return; // still working

  const totalQ = rows.reduce((s, o) => s + Number(o.quantity || 0), 0);
  const totalC = rows.reduce((s, o) => s + Math.min(Number(o.completedQuantity || 0), Number(o.quantity || 0)), 0);
  const frac = totalQ > 0 ? Math.max(0, Math.min(1, totalC / totalQ)) : 0;

  const share = Number(pkg.postReleaseKobo || 0);
  const release = Math.round(share * frac);
  const refund = Math.max(0, share - release);

  // Atomic claim — settle this post once. Guards against a second reconcile run
  // refunding the same post.
  const claim = await sabiExecute({
    sql: `UPDATE SabiEngagementPost SET status = 'completed', releasedKobo = ?, completedAt = datetime('now')
          WHERE id = ? AND status = 'engaging'`,
    args: [release, post.id],
  }).catch(() => ({ rowsAffected: 0 } as any));
  if (Number((claim as any).rowsAffected ?? 0) !== 1) return; // already settled by another run

  await sabiExecute({
    sql: `UPDATE SabiEngagementPackage SET postsCompleted = postsCompleted + 1, releasedKobo = releasedKobo + ?, updatedAt = datetime('now') WHERE id = ?`,
    args: [release, pkg.id],
  });

  if (refund > 0) {
    await creditSabiRefund({
      userId: pkg.userId,
      amountKobo: refund,
      orderId: post.id, // one refund per post → never trips the double-refund tripwire
      reason: `Auto Engagement — post ${post.idx} delivered ${Math.round(frac * 100)}%, undelivered portion refunded`,
    });
  }
}

/** Reconcile a single active package: settle any finished posts, then close if done. */
export async function reconcilePackage(packageId: string): Promise<void> {
  const pr = await sabiExecute({
    sql: `SELECT * FROM SabiEngagementPackage WHERE id = ? AND status = 'active' LIMIT 1`,
    args: [packageId],
  }).catch(() => ({ rows: [] as any[] }));
  const pkg = (pr.rows as any[])[0];
  if (!pkg) return;

  const posts = await sabiExecute({
    sql: `SELECT id, idx, status FROM SabiEngagementPost WHERE packageId = ? AND status = 'engaging'`,
    args: [packageId],
  }).catch(() => ({ rows: [] as any[] }));
  for (const post of posts.rows as any[]) {
    await settlePost(pkg, post).catch(() => {});
  }

  // Close when every post slot has been submitted AND completed.
  const fresh = await sabiExecute({
    sql: `SELECT postsTotal, postsSubmitted, postsCompleted FROM SabiEngagementPackage WHERE id = ? LIMIT 1`,
    args: [packageId],
  }).catch(() => ({ rows: [] as any[] }));
  const f = (fresh.rows as any[])[0];
  if (f && Number(f.postsCompleted) >= Number(f.postsTotal)) {
    await sabiExecute({
      sql: `UPDATE SabiEngagementPackage SET status = 'completed', updatedAt = datetime('now') WHERE id = ? AND status = 'active'`,
      args: [packageId],
    }).catch(() => {});
  }
}

/** Refund un-submitted post slots on packages left stale, then close them. */
async function sweepStale(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_DAYS * 86400_000).toISOString();
  const sr = await sabiExecute({
    sql: `SELECT id, userId, postsTotal, postsSubmitted, postReleaseKobo
          FROM SabiEngagementPackage
          WHERE status = 'active' AND createdAt < ? AND postsSubmitted < postsTotal
          LIMIT 200`,
    args: [cutoff],
  }).catch(() => ({ rows: [] as any[] }));
  let swept = 0;
  for (const p of sr.rows as any[]) {
    const unused = Number(p.postsTotal) - Number(p.postsSubmitted);
    const refund = Math.max(0, unused * Number(p.postReleaseKobo || 0));
    // Atomically close so the refund happens once.
    const claim = await sabiExecute({
      sql: `UPDATE SabiEngagementPackage SET status = 'expired', updatedAt = datetime('now') WHERE id = ? AND status = 'active'`,
      args: [p.id],
    }).catch(() => ({ rowsAffected: 0 } as any));
    if (Number((claim as any).rowsAffected ?? 0) !== 1) continue;
    if (refund > 0) {
      await creditSabiRefund({
        userId: String(p.userId), amountKobo: refund, orderId: `${p.id}:unused`,
        reason: `Auto Engagement — ${unused} unused post slot(s) refunded after ${STALE_DAYS} days`,
      }).catch(() => {});
    }
    swept++;
  }
  return swept;
}

/** Reconcile every active package + stale sweep. Called by the cron. */
export async function reconcileActivePackages(): Promise<{ reconciled: number; swept: number }> {
  const r = await sabiExecute({
    sql: `SELECT id FROM SabiEngagementPackage WHERE status = 'active' ORDER BY updatedAt ASC LIMIT 300`,
    args: [],
  }).catch(() => ({ rows: [] as any[] }));
  const ids = (r.rows as any[]).map(x => String(x.id));
  for (const id of ids) await reconcilePackage(id).catch(() => {});
  const swept = await sweepStale().catch(() => 0);
  return { reconciled: ids.length, swept };
}
