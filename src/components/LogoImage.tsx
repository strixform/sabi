'use client';

import React from 'react';
import { SabiLogo } from './SabiLogo';

interface LogoImageProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'secondary';
}

/**
 * LogoImage component that displays Sabi logo as an image.
 *
 * Supports two variants:
 * - primary: /sabi-logo.png (main logo)
 * - secondary: /sabi-logo-secondary.png (alternative logo)
 *
 * Falls back to SVG component if image fails to load.
 *
 * Expected image locations in public/:
 * - /sabi-logo.png (256x256, transparent background)
 * - /sabi-logo-secondary.png (256x256, transparent background)
 */
export const LogoImage: React.FC<LogoImageProps> = ({
  size = 'md',
  className = '',
  variant = 'primary'
}) => {
  // If className has explicit sizing, it takes full control
  // Otherwise fall back to the size prop map
  const hasSizeClass = /\bw-\d+/.test(className);
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-16 h-16',
  };
  const sizeClass = hasSizeClass ? '' : sizeMap[size] || 'w-12 h-12';

  const cacheVersion = '?v=2024060502';
  const logoPath = (variant === 'secondary' ? '/sabi-logo-secondary.png' : '/sabi-logo.png') + cacheVersion;

  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return <SabiLogo size={size} className={className} />;
  }

  return (
    <div className={`${sizeClass} ${className} flex items-center justify-center`}>
      <img
        src={logoPath}
        alt="Sabi Logo"
        onError={() => setImageError(true)}
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export default LogoImage;
