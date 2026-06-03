'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ResellerData {
  id: string;
  businessName: string;
  businessEmail: string;
  status: string;
}

export function useResellerAuth() {
  const router = useRouter();
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResellerInfo();
  }, []);

  const fetchResellerInfo = async () => {
    try {
      const response = await fetch('/api/reseller/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/reseller/login');
          return;
        }
        throw new Error('Failed to fetch reseller info');
      }
      const data = await response.json();
      setReseller(data.reseller);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      router.push('/reseller/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/reseller/auth/logout', { method: 'POST' });
      router.push('/reseller/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect even if logout fails
      router.push('/reseller/login');
    }
  };

  return {
    reseller,
    loading,
    error,
    logout,
    refetch: fetchResellerInfo,
  };
}
