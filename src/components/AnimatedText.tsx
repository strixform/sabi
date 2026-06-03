'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedText({ children, className = '', delay = 0, duration = 0.8 }: AnimatedTextProps) {
  const words = children.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`inline ${className}`}>
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariants} className="inline-block mr-2">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function GradientText({ children, className = '', animate = true }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ${className}`}
      animate={
        animate && {
          backgroundPosition: ['0%', '100%', '0%'],
        }
      }
      transition={animate ? { duration: 8, repeat: Infinity, ease: 'linear' } : undefined}
      style={animate ? { backgroundSize: '200% 200%' } : undefined}
    >
      {children}
    </motion.span>
  );
}
