'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { changeLanguage, SupportedLanguage } from '../lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initI18n = async () => {
      try {
        // Get saved language or use browser default
        const savedLanguage = localStorage.getItem('i18nextLng') || 
                              navigator.language.split('-')[0] || 'en';
        
        // Ensure the language is supported
        const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar'];
        const supportedLang = supportedLanguages.includes(savedLanguage) 
          ? savedLanguage as SupportedLanguage
          : 'en';
        
        // Set initial document direction for RTL languages
        if (supportedLang === 'ar') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        document.documentElement.lang = supportedLang;
        
        // Change language (this will trigger translation loading)
        await changeLanguage(supportedLang);
        setIsInitialized(true);
      } catch (error) {
        console.error('i18n initialization failed:', error);
        setIsInitialized(true); // Still render with fallback
      }
    };

    // Check if i18n is already initialized
    if (i18n.isInitialized) {
      initI18n();
    } else {
      // Wait for i18n to initialize
      i18n.on('initialized', initI18n);
      return () => {
        i18n.off('initialized', initI18n);
      };
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
