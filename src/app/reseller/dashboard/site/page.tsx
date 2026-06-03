'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiArrowLeft, FiSave, FiEye, FiCopy, FiCheck } from 'react-icons/fi';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GradientText } from '@/components/AnimatedText';
import { InteractiveCard } from '@/components/InteractiveCard';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';

interface SiteConfig {
  siteName: string;
  customDomain: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutSection: string;
  logoUrl: string;
}

export default function SiteCustomizationPage() {
  const [config, setConfig] = useState<SiteConfig>({
    siteName: 'Your Reseller Site',
    customDomain: 'yoursite.com',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    heroTitle: 'Welcome to Your Service',
    heroSubtitle: 'Quality engagement for your audience',
    aboutSection: 'We provide authentic engagement and growth services.',
    logoUrl: '/logo.png',
  });

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch('/api/reseller/site');
      if (response.ok) {
        const data = await response.json();
        const site = data.site;
        setConfig({
          siteName: site.siteName || 'Your Reseller Site',
          customDomain: site.customDomain || 'yoursite.com',
          primaryColor: site.primaryColor || '#3b82f6',
          secondaryColor: site.secondaryColor || '#8b5cf6',
          accentColor: site.accentColor || '#10b981',
          heroTitle: site.heroTitle || 'Welcome to Your Service',
          heroSubtitle: site.heroSubtitle || 'Quality engagement for your audience',
          aboutSection: site.aboutSection || 'We provide authentic engagement and growth services.',
          logoUrl: site.logoUrl || '/logo.png',
        });
      }
    } catch (err) {
      setError('Failed to load site configuration');
      console.error('Error fetching site config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SiteConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/reseller/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Failed to save site configuration');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setError('An error occurred while saving');
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(config.customDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      {error && (
        <div className="fixed top-4 right-4 px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 z-50">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/reseller/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <CuteIconAnimation type="bounce" duration={1.5}>
              <FiTarget className="w-8 h-8 text-blue-400" />
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </Link>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex gap-4"
          >
            <a
              href={`https://${config.customDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition flex gap-2 items-center"
            >
              <FiEye className="w-4 h-4" />
              Preview
            </a>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition flex gap-2 items-center"
            >
              {saved ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/reseller/dashboard" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black mb-2">
            Customize Your <GradientText>Reseller Site</GradientText>
          </h1>
          <p className="text-slate-400">Make it yours. Customize colors, content, and branding without touching code.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Tab Buttons */}
            <div className="flex gap-4 mb-6 border-b border-slate-800">
              {['branding', 'content', 'pages'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold capitalize transition ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <InteractiveCard glowColor="blue">
                <div className="p-8 space-y-6">
                  {/* Site Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={config.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Your Reseller Site"
                    />
                  </div>

                  {/* Custom Domain */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Custom Domain
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.customDomain}
                        onChange={(e) => handleChange('customDomain', e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        placeholder="yoursite.com"
                      />
                      <button
                        onClick={handleCopyDomain}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-slate-300"
                      >
                        {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">You can map your own domain to this site</p>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Logo
                    </label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <p className="text-slate-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG (max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-3 gap-4">
                    {['primaryColor', 'secondaryColor', 'accentColor'].map(colorKey => (
                      <div key={colorKey}>
                        <label className="block text-sm font-semibold text-slate-300 mb-2 capitalize">
                          {colorKey.replace('Color', ' Color')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={config[colorKey as keyof SiteConfig]}
                            onChange={(e) => handleChange(colorKey as keyof SiteConfig, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={config[colorKey as keyof SiteConfig]}
                            onChange={(e) => handleChange(colorKey as keyof SiteConfig, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </InteractiveCard>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <InteractiveCard glowColor="blue">
                <div className="p-8 space-y-6">
                  {/* Hero Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Hero Title
                    </label>
                    <input
                      type="text"
                      value={config.heroTitle}
                      onChange={(e) => handleChange('heroTitle', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Welcome to Your Service"
                    />
                    <p className="text-xs text-slate-400 mt-1">Main headline your visitors see first</p>
                  </div>

                  {/* Hero Subtitle */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Hero Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.heroSubtitle}
                      onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Quality engagement for your audience"
                    />
                  </div>

                  {/* About Section */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      About Section
                    </label>
                    <textarea
                      value={config.aboutSection}
                      onChange={(e) => handleChange('aboutSection', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none h-32"
                      placeholder="Tell visitors about your service..."
                    />
                    <p className="text-xs text-slate-400 mt-1">HTML supported for advanced formatting</p>
                  </div>
                </div>
              </InteractiveCard>
            )}

            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <InteractiveCard glowColor="blue">
                <div className="p-8 space-y-4">
                  <p className="text-slate-400 mb-6">Manage additional pages on your site (coming soon)</p>
                  <div className="space-y-2">
                    {['Home', 'Services', 'Pricing', 'About', 'Contact', 'FAQ'].map(page => (
                      <div key={page} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <span className="font-semibold text-white">{page}</span>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                          Edit →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </InteractiveCard>
            )}
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <InteractiveCard glowColor="purple">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">Live Preview</h3>
                <div
                  className="rounded-lg overflow-hidden border-2 border-slate-700 h-96 flex flex-col justify-between p-4"
                  style={{ backgroundColor: config.primaryColor + '20' }}
                >
                  <div>
                    <div className="w-full h-12 rounded-lg mb-4" style={{ backgroundColor: config.primaryColor }}></div>
                    <h2
                      className="text-xl font-bold mb-2"
                      style={{ color: config.primaryColor }}
                    >
                      {config.heroTitle}
                    </h2>
                    <p className="text-sm text-slate-300 mb-4">
                      {config.heroSubtitle}
                    </p>
                  </div>
                  <button
                    className="w-full py-2 rounded-lg font-bold text-white"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    Get Started
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Preview updates as you edit. Go live instantly with Save Changes.
                </p>
              </div>
            </InteractiveCard>

            {/* Quick Links */}
            <div className="mt-6 space-y-3">
              <button className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-white transition">
                View Full Preview
              </button>
              <Link
                href="/reseller/dashboard/analytics"
                className="block w-full px-4 py-3 text-center bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-white transition"
              >
                View Analytics
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
