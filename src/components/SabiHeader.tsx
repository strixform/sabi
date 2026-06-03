'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTarget, FiLogOut } from 'react-icons/fi';
import { GradientText } from '@/components/AnimatedText';
import { CuteIconAnimation } from '@/components/CuteIconAnimation';
import { useResellerAuth } from '@/lib/useResellerAuth';

interface HeaderProps {
  showAuth?: boolean;
  rightLinks?: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>;
  onLogout?: () => void;
}

export default function SabiHeader({
  showAuth = true,
  rightLinks = [],
  onLogout,
}: HeaderProps) {
  const { reseller, logout: handleLogout } = useResellerAuth();

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <CuteIconAnimation type="bounce" duration={1.5}>
              <FiTarget className="w-8 h-8 text-blue-400" />
            </CuteIconAnimation>
            <div className="text-2xl font-black">
              <GradientText>SABI</GradientText>
            </div>
          </Link>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex gap-4 items-center"
        >
          {/* Custom Links */}
          {rightLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition ${
                link.variant === 'primary'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
                  : 'text-white hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth Links - Only show if not authenticated */}
          {showAuth && !reseller && (
            <>
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
            </>
          )}

          {/* Dashboard & Logout - Only show if authenticated */}
          {showAuth && reseller && (
            <>
              <Link
                href="/reseller/dashboard"
                className="px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await handleLogout();
                  if (onLogout) onLogout();
                }}
                className="px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg transition flex gap-2 items-center"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </motion.div>
      </div>
    </header>
  );
}
