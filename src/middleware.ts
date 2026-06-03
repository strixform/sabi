import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect reseller dashboard routes
  if (pathname.startsWith('/reseller/dashboard')) {
    const token = request.cookies.get('reseller_token');

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/reseller/login', request.url));
    }
  }

  // Allow reseller login page without token
  if (pathname === '/reseller/login') {
    const token = request.cookies.get('reseller_token');

    // If already logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/reseller/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/reseller/dashboard/:path*',
    '/reseller/login',
  ],
};
