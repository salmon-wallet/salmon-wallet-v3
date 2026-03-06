/**
 * AccountAvatarPanel - Avatar selection component for mobile
 *
 * Displays two tabs:
 * - Presets: Grid of 25 preset Salmon avatars
 * - NFTs: Grid of user's NFT collectibles
 *
 * Used in the settings flow to change the account profile picture.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  fontSize,
  fontFamilyNative,
  PRESET_AVATAR_URLS,
  useAvatarNfts,
  type NftAvatarItem,
  type AvatarPickerPropsBase,
  opacity,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Constants
// ============================================================================

const PRESET_COLUMNS = 5;
const NFT_COLUMNS = 3;
const AVATAR_SIZE = 60;

type Tab = 'presets' | 'nfts';

// ============================================================================
// Types
// ============================================================================

export type AccountAvatarPanelProps = AvatarPickerPropsBase;

// ============================================================================
// Component
// ============================================================================

export function AccountAvatarPanel({
  currentAvatarUrl,
  account,
  onSave,
  onBack,
}: AccountAvatarPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('presets');
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(currentAvatarUrl);

  const { nfts, loading: nftsLoading } = useAvatarNfts({
    account,
    enabled: activeTab === 'nfts',
  });

  const hasChanged = selectedUrl !== currentAvatarUrl;

  const handleSave = useCallback(() => {
    if (selectedUrl && hasChanged) {
      onSave(selectedUrl);
    }
  }, [selectedUrl, hasChanged, onSave]);

  // Preset avatar item renderer
  const renderPresetItem = useCallback(
    ({ item }: { item: string }) => {
      const isSelected = selectedUrl === item;
      return (
        <TouchableOpacity
          style={[styles.presetItem, isSelected && styles.presetItemSelected]}
          onPress={() => setSelectedUrl(item)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item }}
            style={styles.presetImage}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>
      );
    },
    [selectedUrl],
  );

  // NFT item renderer
  const renderNftItem = useCallback(
    ({ item }: { item: NftAvatarItem }) => {
      const isSelected = selectedUrl === item.image;
      return (
        <TouchableOpacity
          style={[styles.nftItem, isSelected && styles.nftItemSelected]}
          onPress={() => item.image && setSelectedUrl(item.image)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.nftImage}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>
      );
    },
    [selectedUrl],
  );

  const presetKeyExtractor = useCallback((_item: string, index: number) => `preset-${index}`, []);
  const nftKeyExtractor = useCallback((item: NftAvatarItem) => item.mint, []);

  return (
    <SettingsScreenLayout
      title={t('settings.profile_picture')}
      onBack={onBack}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'presets' && styles.tabActive]}
            onPress={() => setActiveTab('presets')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'presets' && styles.tabTextActive]}>
              {t('settings.avatar_presets')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nfts' && styles.tabActive]}
            onPress={() => setActiveTab('nfts')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'nfts' && styles.tabTextActive]}>
              {t('settings.avatar_nfts')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'presets' ? (
          <FlatList
            style={styles.list}
            data={PRESET_AVATAR_URLS}
            renderItem={renderPresetItem}
            keyExtractor={presetKeyExtractor}
            numColumns={PRESET_COLUMNS}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
        ) : nftsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : nfts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('settings.avatar_empty_nfts')}</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={nfts}
            renderItem={renderNftItem}
            keyExtractor={nftKeyExtractor}
            numColumns={NFT_COLUMNS}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !hasChanged && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanged}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveButtonText, !hasChanged && styles.saveButtonTextDisabled]}>
            {t('actions.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </SettingsScreenLayout>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  gridContent: {
    paddingBottom: spacing.lg,
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetItem: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: borderWidth.medium,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    borderColor: colors.accent.primary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  nftItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: borderWidth.medium,
    borderColor: 'transparent',
  },
  nftItemSelected: {
    borderColor: colors.accent.primary,
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: opacity.faint,
  },
  saveButtonText: {
    fontFamily: fontFamilyNative.bold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  saveButtonTextDisabled: {
    color: colors.text.secondary,
  },
});

export default AccountAvatarPanel;
