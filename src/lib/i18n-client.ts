import { useState, useEffect } from 'react';

type Language = 'en' | 'pi';

interface Translations {
  [key: string]: any;
}

let translationsCache: { [key in Language]?: Translations } = {};

async function loadTranslations(lang: Language): Promise<Translations> {
  if (translationsCache[lang]) {
    return translationsCache[lang]!;
  }

  try {
    const response = await fetch(`/locales/${lang}/common.json`);
    const data = await response.json();
    translationsCache[lang] = data;
    return data;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}`, error);
    return {};
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('language') as Language | null;
    const browserLang = navigator.language.startsWith('yo')
      ? 'pi'
      : navigator.language.startsWith('ig')
        ? 'pi'
        : 'en';

    const selectedLang = saved || browserLang;
    setLanguage(selectedLang);

    // Load translations
    loadTranslations(selectedLang).then((trans) => {
      setTranslations(trans);
      setLoading(false);
    });
  }, []);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    loadTranslations(lang).then(setTranslations);
  };

  const t = (key: string, defaultValue: string = ''): string => {
    const value = getNestedValue(translations, key);
    return typeof value === 'string' ? value : defaultValue || key;
  };

  return { language, switchLanguage, t, loading };
}

export type { Language };
