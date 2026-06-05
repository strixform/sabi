'use client';

// Unified dark background matching the home page design system.
// Replaces the old animated orbs — restrained, atmospheric, consistent.
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#030507]">
      {/* Dot grid texture */}
      <div className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      {/* Ambient top glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(29,78,216,0.08) 0%, rgba(88,28,220,0.04) 45%, transparent 70%)', filter: 'blur(40px)' }} />
    </div>
  );
}
