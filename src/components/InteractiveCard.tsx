'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
}

// Accent colours mapped to subtle glow values safe for inline styles
const ACCENT: Record<string, string> = {
  blue:   'rgba(37,99,235,0.12)',
  purple: 'rgba(124,58,237,0.12)',
  pink:   'rgba(236,72,153,0.12)',
  cyan:   'rgba(6,182,212,0.12)',
  emerald:'rgba(16,185,129,0.12)',
  orange: 'rgba(249,115,22,0.12)',
};

export function InteractiveCard({ children, className = '', delay = 0, glowColor = 'purple' }: InteractiveCardProps) {
  const glow = ACCENT[glowColor] || ACCENT.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      className={`relative group ${className}`}
    >
      {/* Hover glow — paint it with inline style so Tailwind purge can't strip dynamic class names */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 30%, ${glow}, transparent 70%)` }} />

      <div
        className="relative h-full rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-500 group-hover:border-white/12 group-hover:shadow-[0_24px_70px_-30px_rgba(201,168,92,0.28)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function PulsingDot({ color = 'blue' }: { color?: string }) {
  const dotColor = color === 'emerald' ? '#34D399' : color === 'blue' ? '#60A5FA' : '#A78BFA';
  return (
    <motion.div
      className="w-2 h-2 rounded-full"
      style={{ background: dotColor }}
      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}
