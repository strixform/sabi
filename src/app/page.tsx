'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook } from 'react-icons/si';
import { SiX } from 'react-icons/si';
import { FiGlobe } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { FloatingElement } from '@/components/FloatingElement';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <CuteIconAnimation type="bounce" duration={1.5}>
              <div className="text-3xl">🎯</div>
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex gap-4"
          >
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
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center space-y-8">
          {/* Floating Badge */}
          <FloatingElement delay={0} duration={3} distance={10}>
            <motion.div
              className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition"
              whileHover={{ scale: 1.05 }}
            >
              <AnimateInText type="typewriter" delay={0.2}>
                ✅ 100% REAL • 100% ACTIVE • 100% NIGERIAN
              </AnimateInText>
            </motion.div>
          </FloatingElement>

          {/* Main Title with Premium Text Animation */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            <div className="overflow-hidden h-fit">
              <motion.div
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              >
                <GradientText className="block mb-2">
                  <AnimateInText type="blur" delay={0.4}>
                    Real Social Media Engagement
                  </AnimateInText>
                </GradientText>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-white mt-3"
            >
              <AnimateInText type="slide" delay={0.7}>
                Powered by Real Nigerian Users
              </AnimateInText>
            </motion.div>
          </h1>

          {/* Subtitle with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto"
          >
            <AnimateInText type="fade" delay={1}>
              Stop wasting money on fake followers. Get
            </AnimateInText>
            <span className="block mt-2">
              <AnimateInText type="typewriter" delay={1.2}>
                <span className="font-bold text-blue-400">REAL, ACTIVE Nigerian users</span>
              </AnimateInText>
              <span className="ml-2">
                <AnimateInText type="fade" delay={2}>
                  who actually engage with your content.
                </AnimateInText>
              </span>
            </span>
          </motion.div>

          {/* Trust Badges - Animated */}
          <StaggerContainer staggerDelay={0.1} delay={1.5}>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto pt-8">
              {[
                { icon: '👥', label: '50K+', val: 'Users', color: 'blue' },
                { icon: '✓', label: '100%', val: 'Verified', color: 'blue' },
                { icon: '💬', label: '8-25%', val: 'Engagement', color: 'purple' },
                { icon: '📈', label: '300-500%', val: 'ROI', color: 'pink' },
                { icon: '🌍', label: '100%', val: 'Nigeria', color: 'cyan' },
                { icon: '⚡', label: '24hrs', val: 'Delivery', color: 'blue' },
              ].map((badge, i) => (
                <StaggerItem key={i}>
                  <InteractiveCard delay={0} glowColor={badge.color}>
                    <div className="p-4 text-center">
                      <CuteIconAnimation type="bounce" delay={i * 0.15} duration={1.8}>
                        <div className="text-4xl mb-2">{badge.icon}</div>
                      </CuteIconAnimation>
                      <div className="text-xs text-slate-400 font-semibold">{badge.label}</div>
                      <AnimateInText type="fade" delay={1.5 + i * 0.1}>
                        <div className="text-sm font-bold text-blue-400">{badge.val}</div>
                      </AnimateInText>
                    </div>
                  </InteractiveCard>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex flex-col md:flex-row gap-4 justify-center pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition duration-300" />
              <Link
                href="/sabi/register"
                className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-2xl transition"
              >
                <AnimateInText type="fade" delay={2.1}>
                  Start Getting Real Engagement
                </AnimateInText>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="#services"
                className="block px-8 py-4 border-2 border-slate-600 text-white font-bold rounded-lg hover:border-blue-400 hover:bg-slate-800/50 transition text-center"
              >
                <AnimateInText type="fade" delay={2.2}>
                  View All Services
                </AnimateInText>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                All Major Platforms
              </AnimateInText>
            </GradientText>
          </h2>
          <AnimateInText type="fade" delay={0.3}>
            <p className="text-slate-300">Real engagement across 30+ digital services</p>
          </AnimateInText>
        </motion.div>

        <StaggerContainer staggerDelay={0.1}>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: SiInstagram, name: 'Instagram', services: '6 Services', color: 'pink', glowColor: 'pink' },
              { Icon: SiX, name: 'Twitter/X', services: '5 Services', color: 'white', glowColor: 'cyan' },
              { Icon: SiTiktok, name: 'TikTok', services: '5 Services', color: 'white', glowColor: 'purple' },
              { Icon: SiYoutube, name: 'YouTube', services: '5 Services', color: 'red', glowColor: 'blue' },
              { Icon: SiFacebook, name: 'Facebook', services: '3 Services', color: 'blue', glowColor: 'blue' },
              { Icon: FiGlobe, name: 'Website & Conversion', services: '4 Services', color: 'slate', glowColor: 'cyan' },
            ].map((platform, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor={platform.glowColor as any} delay={0}>
                  <div className="p-6 text-center h-full flex flex-col items-center justify-center">
                    <FloatingIcon delay={i * 0.15} speed={3.5}>
                      <platform.Icon className={`text-5xl mb-3 text-${platform.color}-500`} />
                    </FloatingIcon>
                    <h3 className="font-bold text-lg mb-1">
                      <AnimateInText type="fade" delay={0.5 + i * 0.1}>
                        {platform.name}
                      </AnimateInText>
                    </h3>
                    <p className="text-sm text-slate-400">{platform.services}</p>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* Why Choose Us */}
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
                Why Sabi?
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.12}>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: '100% Real & Active Users',
                desc: 'Every follower, like, comment, and engagement comes from real, verified Nigerian users.',
                icon: '👥',
                glowColor: 'blue',
              },
              {
                title: 'Performance-Driven Community',
                desc: 'Users are financially incentivized to engage. Real motivation, real results.',
                icon: '🎯',
                glowColor: 'purple',
              },
              {
                title: '8-25% Engagement Rate',
                desc: 'Real engagement that converts. Unlike fake followers (1-3%), we deliver interaction.',
                icon: '📊',
                glowColor: 'pink',
              },
              {
                title: '300-500% ROI Average',
                desc: 'Real customers. Real sales. Measurable growth from day one.',
                icon: '💰',
                glowColor: 'cyan',
              },
              {
                title: 'Zero Automation',
                desc: 'No bots. No scripts. Every engagement is a real person with verified identity.',
                icon: '🔒',
                glowColor: 'blue',
              },
              {
                title: '24-Hour Delivery',
                desc: 'Orders execute fast. Real users begin engaging within hours.',
                icon: '⚡',
                glowColor: 'purple',
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor={item.glowColor as any} delay={0}>
                  <div className="p-6">
                    <div className="flex gap-4">
                      <CuteIconAnimation type="wiggle" delay={i * 0.2} duration={2}>
                        <div className="text-4xl flex-shrink-0">{item.icon}</div>
                      </CuteIconAnimation>
                      <div>
                        <h3 className="font-bold text-lg mb-2">
                          <AnimateInText type="fade" delay={0.5 + i * 0.1}>
                            {item.title}
                          </AnimateInText>
                        </h3>
                        <p className="text-slate-400 text-sm">
                          <AnimateInText type="fade" delay={0.6 + i * 0.1}>
                            {item.desc}
                          </AnimateInText>
                        </p>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/50 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-black mb-6"
        >
          <AnimateInText type="slide" delay={0.1}>
            Ready to Get Real Engagement?
          </AnimateInText>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group inline-block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-xl opacity-75 group-hover:opacity-100 transition duration-300" />
          <Link
            href="/sabi/register"
            className="relative block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg transition"
          >
            <AnimateInText type="fade" delay={0.3}>
              Create Free Account
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
            No credit card required. Fund your wallet when ready.
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
          © 2026 Sabi. All rights reserved. | Real Engagement. Real Growth.
        </motion.p>
      </footer>
    </div>
  );
}
