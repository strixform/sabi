import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

// GET: auto top-up settings
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wallet = await prisma.sabiWallet.findUnique({
    where: { userId: session.id },
    select: { autoTopupEnabled: true, autoTopupThreshold: true, autoTopupAmount: true },
  });

  return NextResponse.json({ success: true, ...(wallet || { autoTopupEnabled: false, autoTopupThreshold: 0, autoTopupAmount: 0 }) });
}

// PATCH: update auto top-up settings
export async function PATCH(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { autoTopupEnabled, autoTopupThreshold, autoTopupAmount } = await req.json();

  await prisma.sabiWallet.update({
    where: { userId: session.id },
    data: {
      autoTopupEnabled: Boolean(autoTopupEnabled),
      autoTopupThreshold: Math.max(0, Number(autoTopupThreshold) * 100), // naira → kobo
      autoTopupAmount: Math.max(0, Number(autoTopupAmount) * 100),
    },
  });

  return NextResponse.json({ success: true });
}
