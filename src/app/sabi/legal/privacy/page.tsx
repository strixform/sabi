'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';

const LAST_UPDATED = 'June 6, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/40 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-10 text-white/60 leading-relaxed">

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">1. Introduction</h2>
              <p>SABI Solutions Limited ("we", "us", "our") operates sability.io (the "Platform"). We are committed to protecting your personal data and complying with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act (NDPA) 2023. This Privacy Policy explains how we collect, use, store, and protect your personal information.</p>
              <p className="mt-3">By creating an account or using the Platform, you consent to the data practices described in this Policy.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">2. Data We Collect</h2>
              <p>We collect the following categories of personal data:</p>
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="text-white/80 font-semibold mb-2">Account Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full name and email address</li>
                    <li>Password (stored as a one-way cryptographic hash — we cannot read it)</li>
                    <li>Business name (optional)</li>
                    <li>Profile avatar (optional)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white/80 font-semibold mb-2">Transaction Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Wallet funding history and order records</li>
                    <li>Payment references from Flutterwave (we do not store card numbers or bank account details)</li>
                    <li>Target URLs and order configurations you submit</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white/80 font-semibold mb-2">Technical Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IP address and approximate geolocation</li>
                    <li>Browser type, device type, and operating system</li>
                    <li>Pages visited, features used, and session duration</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white/80 font-semibold mb-2">Communication Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Emails sent to and from support@sability.io</li>
                    <li>Push notification preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">3. How We Use Your Data</h2>
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-white/80">Service delivery:</strong> to create and manage your account, process payments, and fulfil your orders</li>
                <li><strong className="text-white/80">Communications:</strong> to send order status notifications, account alerts, and service updates</li>
                <li><strong className="text-white/80">Security:</strong> to detect and prevent fraud, abuse, and unauthorised account access</li>
                <li><strong className="text-white/80">Compliance:</strong> to meet our legal obligations under Nigerian law</li>
                <li><strong className="text-white/80">Platform improvement:</strong> to analyse usage patterns and improve the platform experience</li>
                <li><strong className="text-white/80">Marketing:</strong> to send promotional communications where you have given consent (you may opt out at any time)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">4. Legal Basis for Processing</h2>
              <p>We process your data under the following legal bases as defined by the NDPA 2023:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-white/80">Contract performance:</strong> processing necessary to provide the services you've requested</li>
                <li><strong className="text-white/80">Consent:</strong> for marketing communications and optional features</li>
                <li><strong className="text-white/80">Legitimate interests:</strong> for fraud prevention and platform security</li>
                <li><strong className="text-white/80">Legal obligation:</strong> where required by Nigerian law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">5. Data Sharing</h2>
              <p>We do not sell your personal data. We share data only with:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-white/80">Flutterwave:</strong> our payment processor, for the purpose of processing wallet funding transactions</li>
                <li><strong className="text-white/80">Resend:</strong> our transactional email provider, used to send order and account notifications</li>
                <li><strong className="text-white/80">Turso / LibSQL:</strong> our database infrastructure provider</li>
                <li><strong className="text-white/80">Vercel:</strong> our hosting and edge network provider</li>
                <li><strong className="text-white/80">Law enforcement:</strong> where required by a valid legal order from Nigerian authorities</li>
              </ul>
              <p className="mt-3">All third-party providers are bound by data processing agreements and handle your data only as instructed by us.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">6. Data Retention</h2>
              <p>We retain your personal data for as long as your account is active and for a period of 7 years after account closure, as required by Nigerian financial regulations. Transaction records are retained for the same period. You may request deletion of non-financial data at any time (see Your Rights below).</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">7. Your Rights Under the NDPA 2023</h2>
              <p>As a data subject, you have the following rights:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-white/80">Right of access:</strong> to request a copy of the personal data we hold about you</li>
                <li><strong className="text-white/80">Right to rectification:</strong> to correct inaccurate or incomplete data</li>
                <li><strong className="text-white/80">Right to erasure:</strong> to request deletion of your data, subject to legal retention requirements</li>
                <li><strong className="text-white/80">Right to restrict processing:</strong> to limit how we use your data in certain circumstances</li>
                <li><strong className="text-white/80">Right to data portability:</strong> to receive your data in a machine-readable format</li>
                <li><strong className="text-white/80">Right to object:</strong> to object to processing based on legitimate interests or for direct marketing</li>
                <li><strong className="text-white/80">Right to withdraw consent:</strong> where processing is based on consent, you may withdraw at any time</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@sability.io" className="text-blue-400 hover:text-blue-300 transition">privacy@sability.io</a>. We will respond within 30 days.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">8. Security</h2>
              <p>We implement industry-standard security measures to protect your data, including:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>All data in transit is encrypted using TLS 1.2+</li>
                <li>Passwords are hashed using bcrypt with a cost factor of 10</li>
                <li>Session tokens are cryptographically signed and stored in httpOnly cookies</li>
                <li>API endpoints are rate-limited using Redis-backed distributed counters</li>
                <li>Regular security audits of our codebase and infrastructure</li>
              </ul>
              <p className="mt-3">No method of transmission over the internet is 100% secure. If you believe your account has been compromised, contact us immediately at security@sability.io.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">9. Cookies and Tracking</h2>
              <p>We use essential cookies for session management and authentication. We do not use third-party advertising cookies. For full details, see our <Link href="/sabi/legal/cookies" className="text-blue-400 hover:text-blue-300 transition">Cookie Policy</Link>.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">10. Children's Privacy</h2>
              <p>SABI is not directed at individuals under 18 years of age. We do not knowingly collect personal data from minors. If we become aware that we have collected data from a minor, we will delete it promptly.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">12. Contact and Complaints</h2>
              <p>For privacy-related enquiries: <a href="mailto:privacy@sability.io" className="text-blue-400 hover:text-blue-300 transition">privacy@sability.io</a></p>
              <p className="mt-2">If you believe we have not adequately addressed your concern, you have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition">ndpc.gov.ng</a>.</p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm text-white/30">
            <Link href="/sabi/legal/terms" className="hover:text-white/60 transition">Terms of Service</Link>
            <Link href="/sabi/legal/refunds" className="hover:text-white/60 transition">Refund Policy</Link>
            <Link href="/sabi/legal/cookies" className="hover:text-white/60 transition">Cookie Policy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
