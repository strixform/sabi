'use client';

import { useState, useEffect } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/i18n-client';

interface I18nWrapperProps {
  children: (props: {
    t: (key: string, defaultValue?: string) => string;
    language: 'en' | 'pi';
  }) => React.ReactNode;
  showLanguageSwitcher?: boolean;
  switcherVariant?: 'header' | 'footer';
}

export function I18nWrapper({
  children,
  showLanguageSwitcher = true,
  switcherVariant = 'header',
}: I18nWrapperProps) {
  const { language, switchLanguage, t, loading } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return children({ t: (key, def) => def || key, language: 'en' });
  }

  return (
    <>
      {showLanguageSwitcher && switcherVariant === 'header' && (
        <div className="absolute top-4 right-20 z-50">
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={switchLanguage}
            variant="header"
          />
        </div>
      )}
      {children({ t, language })}
      {showLanguageSwitcher && switcherVariant === 'footer' && (
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={switchLanguage}
          variant="footer"
        />
      )}
    </>
  );
}
