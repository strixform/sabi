'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';

const LAST_UPDATED = 'June 6, 2026';

export default function RefundsPage() {
  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-white mb-4">Refund Policy</h1>
          <p className="text-white/40 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-10 text-white/60 leading-relaxed">

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">1. How SABI Works</h2>
              <p>SABI is a real-people social engagement platform. When you place an order, real Nigerians perform the requested engagement (following an account, liking a post, watching a video, etc.) on their own genuine social media accounts. Because the engagement is performed by real humans taking real actions, our refund policy reflects the nature of that work.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">2. When You Will Receive a Full Refund</h2>
              <p>You will receive a full refund to your SABI wallet in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-3 space-y-3">
                <li>
                  <strong className="text-white/80">Order failed to start:</strong> If your order could not be assigned to Earners and no engagement was delivered within 48 hours, the full amount will be returned to your wallet.
                </li>
                <li>
                  <strong className="text-white/80">Invalid target URL:</strong> If the URL you provided was inaccessible, private, deleted, or otherwise invalid, preventing delivery, your order will be cancelled and refunded.
                </li>
                <li>
                  <strong className="text-white/80">Platform error:</strong> If a technical error on our side caused your order to fail or not deliver correctly, you will receive a full refund.
                </li>
                <li>
                  <strong className="text-white/80">Payment failure:</strong> If a wallet funding transaction failed but was charged by Flutterwave, we will investigate and refund once confirmed. This process may take up to 5 business days.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">3. Partial Refunds</h2>
              <p>If an order was partially delivered (some engagement was provided but the full quantity was not met), you may be eligible for a partial refund proportional to the undelivered portion. Contact us at <a href="mailto:support@sability.io" className="text-blue-400 hover:text-blue-300 transition">support@sability.io</a> with your order ID within 7 days of the order's estimated completion date.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">4. When Refunds Are Not Available</h2>
              <p>Refunds will not be issued in the following situations:</p>
              <ul className="list-disc pl-6 mt-3 space-y-3">
                <li>
                  <strong className="text-white/80">Successfully completed orders:</strong> Once an order has been marked as completed and the full quantity of engagement has been delivered, no refund is available. Real people performed real actions and their time cannot be undone.
                </li>
                <li>
                  <strong className="text-white/80">Change of mind:</strong> We do not offer refunds if you simply change your mind after placing an order that has already begun delivery.
                </li>
                <li>
                  <strong className="text-white/80">Social media platform actions:</strong> If a social media platform (Instagram, TikTok, YouTube, etc.) removes, limits, or reverses engagement that was legitimately delivered, this is outside our control and is not eligible for a refund. However, for services marked as "refillable", we will top up the engagement at no extra cost within the refill window.
                </li>
                <li>
                  <strong className="text-white/80">Account made private or deleted:</strong> If your social media account or content was made private, restricted, or deleted after your order was placed and delivery had started, no refund is available.
                </li>
                <li>
                  <strong className="text-white/80">Violation of Terms of Service:</strong> Accounts suspended for violating our Terms of Service are not eligible for refunds.
                </li>
                <li>
                  <strong className="text-white/80">Wallet balance:</strong> Wallet credits are non-withdrawable and cannot be converted to cash. They may only be used for future orders on the platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">5. How Refunds Are Processed</h2>
              <p>All eligible refunds are credited directly to your SABI wallet balance — not to your original payment method. Wallet credits are available immediately for use on new orders. We do not reverse transactions back to cards or bank accounts.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">6. How to Request a Refund</h2>
              <p>To request a refund for an eligible order:</p>
              <ol className="list-decimal pl-6 mt-3 space-y-2">
                <li>Log in to your SABI account</li>
                <li>Go to <strong className="text-white/80">Orders</strong> and locate the relevant order</li>
                <li>Click <strong className="text-white/80">View Order</strong> and copy the Order ID</li>
                <li>Email <a href="mailto:support@sability.io" className="text-blue-400 hover:text-blue-300 transition">support@sability.io</a> with the subject line "Refund Request — [Order ID]"</li>
                <li>Include a brief description of the issue</li>
              </ol>
              <p className="mt-3">We aim to respond to all refund requests within 2 business days. Approved refunds are credited to your wallet immediately upon approval.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">7. Promotional Credits and Bonuses</h2>
              <p>Wallet credits received through referral bonuses, promotional codes, or other incentives are non-refundable and non-withdrawable. They may only be used for placing orders on the platform and will not be converted to cash under any circumstances.</p>
            </section>

            <section>
              <h2 className="text-white text-2xl font-bold mb-4">8. Contact</h2>
              <p>For refund requests or disputes: <a href="mailto:support@sability.io" className="text-blue-400 hover:text-blue-300 transition">support@sability.io</a></p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm text-white/30">
            <Link href="/sabi/legal/terms" className="hover:text-white/60 transition">Terms of Service</Link>
            <Link href="/sabi/legal/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
            <Link href="/sabi/legal/cookies" className="hover:text-white/60 transition">Cookie Policy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
