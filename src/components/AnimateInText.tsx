'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimateInTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  type?: 'fade' | 'slide' | 'typewriter' | 'blur' | 'shimmer';
}

export function AnimateInText({ children, className = '', delay = 0, type = 'fade' }: AnimateInTextProps) {
  if (type === 'typewriter' && typeof children === 'string') {
    return (
      <div className={className}>
        {children.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.05,
              delay: delay + i * 0.05,
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  if (type === 'typewriter') {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay }}
      >
        {children}
      </motion.span>
    );
  }

  if (type === 'blur') {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay }}
      >
        {children}
      </motion.span>
    );
  }

  if (type === 'slide') {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        {children}
      </motion.span>
    );
  }

  if (type === 'shimmer') {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, backgroundPosition: '100% center' }}
        animate={{ opacity: 1, backgroundPosition: '0% center' }}
        transition={{ duration: 1, delay }}
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          backgroundSize: '200% center',
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.span>
  );
}
