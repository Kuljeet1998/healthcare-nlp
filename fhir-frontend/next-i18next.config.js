module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar'],
  },
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  // Enable all common namespaces
  ns: ['common', 'navigation', 'forms', 'medical', 'errors'],
  defaultNS: 'common',
  
  // Backend options
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  
  // React options
  react: {
    useSuspense: false,
  },
  
  // Interpolation options
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  
  // Detection options
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
};
