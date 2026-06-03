import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder, getSabiOrders } from '@/lib/sabiOrderEngine';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orders = await getSabiOrders(session.id);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { serviceId, quantity, targetUrl, paymentMethod } = body;

    if (!serviceId || !quantity || !targetUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createSabiOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity),
      paymentMethod: paymentMethod || 'flutterwave',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
