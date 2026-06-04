'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const WanderingParticles: React.FC = () => {
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 8 + Math.random() * 4,
    size: 2 + Math.random() * 4,
    startX: Math.random() * 100,
    startY: Math.random() * 100,
    offsetX: (Math.random() - 0.5) * 200,
    offsetY: (Math.random() - 0.5) * 200,
    opacity: 0.1 + Math.random() * 0.3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating Seed Particles */}
      {particles.slice(0, 8).map((particle) => (
        <motion.div
          key={`seed-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.startY}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, rgba(16,185,129,${particle.opacity}), rgba(5,150,105,0))`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(16,185,129,${particle.opacity * 0.8})`,
          }}
          animate={{
            x: [0, particle.offsetX, 0],
            y: [0, particle.offsetY, 0],
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating Orbs - Blue-Purple */}
      {particles.slice(8, 12).map((particle) => (
        <motion.div
          key={`orb-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.startY}%`,
            width: `${particle.size + 2}px`,
            height: `${particle.size + 2}px`,
            background: `radial-gradient(circle, rgba(59,130,246,${particle.opacity}), rgba(139,92,246,0))`,
            boxShadow: `0 0 ${particle.size * 3}px rgba(139,92,246,${particle.opacity})`,
          }}
          animate={{
            x: [particle.offsetX, -particle.offsetX, particle.offsetX],
            y: [particle.offsetY, particle.offsetY * -0.8, particle.offsetY],
            scale: [0.8, 1.3, 0.8],
            opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5],
          }}
          transition={{
            duration: particle.duration + 2,
            delay: particle.delay + 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating Cyan Lights */}
      {particles.slice(12, 15).map((particle) => (
        <motion.div
          key={`light-${particle.id}`}
          className="absolute rounded-full blur-lg"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.startY}%`,
            width: `${particle.size * 1.5}px`,
            height: `${particle.size * 1.5}px`,
            background: `radial-gradient(circle, rgba(6,182,212,${particle.opacity}), transparent)`,
            boxShadow: `0 0 ${particle.size * 4}px rgba(6,182,212,${particle.opacity * 0.6})`,
          }}
          animate={{
            x: [-particle.offsetX, particle.offsetX, -particle.offsetX],
            y: [-particle.offsetY, particle.offsetY, -particle.offsetY],
            scale: [1, 1.5, 1],
            opacity: [particle.opacity * 0.3, particle.opacity * 0.8, particle.opacity * 0.3],
          }}
          transition={{
            duration: particle.duration + 3,
            delay: particle.delay + 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default WanderingParticles;
