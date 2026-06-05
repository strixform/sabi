'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHome, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import { LogoImage } from '@/components/LogoImage';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoImage size="md" className="w-14 h-14 opacity-80" />
        </div>

        {/* 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <p className="text-8xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-none">
            404
          </p>
        </motion.div>

        <h1 className="text-2xl font-black text-white mb-3">Page not found</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Looks like this page doesn't exist or has moved. Don't worry — your orders and wallet are safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sabi/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-blue-500/25"
          >
            <FiHome className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link
            href="/sabi/order"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-white font-bold rounded-xl hover:border-slate-600 hover:bg-slate-700 transition"
          >
            <FiShoppingCart className="w-4 h-4" /> Place an Order
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition text-sm mx-auto mt-6"
        >
          <FiArrowLeft className="w-4 h-4" /> Go back
        </button>
      </motion.div>
    </div>
  );
}
