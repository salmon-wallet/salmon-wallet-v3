import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage,
  getCurrentLanguage,
  isLanguageSupported,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './config';

export interface UseLanguageReturn {
  /** Current language code */
  currentLanguage: SupportedLanguage;
  /** All supported languages */
  supportedLanguages: readonly SupportedLanguage[];
  /** Change the current language */
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  /** Check if a language is supported */
  isSupported: (lang: string) => lang is SupportedLanguage;
  /** Get localized language name */
  getLanguageName: (lang: SupportedLanguage) => string;
}

/**
 * Hook to manage language settings in the extension
 * @returns Language management utilities
 */
export const useLanguage = (): UseLanguageReturn => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  // Sync state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lang: string) => {
      if (isLanguageSupported(lang)) {
        setCurrentLanguage(lang);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const setLanguage = useCallback(async (lang: SupportedLanguage): Promise<void> => {
    await changeLanguage(lang);
    setCurrentLanguage(lang);
  }, []);

  const getLanguageName = useCallback(
    (lang: SupportedLanguage): string => {
      return t(`settings.languages.${lang}`);
    },
    [t]
  );

  return {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage,
    isSupported: isLanguageSupported,
    getLanguageName,
  };
};

export default useLanguage;
