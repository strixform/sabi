'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';

const LAST_UPDATED = 'June 6, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/40 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-10 text-white/60 leading-relaxed">

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">1. About SABI</h2>
              <p>SABI ("we", "us", "our") is a social engagement platform operated by SABI Solutions Limited, accessible at sability.io. SABI connects brands, creators, and individuals ("Buyers") who want genuine social media engagement with a network of verified Nigerian users ("Earners") who perform real, organic actions on social media platforms.</p>
              <p className="mt-3">SABI is not a bot service, an automation tool, or a social media management panel. Every engagement delivered through SABI is performed by a real, active Nigerian person using their own social media account. By using SABI, you agree to these Terms of Service in full.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">2. Eligibility</h2>
              <p>You must be at least 18 years old to create an account and use SABI. By registering, you represent that:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>You are at least 18 years of age</li>
                <li>You have the legal capacity to enter into this agreement</li>
                <li>You are not accessing the platform from a jurisdiction where such services are prohibited</li>
                <li>The information you provide during registration is accurate and current</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">3. Accounts and Security</h2>
              <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Use a strong, unique password and keep it secure</li>
                <li>Notify us immediately at support@sability.io if you suspect unauthorised access to your account</li>
                <li>Not share your account credentials with any third party</li>
                <li>Not create multiple accounts to abuse referral rewards, promotional codes, or any other offer</li>
              </ul>
              <p className="mt-3">We reserve the right to suspend or terminate accounts found to be operating in violation of these rules, including but not limited to multi-account fraud, without prior notice.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">4. Wallet and Payments</h2>
              <p>SABI operates a pre-funded wallet system. To place orders, you must first fund your wallet using Flutterwave, our payment processor. By funding your wallet, you agree to the following:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Wallet funds are held in Nigerian Naira (NGN) and denominated in kobo internally</li>
                <li>Wallet balances are non-transferable to other users and may not be withdrawn as cash</li>
                <li>Wallet funds can only be used to place orders on the SABI platform</li>
                <li>All payment transactions are processed securely by Flutterwave and subject to their terms</li>
                <li>SABI does not store your card or bank details</li>
                <li>Minimum funding amount is ₦500; maximum is ₦10,000,000 per transaction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">5. Orders and Delivery</h2>
              <p>When you place an order on SABI:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>The total cost (including platform fee and VAT) is immediately debited from your wallet</li>
                <li>Your order is distributed to eligible Earners who perform the requested engagement on their real social media accounts</li>
                <li>Delivery times vary by service type and are estimates only — we do not guarantee specific completion times</li>
                <li>Orders that cannot be fulfilled due to platform restrictions, account privacy settings, or other factors outside our control will be refunded to your wallet</li>
                <li>You are responsible for ensuring the target URL you provide is correct, publicly accessible, and not in violation of any platform's terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">6. Fees and Pricing</h2>
              <p>All prices are displayed in Nigerian Naira (₦). Each order is subject to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-white/80">Base price:</strong> the cost per unit of engagement multiplied by the quantity ordered</li>
                <li><strong className="text-white/80">Platform fee:</strong> 7.5% of the base price, covering platform operations and Earner payouts</li>
                <li><strong className="text-white/80">VAT:</strong> 7.5% of the base price, as required by Nigerian tax law</li>
              </ul>
              <p className="mt-3">We reserve the right to change pricing at any time. Price changes will not affect orders already placed and debited.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">7. Acceptable Use</h2>
              <p>You agree not to use SABI to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Promote illegal content, hate speech, violence, terrorism, or any content that violates applicable law</li>
                <li>Boost content that violates the terms of service of the target social media platform</li>
                <li>Engage in any form of fraud, deception, or misrepresentation</li>
                <li>Attempt to reverse-engineer, scrape, or interfere with the platform's technical infrastructure</li>
                <li>Use the platform for money laundering or any other financial crime</li>
                <li>Create fake accounts or exploit the referral system through multi-accounting</li>
              </ul>
              <p className="mt-3">Violation of these rules may result in immediate account suspension, forfeiture of wallet balance, and referral to appropriate authorities where required by law.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">8. Referral Programme</h2>
              <p>SABI operates a referral programme where both the referrer and the referred user receive a ₦500 wallet credit when the referred user places their first qualifying order. The referral programme is subject to the following conditions:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Referral rewards are credited to wallet balance only — they cannot be withdrawn as cash</li>
                <li>Self-referral (using your own referral code on a second account) is strictly prohibited</li>
                <li>We reserve the right to modify, suspend, or terminate the referral programme at any time</li>
                <li>Referral credits obtained through fraud will be reversed and the accounts involved may be suspended</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">9. Intellectual Property</h2>
              <p>All content on sability.io — including but not limited to the SABI name, logo, design, text, and software — is owned by or licensed to SABI Solutions Limited and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">10. Disclaimers and Limitation of Liability</h2>
              <p>SABI is provided "as is" without warranties of any kind, express or implied. We do not guarantee:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>That engagement delivered will result in any specific business outcome</li>
                <li>That social media platforms will not remove or reduce the engagement delivered</li>
                <li>Uninterrupted or error-free operation of the platform</li>
              </ul>
              <p className="mt-3">To the fullest extent permitted by law, SABI's total liability for any claim arising from your use of the platform shall not exceed the amount you paid for the specific order giving rise to the claim.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">11. Termination</h2>
              <p>We reserve the right to suspend or terminate your account at our discretion if we determine you have violated these Terms. Upon termination for violation, any remaining wallet balance may be forfeited. Where termination is not due to violation, unused wallet credits will be assessed on a case-by-case basis.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">12. Governing Law</h2>
              <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the Nigerian courts.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">13. Changes to These Terms</h2>
              <p>We may update these Terms from time to time. Material changes will be communicated via email or in-app notification. Continued use of SABI after any changes constitutes your acceptance of the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">14. Contact</h2>
              <p>For questions about these Terms, contact us at: <a href="mailto:legal@sability.io" className="text-blue-400 hover:text-blue-300 transition">legal@sability.io</a></p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm text-white/30">
            <Link href="/sabi/legal/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
            <Link href="/sabi/legal/refunds" className="hover:text-white/60 transition">Refund Policy</Link>
            <Link href="/sabi/legal/cookies" className="hover:text-white/60 transition">Cookie Policy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
