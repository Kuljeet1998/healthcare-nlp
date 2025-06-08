// RTL language support utility
export const RTL_LANGUAGES = ['ar'];

export const isRTLLanguage = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};

export const getTextDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTLLanguage(language) ? 'rtl' : 'ltr';
};

// Date and number formatting utilities
export const formatDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    // Fallback to English if locale is not supported
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

export const formatNumber = (number: number, locale: string): string => {
  try {
    return number.toLocaleString(locale);
  } catch (error) {
    // Fallback to English if locale is not supported
    return number.toLocaleString('en-US');
  }
};

export const formatCurrency = (amount: number, currency: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // Fallback to USD and English if locale/currency is not supported
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};
