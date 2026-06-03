'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiGlobe, FiCheck } from 'react-icons/fi';

interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'pi';
  onLanguageChange: (lang: 'en' | 'pi') => void;
  variant?: 'header' | 'footer';
}

const languages = [
  { code: 'en', name: 'English', label: 'EN' },
  { code: 'pi', name: 'Pidgin', label: 'PI' },
];

export function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  variant = 'header',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'footer') {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-xs text-slate-500">Language:</span>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code as 'en' | 'pi');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                currentLanguage === lang.code
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 hover:text-white transition"
      >
        <FiGlobe className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {languages.find((l) => l.code === currentLanguage)?.label}
        </span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code as 'en' | 'pi');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between transition ${
                currentLanguage === lang.code
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="font-semibold">{lang.name}</div>
                <div className="text-xs text-slate-500">{lang.label}</div>
              </div>
              {currentLanguage === lang.code && (
                <FiCheck className="w-4 h-4 text-blue-400" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
