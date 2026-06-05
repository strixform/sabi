import webpush from 'web-push';
import { createClient } from '@libsql/client';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'noreply@sability.io'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

function db() {
  let url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  const auth = (process.env.TURSO_AUTH_TOKEN || '').trim();
  if (url.startsWith('libsql://')) url = url.replace('libsql://', 'https://');
  return createClient({ url, authToken: auth });
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  badge?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  try {
    const client = db();
    const subs = (await client.execute({ sql: `SELECT endpoint, p256dh, auth FROM SabiPushSubscription WHERE userId=?`, args: [userId] })).rows;

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/sabi-favicon.png',
      badge: payload.badge || '/sabi-favicon-maskable.png',
      url: payload.url || 'https://sability.io/sabi/dashboard',
    });

    const results = await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            notification,
            { TTL: 86400 }
          );
        } catch (err: any) {
          // 410 Gone = subscription expired, remove it
          if (err.statusCode === 410) {
            await client.execute({ sql: `DELETE FROM SabiPushSubscription WHERE endpoint=?`, args: [sub.endpoint] });
          }
          throw err;
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[PUSH] Sent to ${sent}/${subs.length} subscriptions for user ${userId}`);
  } catch (err) {
    console.error('[PUSH] Error:', err);
  }
}
