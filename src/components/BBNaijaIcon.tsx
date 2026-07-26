import React from 'react';

/**
 * BBNaija category mark — the Big Brother "eye" in an outline that reads at any size.
 * A generic eye (not the show's exact logo) so we stay clear of trademark, while still
 * instantly signalling "Big Brother Naija". Inherits colour via `currentColor`, so the
 * page's per-platform tint/style still applies.
 */
export function BBNaijaIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* eye almond */}
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      {/* iris */}
      <circle cx="12" cy="12" r="3.4" />
      {/* pupil highlight */}
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default BBNaijaIcon;
