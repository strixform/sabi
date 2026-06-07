'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiBellOff, FiX } from 'react-icons/fi';

// Convert VAPID public key (base64url) to Uint8Array
// Must only be called in browser context (inside useEffect / event handlers).
// window.atob is not available during Next.js SSR — using Buffer as fallback.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  // atob is safe here because this function is only ever called from inside useEffect
  const rawData = typeof window !== 'undefined'
    ? window.atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function PushNotificationPrompt() {
  const [state, setState] = useState<'idle' | 'prompt' | 'subscribed' | 'denied' | 'unsupported'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return;
    }
    if (localStorage.getItem('push_dismissed')) { setDismissed(true); return; }
    const perm = Notification.permission;
    if (perm === 'granted') { setState('subscribed'); return; }
    if (perm === 'denied') { setState('denied'); return; }
    // Show prompt after 3s (don't be annoying immediately)
    const t = setTimeout(() => setState('prompt'), 3000);
    return () => clearTimeout(t);
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const p256dhRaw = sub.getKey('p256dh');
      const authRaw = sub.getKey('auth');
      if (!p256dhRaw || !authRaw) throw new Error('Missing keys');

      const p256dh = btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhRaw))));
      const auth = btoa(String.fromCharCode(...Array.from(new Uint8Array(authRaw))));

      await fetch('/api/sabi/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh, auth } }),
      });
      setState('subscribed');
    } catch {
      setState('denied');
    }
  };

  const dismiss = () => {
    localStorage.setItem('push_dismissed', '1');
    setDismissed(true);
    setState('idle');
  };

  if (dismissed || state === 'idle' || state === 'subscribed' || state === 'unsupported' || state === 'denied') {
    return null;
  }

  return (
    <AnimatePresence>
      {state === 'prompt' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: 'rgba(10,13,20,0.95)', backdropFilter: 'blur(24px)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FiBell className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm mb-1">Get order updates</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Know the moment your order starts and when it's delivered — without checking the app.
                </p>
                <div className="flex gap-2 mt-4">
                  <button onClick={subscribe}
                    className="flex-1 py-2 rounded-xl bg-white/90 text-black text-xs font-bold hover:bg-white transition-colors">
                    Enable notifications
                  </button>
                  <button onClick={dismiss}
                    className="px-3 py-2 rounded-xl border border-white/[0.08] text-white/40 text-xs hover:text-white/60 transition-colors">
                    Not now
                  </button>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
