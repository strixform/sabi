import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { createSabiSession } from '@/lib/sabiAuth';
import crypto from 'crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    // Migrations applied - database ready

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_no_code`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "685195293928-3aqb2gaq85a92ctc145rgnddk2j7jdr6.apps.googleusercontent.com",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/api/sabi/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', errorText);
      console.error('[Google OAuth] Status:', tokenResponse.status);
      console.error('[Google OAuth] Client Secret set:', !!process.env.GOOGLE_CLIENT_SECRET);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_token_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Google OAuth] User info fetch failed:', await userInfoResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_profile_failed`
      );
    }

    const googleUser = await userInfoResponse.json();
    const { email, name, sub: googleId } = googleUser;

    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_no_email`
      );
    }

    // Find or create user
    let user = await prisma.sabiUser.findUnique({ where: { email } });

    if (!user) {
      // Create new user with Google ID
      user = await prisma.sabiUser.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId,
          emailVerified: true, // Google emails are verified
          passwordHash: await hash(crypto.randomBytes(32).toString('hex'), 10), // Random password
          wallet: { create: {} },
        },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.sabiUser.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true },
      });
    }

    // Create session and get token
    const token = await createSabiSession(user.id);

    // Redirect to dashboard
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/dashboard`
    );

    // Set cookies on the redirect response
    response.cookies.set('sabi_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('sabi_session_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    console.error('[Google OAuth] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Google OAuth] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_exception`
    );
  }
}
