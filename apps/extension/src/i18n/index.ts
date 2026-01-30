export {
  default as i18n,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  changeLanguage,
  getCurrentLanguage,
  isLanguageSupported,
} from './config';
export type { SupportedLanguage } from './config';

export { useLanguage } from './useLanguage';
export type { UseLanguageReturn } from './useLanguage';
