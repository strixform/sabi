'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUsers, FiTrendingUp, FiGift, FiDollarSign, FiCheckCircle, FiTarget, FiBarChart2, FiHeadphones } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import SabiHeader from '@/components/SabiHeader';

export default function PartnersPage() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SabiHeader showNavigation={false} />

      {/* Hero Section */}
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
                  Grow Together
                </AnimateInText>
              </GradientText>
              <div className="text-white mt-3">
                <AnimateInText type="slide" delay={0.4}>
                  Partner Programs That Work
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
              Join the Sabi partner ecosystem. Resell our service, earn recurring revenue, and help Nigerian creators grow.
            </AnimateInText>
          </motion.p>

          {/* Partner Programs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-8"
          >
            {/* Reseller Program */}
            <Link href="/partners/resellers">
              <InteractiveCard glowColor="blue">
                <motion.div
                  className="p-8 h-full cursor-pointer"
                  whileHover={{ y: -5 }}
                >
                  <FiUsers className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">
                    <AnimateInText type="fade" delay={1}>
                      Reseller Program
                    </AnimateInText>
                  </h3>
                  <p className="text-slate-300 mb-6">
                    <AnimateInText type="fade" delay={1.1}>
                      We build your branded website. You resell our services and keep the profit.
                    </AnimateInText>
                  </p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex gap-2">
                      <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                      <span>Custom white-label website</span>
                    </div>
                    <div className="flex gap-2">
                      <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                      <span>Full API access</span>
                    </div>
                    <div className="flex gap-2">
                      <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                      <span>₦50K setup + ₦10K/month</span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold"
                  >
                    Learn More →
                  </motion.div>
                </motion.div>
              </InteractiveCard>
            </Link>

            {/* Affiliate Program (Future) */}
            <InteractiveCard glowColor="purple">
              <motion.div
                className="p-8 h-full opacity-50"
                whileHover={{ y: -5 }}
              >
                <FiGift className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold mb-3">Affiliate Program</h3>
                <p className="text-slate-300 mb-6">
                  Refer customers and earn commission on every order.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex gap-2">
                    <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-slate-500" />
                    <span>Coming soon...</span>
                  </div>
                </div>
                <div className="mt-6 px-6 py-2 bg-slate-700 text-slate-400 rounded-lg font-semibold inline-block">
                  Coming Soon
                </div>
              </motion.div>
            </InteractiveCard>
          </motion.div>
        </div>
      </section>

      {/* Why Partner with Sabi */}
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
                Why Partner With Sabi?
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.12}>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: FiDollarSign,
                title: 'Recurring Revenue',
                desc: 'Monthly maintenance fees + commission on every order your customers place.',
              },
              {
                Icon: FiTarget,
                title: 'We Build Your Site',
                desc: 'No technical skills needed. We handle the website, you focus on sales.',
              },
              {
                Icon: FiTrendingUp,
                title: 'Proven Model',
                desc: '80%+ of Nigeria uses these services. High demand, low churn.',
              },
              {
                Icon: FiUsers,
                title: '100% Real Engagement',
                desc: 'Your customers get real results. Happy customers = repeat business.',
              },
              {
                Icon: FiCheckCircle,
                title: 'Easy Integration',
                desc: 'Simple API. Full documentation. We provide all the support you need.',
              },
              {
                Icon: FiHeadphones,
                title: '24/7 Support',
                desc: 'Dedicated support team to help you and your customers succeed.',
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6 h-full flex flex-col">
                    <item.Icon className="w-10 h-10 text-blue-400 mb-4" />
                    <h3 className="font-bold text-lg mb-2">
                      <AnimateInText type="fade" delay={0.3 + i * 0.1}>
                        {item.title}
                      </AnimateInText>
                    </h3>
                    <p className="text-slate-400 text-sm flex-1">
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

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-black mb-6"
        >
          <AnimateInText type="slide" delay={0.1}>
            Ready to Partner?
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
            href="/partners/resellers"
            className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg transition"
          >
            <AnimateInText type="fade" delay={0.3}>
              Apply Now
            </AnimateInText>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-slate-400 text-sm mt-4"
        >
          <AnimateInText type="fade" delay={0.4}>
            Questions? Contact partners@sabi.ng
          </AnimateInText>
        </motion.p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          © 2026 Sabi Partners. Building the future of social commerce in Nigeria.
        </motion.p>
      </footer>
    </div>
  );
}
