import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: 'ltr' | 'rtl';
  isUrdu: boolean;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('freetools_hub_lang');
      return saved === 'ur' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });


  const dir: 'ltr' | 'rtl' = language === 'ur' ? 'rtl' : 'ltr';
  const isUrdu = language === 'ur';

  // Helper to apply DOM attributes immediately to html and body
  const applyDomLanguage = (lang: Language) => {
    const nextDir: 'ltr' | 'rtl' = lang === 'ur' ? 'rtl' : 'ltr';
    const root = document.documentElement;
    root.dir = nextDir;
    root.setAttribute('dir', nextDir);
    root.lang = lang;
    root.setAttribute('lang', lang);
    if (document.body) {
      document.body.dir = nextDir;
      document.body.setAttribute('dir', nextDir);
    }
    if (nextDir === 'rtl') {
      root.classList.add('rtl');
    } else {
      root.classList.remove('rtl');
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    applyDomLanguage(lang);
    try {
      localStorage.setItem('freetools_hub_lang', lang);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('freetools_workspace_mutated'));
      }
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ur' : 'en';
    setLanguage(nextLang);
  };

  // Apply on mount and whenever language or dir changes
  useEffect(() => {
    applyDomLanguage(language);
    try {
      localStorage.setItem('freetools_hub_lang', language);
    } catch {
      // ignore
    }
  }, [language, dir]);

  // Synchronize language across multiple browser tabs and cloud hydration
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'freetools_hub_lang' && (e.newValue === 'en' || e.newValue === 'ur')) {
        const newLang = e.newValue as Language;
        setLanguageState(newLang);
        applyDomLanguage(newLang);
      }
    };

    const handleCloudHydration = () => {
      try {
        const saved = localStorage.getItem('freetools_hub_lang');
        if (saved === 'en' || saved === 'ur') {
          setLanguageState(saved);
          applyDomLanguage(saved);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('freetools_cloud_hydrated', handleCloudHydration);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('freetools_cloud_hydrated', handleCloudHydration);
    };
  }, []);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        dir,
        isUrdu,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
