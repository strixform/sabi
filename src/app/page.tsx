'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook } from 'react-icons/si';
import { SiX } from 'react-icons/si';
import { FiGlobe, FiTarget, FiUsers, FiCheckCircle, FiMessageCircle, FiTrendingUp, FiZap, FiCreditCard, FiBarChart2, FiArrowUpRight, FiLock, FiDollarSign, FiInbox, FiAward, FiShield, FiHeadphones } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { FloatingElement } from '@/components/FloatingElement';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';
import { InteractiveCard } from '@/components/InteractiveCard';
import { AnimateInText } from '@/components/AnimateInText';
import { CuteIconAnimation, FloatingIcon } from '@/components/CuteIconAnimation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n-client';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { WanderingParticles } from '@/components/WanderingParticles';

function HomeContent() {
  const { language, switchLanguage, t } = useTranslation();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <WanderingParticles />

      <ModernSabiHeader showNavigation={false} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative">
        <div className="text-center space-y-3 sm:space-y-4 lg:space-y-5">
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
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto pt-5">
              {[
                { Icon: FiUsers, label: '50K+', val: 'Users', color: 'blue' },
                { Icon: FiCheckCircle, label: '100%', val: 'Verified', color: 'blue' },
                { Icon: FiMessageCircle, label: '8-25%', val: 'Engagement', color: 'purple' },
                { Icon: FiTrendingUp, label: '300-500%', val: 'ROI', color: 'pink' },
                { Icon: FiGlobe, label: '100%', val: 'Nigeria', color: 'cyan' },
                { Icon: FiZap, label: '24hrs', val: 'Delivery', color: 'blue' },
              ].map((badge, i) => (
                <StaggerItem key={i}>
                  <InteractiveCard delay={0} glowColor={badge.color}>
                    <div className="p-4 text-center">
                      <CuteIconAnimation type="bounce" delay={i * 0.15} duration={1.8}>
                        <badge.Icon className="w-10 h-10 mx-auto mb-2 text-blue-400" />
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
            className="flex flex-col md:flex-row gap-4 justify-center pt-5"
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
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
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
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
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
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {[
              {
                title: '100% Real & Active Users',
                desc: 'Every follower, like, comment, and engagement comes from real, verified Nigerian users.',
                Icon: FiUsers,
                glowColor: 'blue',
              },
              {
                title: 'Performance-Driven Community',
                desc: 'Users are financially incentivized to engage. Real motivation, real results.',
                Icon: FiTarget,
                glowColor: 'purple',
              },
              {
                title: '8-25% Engagement Rate',
                desc: 'Real engagement that converts. Unlike fake followers (1-3%), we deliver interaction.',
                Icon: FiBarChart2,
                glowColor: 'pink',
              },
              {
                title: '300-500% ROI Average',
                desc: 'Real customers. Real sales. Measurable growth from day one.',
                Icon: FiDollarSign,
                glowColor: 'cyan',
              },
              {
                title: 'Zero Automation',
                desc: 'No bots. No scripts. Every engagement is a real person with verified identity.',
                Icon: FiLock,
                glowColor: 'blue',
              },
              {
                title: '24-Hour Delivery',
                desc: 'Orders execute fast. Real users begin engaging within hours.',
                Icon: FiZap,
                glowColor: 'purple',
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor={item.glowColor as any} delay={0}>
                  <div className="p-6">
                    <div className="flex gap-4">
                      <CuteIconAnimation type="wiggle" delay={i * 0.2} duration={2}>
                        <item.Icon className="w-10 h-10 flex-shrink-0 text-blue-400" />
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

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                How Sabi Works
              </AnimateInText>
            </GradientText>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            <AnimateInText type="fade" delay={0.3}>
              Get real engagement in 4 simple steps. No technical knowledge required.
            </AnimateInText>
          </p>
        </motion.div>

        <StaggerContainer staggerDelay={0.15}>
          <div className="grid md:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up in 30 seconds with email or Google', Icon: FiUsers },
              { step: '2', title: 'Fund Wallet', desc: 'Add funds via Flutterwave (secure, instant)', Icon: FiCreditCard },
              { step: '3', title: 'Place Order', desc: 'Select service, enter URL, confirm price', Icon: FiArrowUpRight },
              { step: '4', title: 'Get Results', desc: 'Real engagement starts within 24 hours', Icon: FiCheckCircle },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6 text-center h-full flex flex-col justify-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto border border-blue-500/50">
                        <span className="text-lg font-bold text-blue-400">{item.step}</span>
                      </div>
                    </div>
                    <item.Icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
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

      {/* Detailed Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Why Choose Sabi Over Fake Followers?
              </AnimateInText>
            </GradientText>
          </h2>
          <p className="text-slate-300 max-w-3xl mx-auto">
            <AnimateInText type="fade" delay={0.3}>
              Real engagement from real people beats fake followers every time. Here's the proof.
            </AnimateInText>
          </p>
        </motion.div>

        <div className="space-y-8">
          <StaggerContainer staggerDelay={0.12}>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              {[
                {
                  title: 'Real People = Real Results',
                  points: [
                    'Followers from our network actually use Instagram, TikTok, Twitter daily',
                    'They engage because they\'re paid to be there - genuine motivation',
                    'Your content gets in front of real eyes, real accounts, real followers',
                  ],
                  Icon: FiUsers,
                },
                {
                  title: 'Algorithm-Friendly Growth',
                  points: [
                    'Real engagement signals boost your posts to more users organically',
                    '8-25% engagement rate triggers platform algorithms',
                    'Instagram, TikTok, YouTube reward high engagement with viral reach',
                  ],
                  Icon: FiTrendingUp,
                },
                {
                  title: 'No Risk of Account Ban',
                  points: [
                    'No bots, scripts, or automation - 100% manual human engagement',
                    'Complies with all platform terms of service',
                    'Your account stays safe, verified, and in good standing',
                  ],
                  Icon: FiShield,
                },
                {
                  title: 'Measurable ROI',
                  points: [
                    'Track every engagement in real-time on your analytics',
                    'See follower growth, reach increase, sales directly tied to Sabi',
                    'Average customer reports 300-500% ROI within 30 days',
                  ],
                  Icon: FiBarChart2,
                },
              ].map((section, i) => (
                <StaggerItem key={i}>
                  <InteractiveCard glowColor={i % 2 === 0 ? 'blue' : 'purple'} delay={0}>
                    <div className="p-8 h-full">
                      <div className="flex gap-4 mb-6">
                        <section.Icon className="w-8 h-8 flex-shrink-0 text-blue-400" />
                        <h3 className="font-bold text-lg">
                          <AnimateInText type="fade" delay={0.3 + i * 0.1}>
                            {section.title}
                          </AnimateInText>
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {section.points.map((point, j) => (
                          <li key={j} className="flex gap-3">
                            <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
                            <span className="text-slate-300 text-sm">
                              <AnimateInText type="fade" delay={0.4 + (i * 0.1) + (j * 0.05)}>
                                {point}
                              </AnimateInText>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </InteractiveCard>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Real Success Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Real Success Stories
              </AnimateInText>
            </GradientText>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            <AnimateInText type="fade" delay={0.3}>
              See how Sabi users are growing their accounts and making real money
            </AnimateInText>
          </p>
        </motion.div>

        <StaggerContainer staggerDelay={0.15}>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {[
              {
                name: 'Chioma O.',
                handle: '@lifestyle_blogger',
                result: 'Grew from 5K to 125K followers in 60 days',
                detail: 'Used Sabi to boost engagement on her lifestyle content. Now gets brand partnership offers weekly.',
                Icon: FiAward,
              },
              {
                name: 'Tunde A.',
                handle: '@tech_content_ng',
                result: 'Increased engagement from 2% to 18% in 30 days',
                detail: 'As a tech creator, needed real engagement. Sabi\'s Nigerian audience was perfect fit. Got 3 sponsorships.',
                Icon: FiTrendingUp,
              },
              {
                name: 'Nia M.',
                handle: '@brand_ambassador',
                result: 'Converted followers to ₦500K revenue in 90 days',
                detail: 'Used Sabi to build credibility, then launched digital products. Real followers = real customers.',
                Icon: FiDollarSign,
              },
            ].map((story, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="purple" delay={0}>
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <story.Icon className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="font-bold text-sm">{story.name}</p>
                        <p className="text-xs text-slate-400">{story.handle}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-blue-400 text-sm mb-3">
                      <AnimateInText type="fade" delay={0.3 + i * 0.1}>
                        {story.result}
                      </AnimateInText>
                    </p>
                    <p className="text-slate-300 text-sm flex-1">
                      <AnimateInText type="fade" delay={0.4 + i * 0.1}>
                        {story.detail}
                      </AnimateInText>
                    </p>
                  </div>
                </InteractiveCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </section>

      {/* Trust & Security Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Enterprise-Grade Security
              </AnimateInText>
            </GradientText>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            <AnimateInText type="fade" delay={0.3}>
              Your account and data are protected by industry-leading security standards
            </AnimateInText>
          </p>
        </motion.div>

        <StaggerContainer staggerDelay={0.12}>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {[
              { title: 'Data Encryption', desc: 'All data encrypted in transit and at rest using industry standards', Icon: FiLock },
              { title: '100% Compliance', desc: 'Fully compliant with GDPR, CCPA, and Nigerian data protection laws', Icon: FiShield },
              { title: 'Secure Payments', desc: 'All payments processed through Flutterwave (PCI DSS Level 1 certified)', Icon: FiCreditCard },
              { title: '24/7 Support', desc: 'Real humans available to help with any questions or issues', Icon: FiHeadphones },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="cyan" delay={0}>
                  <div className="p-6 flex gap-4">
                    <item.Icon className="w-8 h-8 flex-shrink-0 text-cyan-400" />
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 p-8 rounded-xl border border-green-500/30 bg-green-500/5"
        >
          <div className="flex gap-4">
            <FiCheckCircle className="w-6 h-6 flex-shrink-0 text-green-400 mt-1" />
            <div>
              <h3 className="font-bold mb-2">Risk-Free Guarantee</h3>
              <p className="text-slate-300 text-sm">
                Not satisfied with your engagement within 30 days? Get a full refund. We\'re confident in our service because we know it works.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-5 sm:mb-6 lg:mb-8"
        >
          <h2 className="text-4xl font-black mb-4">
            <GradientText>
              <AnimateInText type="slide" delay={0.1}>
                Frequently Asked Questions
              </AnimateInText>
            </GradientText>
          </h2>
        </motion.div>

        <StaggerContainer staggerDelay={0.1}>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'Will my account get banned?',
                a: 'No. We use only real people and real engagement. Your account stays safe and compliant with platform policies.',
              },
              {
                q: 'How fast will I see results?',
                a: 'Real users start engaging within 1-24 hours of order placement. You\'ll see follower growth within days.',
              },
              {
                q: 'Are the followers real?',
                a: 'Yes, 100% real. All users are verified Nigerians with active accounts. You can see their profiles.',
              },
              {
                q: 'What platforms do you support?',
                a: 'We support Instagram, TikTok, Twitter/X, YouTube, Facebook, and website traffic. 30+ services total.',
              },
              {
                q: 'Can I get a refund?',
                a: 'Yes. If unsatisfied within 30 days, we offer full refund with no questions asked.',
              },
              {
                q: 'Is there a contract or minimum?',
                a: 'No contracts, no minimums. Pay only for what you order. Cancel anytime.',
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <InteractiveCard glowColor="blue" delay={0}>
                  <div className="p-6">
                    <h3 className="font-bold mb-3 text-blue-400">
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

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16border-t border-slate-800/50 text-center">
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
      <footer className="border-t border-slate-800/50 py-12 text-center text-slate-500 text-sm space-y-4">
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={switchLanguage}
          variant="footer"
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {t('footer.copyright', '© 2026 Sabi. All rights reserved. | Real Engagement. Real Growth.')}
        </motion.p>
      </footer>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
