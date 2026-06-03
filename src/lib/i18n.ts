import i18nConfig from '../../i18n.config';

export function getSupportedLanguages() {
  return i18nConfig.supportedLngs;
}

export function getFallbackLanguage() {
  return i18nConfig.fallbackLng;
}
