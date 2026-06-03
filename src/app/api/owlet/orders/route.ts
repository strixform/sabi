import { NextRequest, NextResponse } from 'next/server';
import { getOwletSession } from '@/lib/owletAuth';
import { createOwletOrder, getOwletOrders } from '@/lib/owletOrderEngine';

export async function GET(req: NextRequest) {
  try {
    const session = await getOwletSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const orders = await getOwletOrders(session.id);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOwletSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { serviceId, quantity, targetUrl, paymentMethod, customRef } = body;

    if (!serviceId || !quantity || !targetUrl || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createOwletOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity),
      paymentMethod,
      customRef,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Order creation failed' },
      { status: 500 }
    );
  }
}
