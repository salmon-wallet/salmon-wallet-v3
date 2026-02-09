import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as SecureStore from '../../utils/secureStore';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './config';

const LANGUAGE_STORAGE_KEY = 'salmon_language_preference';

/**
 * Get the stored language preference from SecureStore
 * This is exported for use in I18nProvider initialization
 */
export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'es')) {
      return storedLanguage as SupportedLanguage;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get stored language:', error);
    return null;
  }
}

/**
 * Store the language preference in SecureStore
 */
async function storeLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to store language:', error);
  }
}

/**
 * Custom hook for managing language preferences
 * Provides current language, available languages, and a function to change language
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  // Get current language
  const currentLanguage = i18n.language as SupportedLanguage;

  // Get display name for current language
  const currentLanguageDisplay = SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES.en;

  // Change language and persist to storage
  const changeLanguage = useCallback(
    async (language: SupportedLanguage) => {
      if (language === currentLanguage) return;

      setIsChanging(true);
      try {
        await i18n.changeLanguage(language);
        await storeLanguage(language);
      } catch (error) {
        console.error('Failed to change language:', error);
      } finally {
        setIsChanging(false);
      }
    },
    [i18n, currentLanguage]
  );

  // Get list of available languages
  const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
    isSelected: code === currentLanguage,
  }));

  return {
    currentLanguage,
    currentLanguageDisplay,
    availableLanguages,
    changeLanguage,
    isChanging,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

export default useLanguage;
