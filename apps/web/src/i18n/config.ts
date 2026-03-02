import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  i18nResources,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from '@salmon/shared';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: i18nResources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: AVAILABLE_LANGUAGES,
    detection: {
      order: ['navigator', 'htmlTag'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

export const changeLanguage = async (language: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || DEFAULT_LANGUAGE;
};
