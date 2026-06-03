'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid reseller token
    // In a real app, this would verify the JWT token
    // For now, we'll assume the login page handles this

    // Verify token exists
    const hasCookie = document.cookie.includes('reseller_token');
    if (!hasCookie) {
      router.push('/reseller/login');
    }
  }, [router]);

  return <>{children}</>;
}
