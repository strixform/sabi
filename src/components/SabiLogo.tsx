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
        {/* Main gradient for seed */}
        <linearGradient id="megaSeedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#047857', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow effect */}
        <radialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
        </radialGradient>

        {/* Shine gradient */}
        <linearGradient id="seedShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Outer glow circle */}
      <circle cx="100" cy="100" r="98" fill="url(#seedGlow)" />

      {/* Main seed shape - oval pod */}
      <ellipse cx="100" cy="95" rx="55" ry="70" fill="url(#megaSeedGrad)" />

      {/* Seed shine/highlight */}
      <ellipse cx="85" cy="65" rx="25" ry="35" fill="url(#seedShine)" opacity="0.8" />

      {/* Seed ridges/texture lines */}
      <path
        d="M 85 50 Q 90 65 85 80"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 100 40 Q 105 65 100 90"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 115 50 Q 110 65 115 80"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Seed stem/tip */}
      <ellipse cx="100" cy="35" rx="12" ry="18" fill="url(#megaSeedGrad)" opacity="0.9" />
      <path
        d="M 100 20 Q 98 28 100 35"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Inner highlight on main body */}
      <ellipse cx="100" cy="100" rx="30" ry="45" fill="rgba(255,255,255,0.15)" />

      {/* Bottom seed detail */}
      <ellipse cx="100" cy="155" rx="35" ry="15" fill="rgba(255,255,255,0.2)" opacity="0.6" />

      {/* Glow particles effect - small dots */}
      <circle cx="65" cy="75" r="3" fill="#34d399" opacity="0.7" />
      <circle cx="135" cy="85" r="2.5" fill="#34d399" opacity="0.6" />
      <circle cx="75" cy="130" r="2" fill="#34d399" opacity="0.5" />
      <circle cx="125" cy="125" r="2.5" fill="#34d399" opacity="0.6" />
    </svg>
  );
};

export default SabiLogo;
