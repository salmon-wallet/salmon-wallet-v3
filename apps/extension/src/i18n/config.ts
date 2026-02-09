import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  i18nResources,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
  STORAGE_KEYS,
  type LanguageCode,
} from '@salmon/shared';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    resources: i18nResources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: AVAILABLE_LANGUAGES,

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // Key used in localStorage
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
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
export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Get the current language
 * @returns The current language code
 */
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || DEFAULT_LANGUAGE;
};
