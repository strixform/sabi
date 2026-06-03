import { NextRequest, NextResponse } from 'next/server';
import { getOwletSession } from '@/lib/owletAuth';
import { createApiKey, listApiKeys, deleteApiKey } from '@/lib/owletApiKey';

export async function GET(req: NextRequest) {
  try {
    const session = await getOwletSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const keys = await listApiKeys(session.id);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOwletSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const result = await createApiKey(session.id, name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getOwletSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { keyId } = await req.json();
    const result = await deleteApiKey(session.id, keyId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
