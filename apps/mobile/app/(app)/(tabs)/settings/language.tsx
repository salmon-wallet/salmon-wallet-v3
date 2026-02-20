/**
 * ChangeLanguageScreen - Language selection route
 *
 * Thin route file that connects the LanguageSelector component
 * with the language hook and available languages.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';

import {
  LANGUAGE_NAMES,
  type LanguageCode,
  type LanguageSelectorItem,
} from '@salmon/shared';
import { LanguageSelector } from '../../../../src/components';
import { useLanguage } from '../../../../src/i18n';

export default function ChangeLanguageScreen() {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();

  const languageItems: LanguageSelectorItem[] = availableLanguages.map(
    (item) => ({
      code: item.code,
      nativeName: LANGUAGE_NAMES[item.code as LanguageCode] || item.code,
    })
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectLanguage = useCallback(
    async (code: string) => {
      await changeLanguage(code as LanguageCode);
      router.back();
    },
    [changeLanguage]
  );

  return (
    <LanguageSelector
      languages={languageItems}
      activeLanguageCode={currentLanguage}
      onSelectLanguage={handleSelectLanguage}
      onBack={handleBack}
    />
  );
}
