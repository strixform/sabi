'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiWhatsapp } from 'react-icons/si';

export function WhatsAppButton() {
  const [number, setNumber] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  useEffect(() => {
    fetch('/api/sabi/config')
      .then(r => r.json())
      .then(d => {
        const n = d.supportWhatsapp;
        if (n) { setNumber(n); setTimeout(() => setShow(true), 1500); }
      })
      .catch(() => {});
  }, []);

  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent('Hi SABI Support, I need help with my account.')}`;

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
          {/* Tooltip */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-[#111827] border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap shadow-xl"
              >
                Chat with us on WhatsApp
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#111827] border-r border-t border-white/10 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            aria-label="WhatsApp Support"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
            <SiWhatsapp className="w-7 h-7 text-white relative z-10" />
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
