import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

// GET: list user's templates
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await prisma.sabiOrderTemplate.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ success: true, templates });
}

// POST: save a new template
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, serviceId, quantity, targetUrl, audienceGender, audienceLocation, commentGender, commentInstructions } = body;
  if (!name?.trim() || !serviceId || !quantity) {
    return NextResponse.json({ error: 'name, serviceId and quantity are required' }, { status: 400 });
  }

  const template = await prisma.sabiOrderTemplate.create({
    data: {
      userId: session.id,
      name: name.trim(),
      serviceId,
      quantity: Number(quantity),
      targetUrl: targetUrl || null,
      audienceGender: audienceGender || null,
      audienceLocation: audienceLocation || null,
      commentGender: commentGender || null,
      commentInstructions: commentInstructions || null,
    },
  });

  return NextResponse.json({ success: true, template });
}

// DELETE: remove a template
export async function DELETE(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await prisma.sabiOrderTemplate.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ success: true });
}
