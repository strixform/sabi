import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder, getSabiOrders } from '@/lib/sabiOrderEngine';
import { getCachedOrders, setCachedOrders } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try cache first (5 minute TTL)
    let cachedData = await getCachedOrders(session.id);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        orders: cachedData,
        cached: true,
      });
    }

    const orders = await getSabiOrders(session.id);

    // Cache for 5 minutes
    await setCachedOrders(session.id, orders, 300);

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
    const {
      serviceId, quantity, targetUrl, paymentMethod,
      audienceGender, audienceLocation, commentGender, commentInstructions,
    } = body;

    if (!serviceId || !quantity || !targetUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createSabiOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity),
      paymentMethod: paymentMethod || 'flutterwave',
      audienceGender,
      audienceLocation,
      commentGender,
      commentInstructions,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
