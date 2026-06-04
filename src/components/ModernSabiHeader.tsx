'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiHome, FiShoppingCart, FiKey, FiBook, FiMenu, FiX } from 'react-icons/fi';
import { SabiLogo } from './SabiLogo';

interface ModernSabiHeaderProps {
  showNavigation?: boolean;
}

export const ModernSabiHeader: React.FC<ModernSabiHeaderProps> = ({ showNavigation = true }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { href: '/sabi/api-keys', label: 'API Keys', icon: FiKey, badge: null },
    { href: '/sabi/docs', label: 'Docs', icon: FiBook, badge: 'Dev' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo & Branding */}
          <Link href="/sabi/dashboard" className="flex items-center gap-2 sm:gap-3 group">
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <SabiLogo size="sm" className="sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <motion.h1
                className="text-base lg:text-lg font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                whileHover={{ letterSpacing: '0.05em' }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                SABI
              </motion.h1>
              <p className="text-xs lg:text-sm text-slate-400 font-medium -mt-0.5">
                Real Nigerian Engagement
              </p>
            </div>
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
            {/* Status Indicator */}
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

            {/* Logout */}
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
    </header>
  );
};

export default ModernSabiHeader;
