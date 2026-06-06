'use client';

import React from 'react';

interface LogoImageProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'secondary';
  // Direct height override in pixels — bypasses Tailwind purge entirely
  height?: number;
}

// Height presets in px
const SIZE_PX: Record<string, number> = { sm: 32, md: 40, lg: 56 };

export const LogoImage: React.FC<LogoImageProps> = ({
  size = 'md',
  className = '',
  variant = 'primary',
  height,
}) => {
  // New filenames bypass ALL CDN/browser caches (Cloudflare, Vercel, browser)
  const logoPath = variant === 'secondary'
    ? '/sabi-logo-main-clear.png'
    : '/sabi-logo-clear.png';

  const [imageError, setImageError] = React.useState(false);

  // Resolve final height: explicit prop > className height > size map
  const heightMatch = className.match(/\bh-(\d+)\b/);
  const tailwindH = heightMatch ? parseInt(heightMatch[1]) * 4 : null; // Tailwind: h-14 = 56px
  const finalHeight = height ?? tailwindH ?? SIZE_PX[size] ?? 40;

  if (imageError) {
    // Fallback: just show text if image fails
    return (
      <span
        className={className}
        style={{ fontSize: finalHeight * 0.6, fontWeight: 900, letterSpacing: '-0.04em', color: 'white' }}>
        SABI
      </span>
    );
  }

  return (
    <img
      src={logoPath}
      alt="Sabi"
      onError={() => setImageError(true)}
      className={className}
      style={{
        height: finalHeight,
        width: 'auto',
        display: 'block',
        background: 'transparent',
        objectFit: 'contain',
      }}
      loading="eager"
    />
  );
};

export default LogoImage;
