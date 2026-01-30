import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { translations } from '@salmon/shared';

// Get the device language code (e.g., 'en', 'es')
const getDeviceLanguage = (): string => {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    const languageCode = locales[0].languageCode;
    // Check if we support this language, otherwise fallback to 'en'
    if (languageCode && (languageCode === 'en' || languageCode === 'es')) {
      return languageCode;
    }
  }
  return 'en';
};

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Configure i18next resources
const resources = {
  en: {
    translation: translations.en,
  },
  es: {
    translation: translations.es,
  },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already handles XSS protection
  },
  react: {
    useSuspense: false, // Disable suspense to avoid issues with React Native
  },
});

export default i18n;
