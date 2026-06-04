import type { Metadata } from 'next';
import { Poppins, Space_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';

const poppins = Poppins({ weight: ['400', '600', '700', '900'], subsets: ['latin'] });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] });
const outfit = Outfit({ weight: ['400', '600', '700', '800'], subsets: ['latin'] });

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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={`${outfit.className} bg-slate-950 text-white antialiased`}>
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

        {/* Accessibility Settings */}
        <AccessibilitySettings />
      </body>
    </html>
  );
}
