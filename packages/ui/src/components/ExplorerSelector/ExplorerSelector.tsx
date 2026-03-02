import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ExplorerSelectorBaseProps, type ExplorerSelectorItem } from '@salmon/shared';
import { SettingsPanelContent } from '../SettingsPanelContent';
import { SettingsSelectorList } from '../SettingsSelectorList';

export function ExplorerSelector({
  explorers,
  activeExplorerName,
  onSelectExplorer,
  onBack,
  loading,
}: ExplorerSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (item: ExplorerSelectorItem) => onSelectExplorer(item.key),
    [onSelectExplorer]
  );

  return (
    <SettingsPanelContent
      title={t('settings.explorer', 'Block Explorer')}
      onBack={onBack}
    >
      <SettingsSelectorList
        items={explorers}
        getKey={(item) => item.key}
        isSelected={(item) => activeExplorerName === item.name}
        onSelect={handleSelect}
        getPrimaryText={(item) => item.name}
        loading={loading}
        emptyMessage={t('common.no_explorers', 'No explorers available for this network')}
      />
    </SettingsPanelContent>
  );
}

export default ExplorerSelector;
