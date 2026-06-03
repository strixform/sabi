'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CuteIconAnimationProps {
  children: ReactNode;
  type?: 'bounce' | 'spin' | 'wiggle' | 'float' | 'pulse-glow' | 'flip' | 'jiggle' | 'zoom';
  delay?: number;
  duration?: number;
  className?: string;
}

export function CuteIconAnimation({
  children,
  type = 'bounce',
  delay = 0,
  duration = 2,
  className = '',
}: CuteIconAnimationProps) {
  const animations = {
    bounce: {
      animate: { y: [0, -15, 0] },
      transition: { duration, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut', delay },
    },
    spin: {
      animate: { rotate: 360 },
      transition: { duration: duration * 2, repeat: Infinity, ease: 'linear', delay },
    },
    wiggle: {
      animate: { rotate: [-3, 3, -3] },
      transition: { duration, repeat: Infinity, ease: 'easeInOut', delay },
    },
    float: {
      animate: {
        y: [0, -10, 0],
        x: [0, 5, -5, 0],
      },
      transition: { duration: duration * 1.5, repeat: Infinity, ease: 'easeInOut', delay },
    },
    pulse_glow: {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
      },
      transition: { duration, repeat: Infinity, ease: 'easeInOut', delay },
    },
    flip: {
      animate: { rotateY: [0, 360] },
      transition: { duration: duration * 2, repeat: Infinity, ease: 'easeInOut', delay },
    },
    jiggle: {
      animate: {
        x: [0, -3, 3, -3, 0],
        rotate: [0, -2, 2, -2, 0],
      },
      transition: { duration, repeat: Infinity, ease: 'easeInOut', delay },
    },
    zoom: {
      animate: { scale: [1, 1.3, 0.9, 1] },
      transition: { duration, repeat: Infinity, ease: 'easeInOut', delay },
    },
  };

  return (
    <motion.div
      className={className}
      {...animations[type]}
    >
      {children}
    </motion.div>
  );
}

interface FloatingIconProps {
  children: ReactNode;
  delay?: number;
  speed?: number;
  className?: string;
}

export function FloatingIcon({ children, delay = 0, speed = 4, className = '' }: FloatingIconProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -25, 0],
        rotate: [0, 5, 0],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
