// i18n configuration and initialization
export { default as i18n, SUPPORTED_LANGUAGES } from './config';
export type { SupportedLanguage } from './config';

// Provider component
export { I18nProvider } from './I18nProvider';

// Custom hook for language management
export { useLanguage, getStoredLanguage } from './useLanguage';
