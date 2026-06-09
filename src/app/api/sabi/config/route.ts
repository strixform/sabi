import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


// Public endpoint â€” returns only non-sensitive config needed by the frontend
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
