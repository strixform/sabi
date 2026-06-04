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
        <linearGradient id="sabiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="100" cy="100" r="100" fill="url(#sabiGrad)" />

      {/* Shopping Cart Body */}
      <path
        d="M 60 80 L 65 140 Q 65 150 75 150 L 165 150 Q 175 150 175 140 L 180 80 Z"
        fill="white"
        opacity="0.95"
      />

      {/* Cart Handle */}
      <path
        d="M 75 80 Q 120 40 165 80"
        stroke="white"
        strokeWidth="6"
        fill="none"
        opacity="0.95"
        strokeLinecap="round"
      />

      {/* Verified Checkmark (bottom right) */}
      <circle cx="155" cy="155" r="28" fill="#10b981" />
      <path
        d="M 145 155 L 152 162 L 168 148"
        stroke="white"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small accent lines on cart */}
      <line x1="85" y1="100" x2="85" y2="130" stroke="url(#sabiGrad)" strokeWidth="3" opacity="0.6" />
      <line x1="120" y1="100" x2="120" y2="130" stroke="url(#sabiGrad)" strokeWidth="3" opacity="0.6" />
      <line x1="155" y1="100" x2="155" y2="130" stroke="url(#sabiGrad)" strokeWidth="3" opacity="0.6" />
    </svg>
  );
};

export default SabiLogo;
