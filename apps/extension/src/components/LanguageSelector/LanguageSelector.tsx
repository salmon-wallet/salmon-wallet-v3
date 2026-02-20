import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type LanguageSelectorBaseProps, type LanguageSelectorItem } from '@salmon/shared';
import { SettingsPageLayout } from '../SettingsPageLayout';
import { SettingsSelectorList } from '../SettingsSelectorList';

export function LanguageSelector({
  languages,
  activeLanguageCode,
  onSelectLanguage,
  onBack,
}: LanguageSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (item: LanguageSelectorItem) => onSelectLanguage(item.code),
    [onSelectLanguage]
  );

  return (
    <SettingsPageLayout
      title={t('settings.languages.title', 'Language')}
      onBack={onBack}
    >
      <SettingsSelectorList
        items={languages}
        getKey={(item) => item.code}
        isSelected={(item) => activeLanguageCode === item.code}
        onSelect={handleSelect}
        getPrimaryText={(item) => item.nativeName}
        getSecondaryText={(item) => item.code.toUpperCase()}
      />
    </SettingsPageLayout>
  );
}

export default LanguageSelector;
