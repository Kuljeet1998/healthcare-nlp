import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// Define supported languages
export const supportedLanguages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Initialize i18n
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Namespaces
    ns: ['common', 'navigation', 'forms', 'medical', 'errors'],
    defaultNS: 'common',
    
    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // React configuration
    react: {
      useSuspense: false,
    },
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Function to change language
export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);
};

export default i18n;
