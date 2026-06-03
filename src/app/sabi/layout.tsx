'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSabiSession, clearSabiSession } from '@/lib/sabiAuth';

export default function SabiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/sabi/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/sabi/auth/logout', { method: 'POST' });
    window.location.href = '/sabi/login';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎯 SABI
          </Link>
          <div className="flex gap-4 items-center">
            {!loading && session ? (
              <>
                <Link href="/sabi/dashboard" className="text-sm font-semibold hover:text-blue-400 transition">
                  Dashboard
                </Link>
                <Link href="/sabi/order" className="text-sm font-semibold hover:text-blue-400 transition">
                  New Order
                </Link>
                <Link href="/sabi/api-keys" className="text-sm font-semibold hover:text-blue-400 transition">
                  API Keys
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/sabi/login" className="text-sm font-semibold hover:text-blue-400 transition">
                  Login
                </Link>
                <Link href="/sabi/register" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
