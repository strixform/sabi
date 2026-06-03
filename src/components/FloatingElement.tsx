'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingElementProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function FloatingElement({ children, delay = 0, duration = 4, distance = 20 }: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface GlowingElementProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowingElement({ children, className = '', glowColor = 'from-blue-500' }: GlowingElementProps) {
  return (
    <motion.div
      className={className}
      whileHover={{
        filter: 'brightness(1.2)',
      }}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${glowColor} to-purple-500 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition duration-500`} />
      {children}
    </motion.div>
  );
}
