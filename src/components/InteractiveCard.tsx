'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
}

export function InteractiveCard({ children, className = '', delay = 0, glowColor = 'purple' }: InteractiveCardProps) {
  const glowMap = {
    blue: 'hover:shadow-blue-500/50',
    purple: 'hover:shadow-purple-500/50',
    pink: 'hover:shadow-pink-500/50',
    cyan: 'hover:shadow-cyan-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{
        y: -5,
        transition: { duration: 0.3 },
      }}
      className={`relative group ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-${glowColor}-600/0 to-${glowColor}-600/0 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition duration-500`} />
      <div
        className={`relative h-full backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden group-hover:border-${glowColor}-500/50 transition duration-300 ${glowMap[glowColor as keyof typeof glowMap] || 'hover:shadow-purple-500/50'} hover:shadow-2xl`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function PulsingDot({ color = 'blue' }: { color?: string }) {
  return (
    <motion.div
      className={`w-2 h-2 rounded-full bg-${color}-400`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
    />
  );
}
