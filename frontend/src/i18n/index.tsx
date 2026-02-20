import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language, Translations, translations } from './translations';

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  const stored = localStorage.getItem('language');
  if (stored === 'fi' || stored === 'en') return stored;
  return 'fi';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem('language', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'fi' : 'en';
      localStorage.setItem('language', next);
      return next;
    });
  }, []);

  const value: I18nContextType = {
    language,
    t: translations[language],
    setLanguage,
    toggleLanguage,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
