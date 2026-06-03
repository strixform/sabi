import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface ResellerPayload {
  resellerId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export async function verifyResellerToken(): Promise<ResellerPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('reseller_token')?.value;

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as ResellerPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getResellerId(): Promise<string | null> {
  const payload = await verifyResellerToken();
  return payload?.resellerId || null;
}

export async function getResellerInfo(): Promise<ResellerPayload | null> {
  return await verifyResellerToken();
}

export function setResellerCookie(token: string): void {
  // This is handled server-side in the API route
  // Client-side, the cookie is set via NextResponse
}

export function clearResellerCookie(): void {
  // This is handled server-side in the API route
}
