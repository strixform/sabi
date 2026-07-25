'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating SUPPORT button. WhatsApp support was retired in favour of in-app AI-answered
 * tickets — this now opens the /sabi/support chat. (Component name kept so existing imports
 * keep working.)
 */
export function WhatsAppButton() {
  const [show, setShow] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShow(true), 1200); return () => clearTimeout(t); }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
        >
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-[#111827] border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-xl"
              >
                Need help? Chat with us
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#111827] border-r border-t border-white/10 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.a
            href="/sabi/support"
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-white text-2xl"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            aria-label="Support"
          >
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
            <span className="relative z-10">💬</span>
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
