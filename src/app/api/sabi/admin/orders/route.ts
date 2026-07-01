import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { prisma } from '@/lib/prisma';
import { releaseNextDripSlice } from '@/lib/sabiOrderEngine';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

// Valid order statuses (matches SabiOrder schema + user-facing additions)
const VALID_STATUSES = ['pending', 'processing', 'in_progress', 'executing', 'completed', 'failed', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

export async function GET(req: NextRequest) {
  try {
    // Owner OR staff may view orders + delivery proofs.
    if (!(await allowOwnerOrStaff(req)).ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page') || '0');
    const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const status = searchParams.get('status') || null;
    const search = searchParams.get('search') || null;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    // Search by user email/name or order ID
    let orders;
    let total;

    if (search) {
      const users = await prisma.sabiUser.findMany({
        where: { OR: [{ email: { contains: search } }, { name: { contains: search } }] },
        select: { id: true },
        take: 100,
      });
      const userIds = users.map(u => u.id);
      const idFilter = search.length > 8 ? [{ id: { contains: search } }] : [];

      where.OR = [...idFilter, ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : [{ userId: '' }])];
    }

    [orders, total] = await Promise.all([
      prisma.sabiOrder.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.sabiOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id:                 order.id,
        serviceType:        order.serviceType,
        targetUrl:          order.targetUrl,
        quantity:           order.quantity,
        completedQuantity:  order.completedQuantity,
        totalPrice:         order.totalPrice,
        status:             order.status,
        createdAt:          order.createdAt,
        estimatedCompletion: order.estimatedCompletion,
        gamesz360CampaignId: order.gamesz360CampaignId,
        user:               order.user,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await checkSabiAdmin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status, adminNote, completedQuantity } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Find the order
    const order = await prisma.sabiOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (status) {
      if (!VALID_STATUSES.includes(status as OrderStatus)) {
        return NextResponse.json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        }, { status: 400 });
      }
      updateData.status = status;
    }

    if (typeof completedQuantity === 'number') {
      const clamped = Math.max(0, Math.min(completedQuantity, order.quantity));
      updateData.completedQuantity = clamped;
      updateData.completionPercentage = Math.round((clamped / order.quantity) * 100);
      // Auto-complete if quantity reached
      if (clamped >= order.quantity && !status) {
        updateData.status = 'completed';
      }
    }

    const updated = await prisma.sabiOrder.update({
      where: { id: orderId },
      data: updateData,
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    // If this update completed the order (explicit status or auto-complete when the
    // quantity is reached), advance any completion-mode drip chain it belongs to.
    if (updated.status === 'completed') await releaseNextDripSlice(updated.id);

    // adminNote: write via raw SQL because targetingNote exists in the Turso DB
    // column but is not declared in the Prisma schema — Prisma would silently drop it.
    if (adminNote) {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE SabiOrder SET targetingNote = ? WHERE id = ?',
          adminNote,
          orderId
        );
      } catch (noteErr) {
        // Non-fatal: log but don't fail the whole update if column doesn't exist
        console.warn('[admin/orders] adminNote write failed (column may not exist):', noteErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id:               updated.id,
        status:           updated.status,
        completedQuantity: updated.completedQuantity,
        completionPercentage: updated.completionPercentage,
        user:             updated.user,
      },
      message: `Order ${orderId.slice(0, 8)}… updated — status: ${updated.status}`,
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
