import type { Metadata } from 'next';
import { Poppins, Space_Mono, Outfit, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { JsonLd } from '@/components/JsonLd';
import { organizationLd, websiteLd } from '@/lib/seo';

const poppins = Poppins({ weight: ['400', '600', '700', '900'], subsets: ['latin'] });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] });
const outfit = Outfit({ weight: ['300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'] });
const playfair = Playfair_Display({ weight: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  // `default` is used on the home page; every other page sets its own title and the
  // template appends " · SABI".
  title: {
    default: 'SABI — Nigeria\'s Social Infrastructure',
    template: '%s · SABI',
  },
  description: 'The only social media growth platform powered by 300,000 real Nigerians. Real followers, likes, views and comments across 11 platforms. Target by state, city and gender. Orders start within minutes.',
  keywords: 'Nigerian followers, real engagement, Instagram followers Nigeria, TikTok followers Nigeria, YouTube subscribers Nigeria, Lagos followers, Abuja audience, real Nigerian users, social growth Nigeria, buy followers Nigeria, SMM panel Nigeria',
  applicationName: 'SABI',
  authors: [{ name: 'SABI' }],
  creator: 'SABI',
  publisher: 'SABI',
  // OG/Twitter images come from app/opengraph-image.tsx (1200×630, generated).
  openGraph: {
    title: 'SABI — Powered by 300,000 Real Nigerians',
    description: 'Real followers. Real comments. Real engagement — from verified Nigerians across every state. 11 platforms. 50+ services. Orders start within minutes.',
    type: 'website',
    siteName: 'SABI',
    locale: 'en_NG',
    url: 'https://sability.io',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SABI — Nigeria\'s Social Infrastructure',
    description: '300,000 real Nigerians powering your social growth. Every platform. Every state.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://sability.io' },
  metadataBase: new URL('https://sability.io'),
  icons: {
    icon: '/favicon.ico?v=20260625',
    apple: '/sabi-favicon-maskable.png?v=20260625',
    shortcut: '/favicon.ico?v=20260625',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SABI" />
        <meta name="application-name" content="SABI" />

        {/* Site-wide structured data — Organization + WebSite (with sitelinks search) */}
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <meta name="description" content="Grow your social media with verified real Nigerian users" />
        <link rel="icon" href="/favicon.ico?v=20260625" sizes="any" />
        <link rel="icon" href="/sabi-favicon.png?v=20260625" type="image/png" />
        <link rel="apple-touch-icon" href="/sabi-favicon.png?v=20260625" />
        <link rel="shortcut icon" href="/sabi-favicon.png?v=20260625" type="image/png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${outfit.className} ${playfair.variable} bg-[#030507] text-white antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Premium animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Accessibility Settings */}
        <AccessibilitySettings />

        {/* Vercel Analytics */}
        <Analytics />

        {/* Vercel Speed Insights */}
        <SpeedInsights />

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((registration) => {
                  console.log('[PWA] Service Worker registered:', registration);
                })
                .catch((error) => {
                  console.log('[PWA] Service Worker registration failed:', error);
                });
            }

            // Install prompt handling
            let installPrompt = null;
            window.addEventListener('beforeinstallprompt', (e) => {
              e.preventDefault();
              installPrompt = e;
              console.log('[PWA] Install prompt available');
            });

            // Auto-show install prompt on dashboard (optional)
            if (window.location.pathname === '/sabi/dashboard' && installPrompt) {
              console.log('[PWA] Ready to install');
            }

            window.addEventListener('appinstalled', () => {
              console.log('[PWA] SABI installed!');
            });
          `}
        </Script>
      </body>
    </html>
  );
}
