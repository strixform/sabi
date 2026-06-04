'use client';

import React from 'react';

interface SabiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SabiLogo: React.FC<SabiLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-16 h-16',
  };

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for triangles - growth upward */}
        <linearGradient id="triangleGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow effect */}
        <radialGradient id="triGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0 }} />
        </radialGradient>

        {/* Accent gradient for inner triangles */}
        <linearGradient id="innerTriGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Outer glow circle */}
      <circle cx="100" cy="100" r="98" fill="url(#triGlow)" />

      {/* Outermost Triangle - Largest */}
      <polygon
        points="100,30 160,160 40,160"
        fill="url(#triangleGrad)"
        opacity="0.9"
      />

      {/* Second Triangle */}
      <polygon
        points="100,50 145,150 55,150"
        fill="url(#innerTriGrad)"
        opacity="0.85"
        style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }}
      />

      {/* Third Triangle */}
      <polygon
        points="100,70 130,140 70,140"
        fill="url(#triangleGrad)"
        opacity="0.8"
      />

      {/* Fourth Triangle */}
      <polygon
        points="100,85 118,130 82,130"
        fill="url(#innerTriGrad)"
        opacity="0.75"
        style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.5))' }}
      />

      {/* Center small triangle - Core */}
      <polygon
        points="100,100 110,120 90,120"
        fill="url(#triangleGrad)"
        opacity="0.9"
        style={{ filter: 'drop-shadow(0 0 3px rgba(6,182,212,0.6))' }}
      />

      {/* Center dot - Unity point */}
      <circle cx="100" cy="110" r="2.5" fill="#ffffff" opacity="0.9" />

      {/* Accent glow points on outer triangle */}
      <circle cx="160" cy="160" r="2" fill="#06b6d4" opacity="0.7" />
      <circle cx="40" cy="160" r="2" fill="#10b981" opacity="0.7" />
      <circle cx="100" cy="35" r="2" fill="#0ea5e9" opacity="0.8" />
    </svg>
  );
};

export default SabiLogo;
