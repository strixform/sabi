import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — returns only non-sensitive config needed by the frontend
export async function GET() {
  try {
    const config = await prisma.sABIAdminConfig.findFirst();
    return NextResponse.json({
      success: true,
      supportWhatsapp: (config as any)?.supportWhatsapp || null,
    });
  } catch {
    return NextResponse.json({ success: true, supportWhatsapp: null });
  }
}
