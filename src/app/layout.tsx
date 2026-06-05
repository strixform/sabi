import type { Metadata } from 'next';
import { Poppins, Space_Mono, Outfit, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const poppins = Poppins({ weight: ['400', '600', '700', '900'], subsets: ['latin'] });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] });
const outfit = Outfit({ weight: ['300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'] });
const playfair = Playfair_Display({ weight: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: '🎯 Sabi - 100% REAL Nigerian Social Media Engagement',
  description: '✅ 100% Active & Real Nigerian Users | ✅ Verified Gamers | ✅ Real Engagement | Get Real Followers, Likes, Views & Comments from Nigeria\'s Interactive Reward Economy',
  keywords: 'Nigerian followers, real engagement, Instagram followers, TikTok followers, Twitter followers, YouTube subscribers, Facebook likes, real users, gaming community',
  openGraph: {
    title: 'Sabi - Real Nigerian Social Media Engagement',
    description: '100% Real and Active Nigerian users. Get genuine followers, likes, comments, and engagement powered by gamers.',
    type: 'website',
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
        <meta name="description" content="Place SMM orders with verified Nigerian gamers" />
        <link rel="icon" href="/sabi-favicon.png?v=2024060502" type="image/png" />
        <link rel="apple-touch-icon" href="/sabi-favicon.png?v=2024060502" />
        <link rel="shortcut icon" href="/sabi-favicon.png?v=2024060502" type="image/png" />
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
