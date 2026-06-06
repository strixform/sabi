'use client';

import React from 'react';
import { SabiLogo } from './SabiLogo';

interface LogoImageProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const LogoImage: React.FC<LogoImageProps> = ({
  size = 'md',
  className = '',
  variant = 'primary'
}) => {
  // Detect any explicit size class — w-*, h-*, or auto/full variants
  // so caller's className fully controls sizing with no conflicts
  const hasSizeClass = /\b[wh]-(?:\d+|auto|full|screen|fit|px)\b/.test(className);

  const sizeMap = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
  };
  const sizeClass = hasSizeClass ? '' : (sizeMap[size] || 'h-10 w-auto');

  // Bust cache so transparent logos are fetched fresh
  const cacheVersion = '?v=transparent1';
  const logoPath = (variant === 'secondary' ? '/sabi-logo-secondary.png' : '/sabi-logo.png') + cacheVersion;

  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return <SabiLogo size={size} className={className} />;
  }

  return (
    <img
      src={logoPath}
      alt="Sabi Logo"
      onError={() => setImageError(true)}
      className={`${sizeClass} ${className} object-contain`}
      style={{ background: 'transparent', display: 'block' }}
      loading="eager"
    />
  );
};

export default LogoImage;
