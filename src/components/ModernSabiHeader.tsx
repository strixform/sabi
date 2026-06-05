'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiHome, FiShoppingCart, FiKey, FiBook, FiMenu, FiX, FiCreditCard, FiDownload, FiInbox } from 'react-icons/fi';
import { LogoImage } from './LogoImage';

interface ModernSabiHeaderProps {
  showNavigation?: boolean;
}

export const ModernSabiHeader: React.FC<ModernSabiHeaderProps> = ({ showNavigation = true }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Already installed as PWA?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
    } else {
      // iOS or browsers without beforeinstallprompt → show manual instructions
      setShowInstallModal(true);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/sabi/auth/me', { credentials: 'include' });
        setIsLoggedIn(response.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/sabi/auth/logout', { method: 'POST' });
      router.push('/sabi/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { href: '/sabi/dashboard', label: 'Dashboard', icon: FiHome, badge: null },
    { href: '/sabi/order', label: 'New Order', icon: FiShoppingCart, badge: 'Quick' },
    { href: '/sabi/orders', label: 'Orders', icon: FiInbox, badge: null },
    { href: '/sabi/api-keys', label: 'API Keys', icon: FiKey, badge: null },
    { href: '/sabi/docs', label: 'Docs', icon: FiBook, badge: 'Dev' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo & Branding */}
          <Link href={isLoggedIn ? '/sabi/dashboard' : '/'} className="flex items-center group">
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogoImage size="sm" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          {showNavigation && (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      className={`relative px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 group ${
                        active
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <motion.span
                          className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                      {active && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                          layoutId="navUnderline"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Status Indicator - Only show when logged in */}
            {isLoggedIn && (
              <motion.div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-emerald-300 font-semibold">Live</span>
              </motion.div>
            )}

            {/* Fund Wallet Button - Only show when logged in */}
            {isLoggedIn && (
              <Link href="/sabi/wallet">
                <motion.button
                  className="p-2 lg:px-4 lg:py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-emerald-300 hover:from-green-500/30 hover:to-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex items-center gap-2 text-sm font-semibold group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Fund Wallet"
                >
                  <FiCreditCard className="w-4 h-4" />
                  <span className="hidden lg:inline">Fund Wallet</span>
                </motion.button>
              </Link>
            )}

            {/* Login/Signup - Only show when NOT logged in */}
            {!isLoggedIn && (
              <div className="flex items-center gap-2">
                <Link href="/sabi/login">
                  <motion.button
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/sabi/register">
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all text-sm font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Logout - Only show when logged in */}
            {isLoggedIn && (
              <motion.button
                onClick={handleLogout}
                className="p-2 lg:px-4 lg:py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm font-semibold group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Logout"
              >
                <FiLogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden lg:inline">Logout</span>
              </motion.button>
            )}

            {/* Install App Button — always visible, not dependent on browser event */}
            {!isInstalled && (
              <motion.button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 hover:from-blue-500/30 hover:to-purple-500/30 transition-all text-xs font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Install SABI app"
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            {showNavigation && (
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                whileTap={{ scale: 0.9 }}
              >
                {mobileMenuOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showNavigation && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden border-t border-slate-800 bg-slate-900/50"
            >
              <div className="flex flex-col gap-1 py-3">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                          active
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                            {item.badge}
                          </span>
                        )}
                      </motion.button>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Install instructions modal (iOS + browsers without auto-prompt) */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
            onClick={() => setShowInstallModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Install SABI App</h3>
                <button onClick={() => setShowInstallModal(false)} className="text-slate-400 hover:text-white">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">On iPhone / iPad (Safari):</p>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p>Tap the <span className="text-blue-400 font-semibold">Share</span> button at the bottom of Safari (the box with an arrow pointing up)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p>Scroll down and tap <span className="text-blue-400 font-semibold">"Add to Home Screen"</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <p>Tap <span className="text-blue-400 font-semibold">Add</span> — SABI will appear on your home screen like a native app</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">On Chrome / Edge (Android or desktop):</p>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p>Tap the <span className="text-blue-400 font-semibold">⋮ menu</span> (three dots) in the top-right of Chrome</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p>Tap <span className="text-blue-400 font-semibold">"Add to Home Screen"</span> or <span className="text-blue-400 font-semibold">"Install App"</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <p>Tap <span className="text-blue-400 font-semibold">Install</span></p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstallModal(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ModernSabiHeader;
