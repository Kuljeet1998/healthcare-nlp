'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, SupportedLanguage, changeLanguage } from '../lib/i18n';

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    setCurrentLanguage(i18n.language as SupportedLanguage);
  }, [i18n.language]);

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
      setIsOpen(false);
      
      // Update document direction for RTL languages
      if (language === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = language;
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = language;
      }
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLangData = supportedLanguages[currentLanguage];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-2">{currentLangData?.flag}</span>
        <span className="mr-2">{currentLangData?.nativeName}</span>
        <svg
          className={`-mr-1 ml-2 h-5 w-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {Object.entries(supportedLanguages).map(([code, langData]) => (
              <button
                key={code}
                className={`${
                  currentLanguage === code
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
              >
                <span className="mr-3">{langData.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{langData.nativeName}</span>
                  <span className="text-xs text-gray-500">{langData.name}</span>
                </div>
                {currentLanguage === code && (
                  <svg
                    className="ml-auto h-4 w-4 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
