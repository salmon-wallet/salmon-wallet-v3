import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from '@salmon/shared';

// Available languages
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Storage key for persisting language preference
export const LANGUAGE_STORAGE_KEY = 'salmon_language';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    resources: {
      en: {
        translation: translations.en,
      },
      es: {
        translation: translations.es,
      },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // Key used in localStorage
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },

    interpolation: {
      // React already escapes values
      escapeValue: false,
    },

    // React i18next options
    react: {
      // Use suspense for loading translations
      useSuspense: false,
    },
  });

export default i18n;

/**
 * Change the current language
 * @param language - The language code to switch to
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Get the current language
 * @returns The current language code
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
};

/**
 * Check if a language is supported
 * @param language - The language code to check
 * @returns True if the language is supported
 */
export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
};
