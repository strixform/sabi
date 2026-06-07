'use client';

import { useEffect } from 'react';

export default function SabiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SABI Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030507] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white text-xl font-bold">Something went wrong</h2>
        {/* Show actual error in dev so we can debug */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-left">
          <p className="text-red-400 text-xs font-mono break-all">{error?.message || 'Unknown error'}</p>
          {error?.digest && <p className="text-red-400/50 text-[10px] mt-1">digest: {error.digest}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition">
            Try again
          </button>
          <a href="/sabi/login"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition border border-white/10">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
