import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSabiSession } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // 10 attempts per 10 minutes per IP — prevents 6-digit brute force
  const rl = await checkRateLimit(getRateLimitKey(req, 'verify'), 10, 10 * 60000);
  if (!rl.allowed) return rateLimitResponse(10, rl.resetTime);

  try {
    const { code } = await req.json();
    if (!code?.trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    // Can verify via session or by code lookup
    const session = await getSabiSession();

    const user = session
      ? await prisma.sabiUser.findUnique({ where: { id: session.id } })
      : await prisma.sabiUser.findFirst({ where: { verifyCode: code.trim() } });

    if (!user) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });
    if (user.verifyCode !== code.trim()) return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    if (user.verifyCodeExpiry && user.verifyCodeExpiry < new Date()) {
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 });
    }

    await prisma.sabiUser.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyCode: null, verifyCodeExpiry: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

// Resend verification email
export async function PUT(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.sabiUser.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.sabiUser.update({
      where: { id: user.id },
      data: { verifyCode: code, verifyCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    const { sendVerificationEmail } = await import('@/lib/email');
    await sendVerificationEmail(user.email, code, user.name);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to resend' }, { status: 500 });
  }
}
