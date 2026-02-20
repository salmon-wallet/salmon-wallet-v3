import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type NetworkSelectorBaseProps, type NetworkSelectorItem } from '@salmon/shared';
import { SettingsPageLayout } from '../SettingsPageLayout';
import { SettingsSelectorList } from '../SettingsSelectorList';

export function NetworkSelector({
  networks,
  activeNetworkId,
  onSelectNetwork,
  onBack,
  loading,
}: NetworkSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (item: NetworkSelectorItem) => onSelectNetwork(item.id),
    [onSelectNetwork]
  );

  return (
    <SettingsPageLayout
      title={t('settings.change_network', 'Network')}
      onBack={onBack}
    >
      <SettingsSelectorList
        items={networks}
        getKey={(item) => item.id}
        isSelected={(item) => activeNetworkId === item.id}
        onSelect={handleSelect}
        getPrimaryText={(item) => item.name}
        getSecondaryText={(item) => item.blockchain}
        secondaryTypographyProps={{ textTransform: 'capitalize' }}
        loading={loading}
      />
    </SettingsPageLayout>
  );
}

export default NetworkSelector;
