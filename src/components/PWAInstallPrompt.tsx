'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload } from 'react-icons/fi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setShowPrompt(false);
    }
  };

  if (installed || !installPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:w-96 z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 rounded-lg shadow-2xl overflow-hidden border border-cyan-400/50 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/sabi-logo.png?v=2024060501"
                    alt="SABI Logo"
                    className="w-16 h-16"
                  />
                  <div>
                    <p className="text-xs text-blue-50 font-medium">Install to home screen</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowPrompt(false)}
                  className="text-blue-100 hover:text-white transition"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setShowPrompt(false)}
                  className="px-4 py-2 bg-blue-700/70 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg border border-blue-500/30 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Later
                </motion.button>
                <motion.button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-white text-blue-700 text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-50 shadow-lg transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload className="w-4 h-4" />
                  Install
                </motion.button>
              </div>

              <p className="text-xs text-blue-50 mt-3 font-medium">
                💫 Offline mode • Push alerts • No ads • Fast access
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
