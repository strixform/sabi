'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiX, FiZap } from 'react-icons/fi';

export interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
  reduceMotion: boolean;
}

interface AccessibilitySettingsComponentProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export function AccessibilitySettings({
  onSettingsChange = () => {},
}: AccessibilitySettingsComponentProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    textSize: 'normal',
    highContrast: false,
    reduceMotion: false,
  });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('accessibility');
    if (saved) {
      const loaded = JSON.parse(saved);
      setSettings(loaded);
      applySettings(loaded);
    } else {
      // Auto-detect from OS settings
      detectOSSettings();
    }
  }, []);

  function detectOSSettings() {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const prefersContrast = window.matchMedia(
      '(prefers-contrast: more)'
    ).matches;
    const prefersLargeText = window.matchMedia(
      '(prefers-reduced-transparency: reduce)'
    ).matches;

    if (prefersReducedMotion || prefersContrast || prefersLargeText) {
      const detected: AccessibilitySettings = {
        textSize: prefersLargeText ? 'large' : 'normal',
        highContrast: prefersContrast,
        reduceMotion: prefersReducedMotion,
      };
      setSettings(detected);
      applySettings(detected);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    }
  }

  function applySettings(newSettings: AccessibilitySettings) {
    // Apply text size
    const sizeMap = {
      normal: '1rem',
      large: '1.125rem',
      extraLarge: '1.25rem',
    };
    document.documentElement.style.fontSize = sizeMap[newSettings.textSize];

    // Apply high contrast
    if (newSettings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (newSettings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Save settings
    localStorage.setItem('accessibility', JSON.stringify(newSettings));
    onSettingsChange(newSettings);
  }

  function updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  }

  function resetSettings() {
    const defaultSettings: AccessibilitySettings = {
      textSize: 'normal',
      highContrast: false,
      reduceMotion: false,
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  }

  return (
    <>
      {/* Accessibility Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition"
        title="Accessibility Settings"
      >
        <FiSettings className="w-5 h-5" />
      </motion.button>

      {/* Notification for Auto-Detected Settings */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-40 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-xs"
          >
            <FiZap className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              We detected your accessibility preferences. Settings applied!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-20 right-6 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold">Accessibility Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1 rounded transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Text Size */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Text Size
                  </label>
                  <div className="flex gap-2">
                    {(['normal', 'large', 'extraLarge'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSetting('textSize', size)}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                          settings.textSize === size
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span
                          style={{
                            fontSize:
                              size === 'normal'
                                ? '0.875rem'
                                : size === 'large'
                                  ? '1rem'
                                  : '1.125rem',
                          }}
                        >
                          {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    High Contrast Mode
                  </label>
                  <button
                    onClick={() =>
                      updateSetting('highContrast', !settings.highContrast)
                    }
                    className={`w-full px-4 py-2 rounded font-medium transition ${
                      settings.highContrast
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {settings.highContrast ? '✓ Enabled' : 'Enable'}
                  </button>
                </div>

                {/* Reduce Motion */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Reduce Motion
                  </label>
                  <button
                    onClick={() =>
                      updateSetting('reduceMotion', !settings.reduceMotion)
                    }
                    className={`w-full px-4 py-2 rounded font-medium transition ${
                      settings.reduceMotion
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {settings.reduceMotion ? '✓ Enabled' : 'Enable'}
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={resetSettings}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition text-sm"
                >
                  Reset to Default
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CSS for High Contrast and Reduce Motion */}
      <style>{`
        :root.high-contrast {
          --bg-dark: #000;
          --bg-darker: #111;
          --border-color: #fff;
          --text-primary: #fff;
          --text-secondary: #e5e7eb;
        }

        :root.reduce-motion,
        :root.reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        :root.high-contrast {
          background-color: #000;
          color: #fff;
        }

        :root.high-contrast * {
          border-color: #fff !important;
        }
      `}</style>
    </>
  );
}
