import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;


export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Last 8 weeks spend from transactions
  const since = new Date();
  since.setDate(since.getDate() - 56);

  const transactions = await prisma.sabiTransaction.findMany({
    where: { userId: session.id, type: 'spend', createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  });

  // Group by week (ISO week starting Monday)
  const weekMap = new Map<string, number>();
  for (const t of transactions) {
    const d = new Date(t.createdAt);
    // Start of the week (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    weekMap.set(key, (weekMap.get(key) || 0) + t.amount);
  }

  // Build 8-week series (fill missing weeks with 0)
  const weeks: { label: string; kobo: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    const label = monday.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    weeks.push({ label, kobo: weekMap.get(key) || 0 });
  }

  // Top services
  const orders = await prisma.sabiOrder.findMany({
    where: { userId: session.id, status: { not: 'cancelled' } },
    select: { serviceType: true, totalPrice: true, status: true },
  });

  const serviceMap = new Map<string, { count: number; kobo: number }>();
  for (const o of orders) {
    const cur = serviceMap.get(o.serviceType) || { count: 0, kobo: 0 };
    serviceMap.set(o.serviceType, { count: cur.count + 1, kobo: cur.kobo + o.totalPrice });
  }

  const topServices = [...serviceMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, d]) => ({ id, ...d }));

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return NextResponse.json({
    success: true,
    weeklySpend: weeks,
    topServices,
    totalOrders,
    completedOrders,
    completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
  });
}
