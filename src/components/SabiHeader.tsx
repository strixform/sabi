'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiLogOut, FiHome, FiShoppingCart, FiKey, FiBook } from 'react-icons/fi';
import { LogoImage } from './LogoImage';

interface SabiHeaderProps {
  showNavigation?: boolean;
}

export const SabiHeader: React.FC<SabiHeaderProps> = ({ showNavigation = true }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/sabi/auth/logout', { method: 'POST' });
      router.push('/sabi/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { href: '/sabi/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/sabi/order/group', label: 'Group Order', icon: FiShoppingCart },
    { href: '/sabi/order', label: 'New Order', icon: FiShoppingCart },
    { href: '/sabi/api-keys', label: 'API Keys', icon: FiKey },
    { href: '/sabi/docs', label: 'Docs', icon: FiBook },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/sabi/dashboard" className="flex items-center group">
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogoImage size="sm" className="w-10 h-10 md:w-12 md:h-12" />
            </motion.div>
          </Link>

          {/* Navigation - Desktop */}
          {showNavigation && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </motion.button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Nav Indicator */}
            <div className="md:hidden text-xs text-slate-400">
              {navItems.find((item) => item.href === pathname)?.label || 'SABI'}
            </div>

            <motion.button
              onClick={handleLogout}
              className="p-2 md:px-4 md:py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showNavigation && (
          <div className="md:hidden flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </motion.button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

export default SabiHeader;
