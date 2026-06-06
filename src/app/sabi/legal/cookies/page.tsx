'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';

const LAST_UPDATED = 'June 6, 2026';

export default function CookiesPage() {
  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-white/40 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-10 text-white/60 leading-relaxed">

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">1. What Are Cookies?</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They allow the website to remember information about your visit — such as whether you're logged in — to provide a better experience on your next visit.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">2. Cookies We Use</h2>
              <p>SABI uses a minimal set of cookies. We do not use advertising cookies or third-party tracking cookies.</p>

              <div className="mt-6 space-y-6">
                <div className="p-5 rounded-xl border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="text-white font-bold mb-2">Session Cookies <span className="text-xs font-mono text-emerald-400 ml-2">Essential</span></h3>
                  <p className="text-sm">These cookies keep you logged in to your SABI account. Without them, you would need to log in on every page visit. They are deleted when you close your browser or log out.</p>
                  <div className="mt-3 text-xs font-mono text-white/30 space-y-1">
                    <p><span className="text-white/50">sabi_session_token</span> — encrypted session authentication token</p>
                    <p><span className="text-white/50">sabi_session_id</span> — your user identifier (non-personal)</p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="text-white font-bold mb-2">Security Cookies <span className="text-xs font-mono text-emerald-400 ml-2">Essential</span></h3>
                  <p className="text-sm">Used to detect and prevent fraudulent activity, protect against CSRF attacks, and enforce rate limits on authentication endpoints.</p>
                </div>

                <div className="p-5 rounded-xl border border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="text-white font-bold mb-2">Analytics <span className="text-xs font-mono text-blue-400 ml-2">Performance</span></h3>
                  <p className="text-sm">We use Vercel Analytics and Speed Insights to understand how the platform is used. These collect anonymised, aggregated data only — no personal information is tracked, and data is not shared with third parties for advertising.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">3. Cookies We Do Not Use</h2>
              <p>We do not use:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Advertising or retargeting cookies</li>
                <li>Social media tracking pixels</li>
                <li>Third-party behavioural analytics</li>
                <li>Fingerprinting or cross-site tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">4. Your Cookie Choices</h2>
              <p>You can control cookies through your browser settings. Most browsers allow you to refuse new cookies, delete existing cookies, and be notified when cookies are set. Note that disabling session cookies will prevent you from logging in to your SABI account.</p>
              <p className="mt-3">For instructions on managing cookies in your specific browser, visit:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition">Safari</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">5. Changes to This Policy</h2>
              <p>We may update this Cookie Policy as our platform evolves. Any changes will be reflected on this page with an updated "last updated" date.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">6. Contact</h2>
              <p>Questions about cookies: <a href="mailto:privacy@sability.io" className="text-blue-400 hover:text-blue-300 transition">privacy@sability.io</a></p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm text-white/30">
            <Link href="/sabi/legal/terms" className="hover:text-white/60 transition">Terms of Service</Link>
            <Link href="/sabi/legal/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
            <Link href="/sabi/legal/refunds" className="hover:text-white/60 transition">Refund Policy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
