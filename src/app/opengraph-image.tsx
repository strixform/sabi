import { ImageResponse } from 'next/og';

// Site-wide Open Graph / Twitter card image (1200×630). Generated so social shares
// get a proper landscape card instead of a cropped square logo. Inherited by every
// page unless a segment provides its own opengraph-image.
export const runtime = 'nodejs';
export const alt = 'SABI — powered by 300,000 real Nigerians';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #030507 0%, #0f172a 55%, #1e1b4b 100%)',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: '-2px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SABI
          </div>
          <div style={{ fontSize: 26, color: '#64748b', fontWeight: 600 }}>sability.io</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-2px' }}>
            Powered by 300,000
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', color: '#a5b4fc' }}>
            real Nigerians.
          </div>
          <div style={{ fontSize: 30, color: '#94a3b8', marginTop: '12px', fontWeight: 500 }}>
            Real followers, likes, views &amp; comments · 11 platforms · 50+ services
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          {['Instagram', 'TikTok', 'YouTube', 'X', 'Facebook', 'Target by state · city · gender'].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 22,
                color: '#cbd5e1',
                background: 'rgba(148,163,184,0.12)',
                border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: 999,
                padding: '8px 18px',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
