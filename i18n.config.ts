interface I18nConfig {
  supportedLngs: string[];
  fallbackLng: string;
  ns: string[];
  defaultNS: string;
}

const config: I18nConfig = {
  supportedLngs: ['en', 'pi'],
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
};

export default config;
