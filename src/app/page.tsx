import Link from 'next/link';
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook } from 'react-icons/si';
import { SiX } from 'react-icons/si';
import { FiGlobe } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎯 SABI
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href="/sabi/login"
              className="px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              href="/sabi/register"
              className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm font-semibold text-blue-400">
              ✅ 100% REAL • 100% ACTIVE • 100% NIGERIAN
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Real Social Media Engagement
              </span>
              <br />
              <span className="text-white">Powered by Real Nigerian Users</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Stop wasting money on fake followers. Get <span className="font-bold text-blue-400">REAL, ACTIVE Nigerian users</span> who actually engage with your content.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto pt-8">
            {[
              { icon: '👥', label: '50K+ Users', val: 'Active' },
              { icon: '✓', label: 'Real Verified', val: '100%' },
              { icon: '💬', label: 'Engagement', val: '8-25%' },
              { icon: '📈', label: 'Avg ROI', val: '300-500%' },
              { icon: '🌍', label: 'Nigeria Based', val: 'Verified' },
              { icon: '⚡', label: 'Fast Delivery', val: '24hrs' },
            ].map((badge, i) => (
              <div key={i} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-slate-600/80 transition">
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-xs text-slate-400">{badge.label}</div>
                <div className="text-sm font-bold text-blue-400">{badge.val}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <Link
              href="/sabi/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-purple-500/30 transition transform hover:scale-105"
            >
              Start Getting Real Engagement
            </Link>
            <Link
              href="#services"
              className="px-8 py-4 border-2 border-slate-600 text-white font-bold rounded-lg hover:border-slate-400 transition"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              All Major Platforms
            </span>
          </h2>
          <p className="text-slate-300">Real engagement across 30+ digital services</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: SiInstagram, name: 'Instagram', services: '6 Services', color: 'text-pink-500' },
            { Icon: SiX, name: 'Twitter/X', services: '5 Services', color: 'text-white' },
            { Icon: SiTiktok, name: 'TikTok', services: '5 Services', color: 'text-white' },
            { Icon: SiYoutube, name: 'YouTube', services: '5 Services', color: 'text-red-600' },
            { Icon: SiFacebook, name: 'Facebook', services: '3 Services', color: 'text-blue-600' },
            { Icon: FiGlobe, name: 'Website & Conversion', services: '4 Services', color: 'text-slate-300' },
          ].map((platform, i) => (
            <div
              key={i}
              className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-blue-500/50 transition group cursor-pointer"
            >
              <platform.Icon className={`text-4xl mb-3 ${platform.color}`} />
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition">{platform.name}</h3>
              <p className="text-sm text-slate-400">{platform.services}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Why Sabi?
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: '100% Real & Active Users',
              desc: 'Every follower, like, comment, and engagement comes from real, verified Nigerian users who are genuinely active.',
            },
            {
              title: 'Performance-Driven Community',
              desc: 'Users are financially incentivized to engage. Real motivation leads to real, lasting results.',
            },
            {
              title: '8-25% Engagement Rate',
              desc: 'Real engagement that converts. Unlike fake followers (1-3%), our users actually interact with your content.',
            },
            {
              title: '300-500% ROI Average',
              desc: 'Real customers. Real sales. Measurable, sustainable growth from day one.',
            },
            {
              title: 'Zero Automation',
              desc: 'No bots. No scripts. Every engagement is completed by a real person with verified identity.',
            },
            {
              title: '24-Hour Delivery',
              desc: 'Orders execute fast. Real users begin engaging within hours, not weeks.',
            },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-slate-800/20 border border-slate-700/30 rounded-lg hover:border-blue-500/30 transition">
              <div className="flex gap-4">
                <div className="text-2xl text-blue-400">✓</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50 text-center">
        <h2 className="text-3xl font-black mb-6">Ready to Get Real Engagement?</h2>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-purple-500/30 transition transform hover:scale-105"
        >
          Create Free Account
        </Link>
        <p className="text-slate-400 text-sm mt-4">No credit card required. Fund your wallet when ready.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 Sabi. All rights reserved. | Real Engagement. Real Growth.</p>
      </footer>
    </div>
  );
}
