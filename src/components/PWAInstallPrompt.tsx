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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-2xl overflow-hidden border border-blue-500/50 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div>
                    <h3 className="font-bold text-white">Install SABI</h3>
                    <p className="text-xs text-blue-100">Quick access from your home screen</p>
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
                  className="px-4 py-2 bg-blue-700/50 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Not Now
                </motion.button>
                <motion.button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload className="w-4 h-4" />
                  Install
                </motion.button>
              </div>

              <p className="text-xs text-blue-100 mt-3">
                ✨ Offline access • Push notifications • App-like experience
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
