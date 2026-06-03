'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiTarget, FiCheckCircle, FiDollarSign, FiBarChart2, FiUsers, FiTrendingUp, FiLock } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import SabiHeader from '@/components/SabiHeader';

export default function ResellersPage() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SabiHeader
        showAuth={true}
        rightLinks={[
          { label: 'Back', href: '/partners', variant: 'secondary' },
          { label: 'Apply Now', href: '/partners/resellers/apply', variant: 'primary' },
        ]}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              <GradientText>
                <AnimateInText type="blur" delay={0.2}>
                  Become a Sabi Reseller
                </AnimateInText>
              </GradientText>
              <div className="text-white mt-3">
                <AnimateInText type="slide" delay={0.4}>
                  Build Your Business. We Handle The Tech.
                </AnimateInText>
              </div>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-slate-300 max-w-3xl mx-auto"
          >
            <AnimateInText type="fade" delay={0.7}>
              We build your branded website. Connect our API. Start selling. Earn recurring monthly revenue plus commission on every order.
            </AnimateInText>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="relative group inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-xl opacity-75 group-hover:opacity-100 transition duration-300" />
            <Link
              href="/partners/resellers/apply"
              className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg transition flex items-center gap-2"
            >
              <AnimateInText type="fade" delay={1}>
                Apply to Become a Reseller
              </AnimateInText>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                How It Works
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.15}>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Apply', desc: 'Submit your reseller application', icon: FiTarget },
              { step: '2', title: 'We Build', desc: 'We create your branded website', icon: FiCheckCircle },
              { step: '3', title: 'Launch', desc: 'Your site goes live, fully customizable', icon: FiTrendingUp },
              { step: '4', title: 'Earn', desc: 'Monthly fees + commission on sales', icon: FiDollarSign },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6 text-center h-full flex flex-col justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto border border-blue-500/50 mb-4">
                      <span className="text-lg font-bold text-blue-400">{item.step}</span>
                    </div>
                    <item.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    <h3 className="font-bold text-lg mb-2">
                      <AnimateInText type="fade" delay={0.3 + i * 0.1}>
                        {item.title}
                      </AnimateInText>
                    </h3>
                    <p className="text-sm text-slate-400">
                      <AnimateInText type="fade" delay={0.4 + i * 0.1}>
                        {item.desc}
                      </AnimateInText>
                    </p>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Transparent Pricing
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <InteractiveCard glowColor="blue">
            <div className="p-12">
              <div className="space-y-6">
                <div className="border-b border-slate-700 pb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-white">Setup Fee (One-time)</span>
                    <span className="text-2xl font-black text-blue-400">₦50,000</span>
                  </div>
                  <p className="text-slate-400 text-sm">We build and launch your branded website</p>
                </div>

                <div className="border-b border-slate-700 pb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-white">Monthly Maintenance</span>
                    <span className="text-2xl font-black text-blue-400">₦10,000/month</span>
                  </div>
                  <p className="text-slate-400 text-sm">Site hosting, updates, support, monitoring</p>
                </div>

                <div className="pb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-white">Order Commission</span>
                    <span className="text-2xl font-black text-green-400">FREE API</span>
                  </div>
                  <p className="text-slate-400 text-sm">No commission on orders. Markup pricing as you wish.</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Example:</strong> If you sell 100 orders of ₦10,000 each = ₦1,000,000 revenue. Keep all of it after monthly fees.
                  </p>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </div>
      </section>

      {/* What's Included */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                What You Get
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.1}>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: FiCheckCircle, title: 'Custom Website', desc: 'White-label branded site with your colors, logo, custom domain' },
              { icon: FiLock, title: 'Full API Access', desc: 'Connect your site to our service. Real-time order management.' },
              { icon: FiBarChart2, title: 'Analytics Dashboard', desc: 'Track orders, revenue, customer metrics in real-time' },
              { icon: FiUsers, title: 'Dedicated Support', desc: '24/7 support team to help you and your customers' },
              { icon: FiTrendingUp, title: 'Site Customization', desc: 'Full page builder to customize your site without coding' },
              { icon: FiDollarSign, title: 'Billing System', desc: 'Automated invoicing, payment collection, reporting' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6 flex gap-4">
                    <item.icon className="w-8 h-8 flex-shrink-0 text-blue-400" />
                    <div>
                      <h3 className="font-bold mb-2">
                        <AnimateInText type="fade" delay={0.3 + i * 0.1}>
                          {item.title}
                        </AnimateInText>
                      </h3>
                      <p className="text-sm text-slate-400">
                        <AnimateInText type="fade" delay={0.4 + i * 0.1}>
                          {item.desc}
                        </AnimateInText>
                      </p>
                    </div>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Common Questions
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.1}>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: 'Do I need technical skills?', a: 'No. We build your entire website. You just manage sales and customers.' },
              { q: 'Can I customize my site?', a: 'Yes! Full customization available - colors, pages, content, design.' },
              { q: 'How long to launch?', a: 'About 2 weeks from application approval to live website.' },
              { q: 'What if I want to stop?', a: 'You can cancel anytime. Just pay through your billing period.' },
              { q: 'How do I get paid?', a: 'Monthly invoicing. You pay our fees, keep 100% of order revenue from markup.' },
              { q: 'Can I white-label?', a: 'Fully white-labeled with your business name, logo, and custom domain.' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6">
                    <h3 className="font-bold text-blue-400 mb-3">
                      <AnimateInText type="fade" delay={0.3 + i * 0.05}>
                        {item.q}
                      </AnimateInText>
                    </h3>
                    <p className="text-slate-300 text-sm">
                      <AnimateInText type="fade" delay={0.4 + i * 0.05}>
                        {item.a}
                      </AnimateInText>
                    </p>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-black mb-6"
        >
          <AnimateInText type="slide" delay={0.1}>
            Ready to Become a Sabi Reseller?
          </AnimateInText>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative group inline-block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-xl opacity-75 group-hover:opacity-100 transition duration-300" />
          <Link
            href="/partners/resellers/apply"
            className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg transition flex items-center gap-2"
          >
            <AnimateInText type="fade" delay={0.3}>
              Apply Now
            </AnimateInText>
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          © 2026 Sabi Partners. Questions? Email partners@sabi.ng
        </motion.p>
      </footer>
    </div>
  );
}
