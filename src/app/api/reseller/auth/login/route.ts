import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { jwtSecret } from '@/lib/jwtSecret';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find reseller
    const reseller = await prisma.reseller.findUnique({
      where: { businessEmail: email },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check status
    if (reseller.status !== 'approved' && reseller.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not yet approved or has been suspended' },
        { status: 403 }
      );
    }

    // For now, accept any password. In production, implement proper password hashing
    // TODO: Hash passwords with bcrypt when sign-up is implemented
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      resellerId: reseller.id,
      email: reseller.businessEmail,
      name: reseller.businessName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(jwtSecret());

    // Update last login
    await prisma.reseller.update({
      where: { id: reseller.id },
      data: { updatedAt: new Date() },
    });

    // Create response with token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      reseller: {
        id: reseller.id,
        businessName: reseller.businessName,
        businessEmail: reseller.businessEmail,
        status: reseller.status,
      },
    });

    response.cookies.set('reseller_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Reseller login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
