import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;


// List the current user's favorite service IDs
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const favorites = await prisma.sabiFavorite.findMany({
    where: { userId: session.id },
    select: { serviceId: true },
  });
  return NextResponse.json({ success: true, serviceIds: favorites.map((f) => f.serviceId) });
}

// Add a favorite
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { serviceId } = await req.json();
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

  await prisma.sabiFavorite.upsert({
    where: { userId_serviceId: { userId: session.id, serviceId } },
    create: { userId: session.id, serviceId },
    update: {},
  });
  return NextResponse.json({ success: true });
}

// Remove a favorite
export async function DELETE(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { serviceId } = await req.json();
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

  await prisma.sabiFavorite.deleteMany({ where: { userId: session.id, serviceId } });
  return NextResponse.json({ success: true });
}
