import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

// GET: return full profile data for the logged-in user
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.sabiUser.findUnique({
    where: { id: session.id },
    select: {
      id: true, name: true, email: true, businessName: true,
      phone: true, emailVerified: true, notifyEmail: true,
      createdAt: true, googleId: true, referralCode: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true, user });
}

// PATCH: update profile fields
export async function PATCH(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, name, businessName, notifyEmail, newEmail, currentPassword, newPassword } = body;

  const user = await prisma.sabiUser.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // ── Update display name / business name ──────────────────────────────────
  if (action === 'updateInfo') {
    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (businessName !== undefined) updates.businessName = businessName?.trim() || null;
    if (notifyEmail !== undefined) updates.notifyEmail = Boolean(notifyEmail);
    await prisma.sabiUser.update({ where: { id: user.id }, data: updates });
    return NextResponse.json({ success: true, message: 'Profile updated' });
  }

  // ── Change email ──────────────────────────────────────────────────────────
  if (action === 'changeEmail') {
    if (!newEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    const taken = await prisma.sabiUser.findUnique({ where: { email: newEmail.toLowerCase().trim() } });
    if (taken && taken.id !== user.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    // Require password confirmation for email change
    if (!currentPassword) return NextResponse.json({ error: 'Current password required to change email' }, { status: 400 });
    if (!user.passwordHash) return NextResponse.json({ error: 'Google accounts cannot change email here' }, { status: 400 });
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.sabiUser.update({
      where: { id: user.id },
      data: {
        email: newEmail.toLowerCase().trim(),
        emailVerified: false,
        verifyCode: code,
        verifyCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    // Send verification email to new address
    try {
      const { sendVerificationEmail } = await import('@/lib/email');
      await sendVerificationEmail(newEmail.toLowerCase().trim(), code, user.name);
    } catch {}
    return NextResponse.json({ success: true, message: 'Email updated. Please verify your new email address.' });
  }

  // ── Change password ───────────────────────────────────────────────────────
  if (action === 'changePassword') {
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Google accounts cannot set a password here. Use forgot password instead.' }, { status: 400 });
    }
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });

    const newHash = await hash(newPassword, 10);
    await prisma.sabiUser.update({
      where: { id: user.id },
      data: { passwordHash: newHash, sessionToken: null }, // invalidate all sessions
    });
    return NextResponse.json({ success: true, message: 'Password changed. Please log in again.' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
