import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const ng = (kobo: number) => `₦${Math.round((kobo || 0) / 100).toLocaleString()}`;

/**
 * SABI assistant — answers buyers' common questions from their real data (wallet, orders,
 * how ordering works). Rule-based, instant, no AI cost. NEVER reveals how fulfilment works
 * beyond "real people" — no mention of gamers360, taskers, or points.
 */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = String((await req.json().catch(() => ({}))).query || '').toLowerCase().trim();

  const [wallet, recent, activeCount, doneCount] = await Promise.all([
    prisma.sabiWallet.findUnique({ where: { userId: session.id }, select: { balance: true } }).catch(() => null),
    prisma.sabiOrder.findFirst({ where: { userId: session.id }, orderBy: { createdAt: 'desc' }, select: { serviceType: true, quantity: true, completedQuantity: true, status: true, createdAt: true } }).catch(() => null),
    prisma.sabiOrder.count({ where: { userId: session.id, status: { in: ['pending', 'processing', 'executing'] } } }).catch(() => 0),
    prisma.sabiOrder.count({ where: { userId: session.id, status: 'completed' } }).catch(() => 0),
  ]);
  const bal = wallet?.balance || 0;
  const has = (...ks: string[]) => ks.some(k => q.includes(k));

  let answer = '';
  let chips: { label: string; href: string }[] = [];

  if (!q || has('hi', 'hello', 'hey', 'help', 'what can you')) {
    answer = `Hi 👋 I can check your wallet balance, your order status, walk you through placing an order, or explain refunds. What do you need?`;
    chips = [{ label: 'My balance', href: '/sabi/wallet' }, { label: 'My orders', href: '/sabi/orders' }, { label: 'New order', href: '/sabi/dashboard' }];
  } else if (has('balance', 'wallet', 'how much', 'fund', 'top up', 'topup', 'add money')) {
    answer = `Your wallet balance is ${ng(bal)}. Fund it by card or bank transfer, then spend it on any service.`;
    chips = [{ label: 'Fund wallet', href: '/sabi/wallet' }];
  } else if (has('order status', 'my order', 'where is', 'track', 'progress', 'delivered', 'not delivered', 'pending', 'complete')) {
    if (recent) {
      const pct = recent.quantity > 0 ? Math.round((recent.completedQuantity / recent.quantity) * 100) : 0;
      answer = `Your latest order (${recent.serviceType}, ${recent.quantity.toLocaleString()}) is ${recent.status} — ${pct}% delivered so far. Orders are fulfilled by real people, so they roll in gradually.${activeCount > 1 ? ` You have ${activeCount} orders in progress.` : ''}`;
    } else {
      answer = `You don't have any orders yet. Pick a service and place your first one — it's fulfilled by real people.`;
    }
    chips = [{ label: 'My orders', href: '/sabi/orders' }];
  } else if (has('place', 'new order', 'how to order', 'buy', 'start', 'create order')) {
    answer = `To place an order: open the dashboard, pick a service (followers, likes, views, comments…), paste your link, choose the quantity, and confirm. It's paid from your wallet and delivered by real people.`;
    chips = [{ label: 'Place an order', href: '/sabi/dashboard' }];
  } else if (has('refund', 'money back', 'cancel', 'didn\'t work', 'failed')) {
    answer = `If an order can't be completed, the unfulfilled part is refunded to your SABI wallet automatically. You can see any refunds in your wallet history.`;
    chips = [{ label: 'Wallet history', href: '/sabi/wallet' }];
  } else if (has('slow', 'how long', 'take', 'speed', 'when will')) {
    answer = `Delivery is gradual because real people fulfil each order — smaller orders finish faster, larger ones spread out to look natural. You can watch progress on the Orders page.`;
    chips = [{ label: 'My orders', href: '/sabi/orders' }];
  } else if (has('price', 'cost', 'cheap', 'rate', 'how much for')) {
    answer = `Prices depend on the service and quantity — you'll see the exact cost before you confirm any order. No hidden charges.`;
    chips = [{ label: 'See services', href: '/sabi/dashboard' }];
  } else if (has('safe', 'ban', 'risk', 'real', 'fake', 'drop')) {
    answer = `Your engagement comes from real people, delivered at a natural pace — that's what keeps it safe and lasting. You never share your password with us.`;
    chips = [{ label: 'Place an order', href: '/sabi/dashboard' }];
  } else {
    answer = `I can help with your wallet, order status, placing an order, refunds and delivery times. Try "what's my balance" or "where is my order".`;
    chips = [{ label: 'My orders', href: '/sabi/orders' }, { label: 'Support', href: '/sabi/support' }];
  }

  return NextResponse.json({ answer, chips, stats: { balance: bal, activeOrders: activeCount, completedOrders: doneCount } });
}
