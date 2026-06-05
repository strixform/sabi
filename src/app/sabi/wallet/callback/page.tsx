'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLoader, FiCheck, FiX } from 'react-icons/fi';

export const dynamic = 'force-dynamic';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log all query parameters for debugging
        const allParams = Array.from(searchParams.entries());
        console.log('[CALLBACK] All query params:', allParams.map(([k, v]) => `${k}=${v}`).join(', '));

        // Try transaction_id first (numeric ID), then tx_ref (string reference)
        let transactionId = searchParams.get('transaction_id');
        let paramSource = 'transaction_id';

        if (!transactionId) {
          transactionId = searchParams.get('tx_ref');
          paramSource = 'tx_ref';
        }

        const status = searchParams.get('status');

        console.log('[CALLBACK] Parameters:', {
          transactionId,
          paramSource,
          status,
          fullUrl: window.location.href,
        });

        if (!transactionId) {
          setStatus('error');
          setMessage('No transaction ID provided. Query params: ' + allParams.map(([k, v]) => `${k}=${v}`).join(', '));
          setTimeout(() => router.push('/sabi/wallet'), 3000);
          return;
        }

        // Verify payment with backend
        const res = await fetch('/api/sabi/wallet/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId, status }),
          credentials: 'include',
        });

        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage('✅ Payment successful! Your wallet has been credited.');
          setTimeout(() => router.push('/sabi/wallet'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
          setTimeout(() => router.push('/sabi/wallet'), 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('Error processing payment');
        setTimeout(() => router.push('/sabi/wallet'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <FiLoader className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-lg text-slate-300">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <FiCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <p className="text-lg text-emerald-300">{message}</p>
            <p className="text-sm text-slate-400 mt-4">Redirecting to wallet...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <FiX className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-lg text-red-300">{message}</p>
            <p className="text-sm text-slate-400 mt-4">Redirecting to wallet...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <FiLoader className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-lg text-slate-300">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
