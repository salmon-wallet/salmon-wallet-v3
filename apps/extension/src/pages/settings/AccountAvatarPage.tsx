/**
 * AccountAvatarPage - Avatar / Profile Picture selection for extension
 *
 * Displays two tabs:
 * - Presets: Grid of 25 preset Salmon avatars
 * - NFTs: Grid of user's NFT collectibles
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  PRESET_AVATAR_URLS,
  useAccountsContext,
  useAvatarNfts,
} from '@salmon/shared';
import { SettingsPageLayout } from '../../components/SettingsPageLayout';

// ============================================================================
// Types
// ============================================================================

export interface AccountAvatarPageProps {
  onBack: () => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const ToggleContainer = styled(Box)({
  display: 'flex',
  margin: `0 ${spacing.lg}px`,
  marginBottom: spacing.lg,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: borderRadius.md,
  position: 'relative',
  padding: spacing.xxs,
});

const ToggleHighlight = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isRight',
})<{ isRight?: boolean }>(({ isRight }) => ({
  position: 'absolute',
  top: spacing.xxs,
  left: isRight ? '50%' : spacing.xxs,
  width: `calc(50% - ${spacing.xxs}px)`,
  height: `calc(100% - ${spacing.xxs * 2}px)`,
  backgroundColor: colors.accent.primary,
  borderRadius: borderRadius.md - spacing.xxs,
  transition: 'left 0.25s ease',
}));

const ToggleButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  flex: 1,
  position: 'relative',
  zIndex: 1,
  background: 'none',
  border: 'none',
  padding: `${spacing.sm}px 0`,
  cursor: 'pointer',
  fontWeight: fontWeight.semibold,
  fontSize: fontSize.base,
  color: isActive ? colors.text.primary : colors.text.secondary,
  textAlign: 'center',
  transition: 'color 0.25s ease',
  fontFamily: 'inherit',
}));

const Grid = styled(Box)({
  display: 'grid',
  padding: `0 ${spacing.lg}px`,
  gap: spacing.sm,
});

const PresetGrid = styled(Grid)({
  gridTemplateColumns: 'repeat(5, 1fr)',
});

const NftGrid = styled(Grid)({
  gridTemplateColumns: 'repeat(3, 1fr)',
});

const AvatarCircle = styled('button', {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  aspectRatio: '1',
  borderRadius: '50%',
  overflow: 'hidden',
  border: isSelected ? `3px solid ${colors.accent.primary}` : '3px solid transparent',
  padding: 0,
  cursor: 'pointer',
  background: 'none',
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: isSelected ? colors.accent.primary : 'rgba(255, 255, 255, 0.3)',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
}));

const NftCard = styled('button', {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  aspectRatio: '1',
  borderRadius: borderRadius.md,
  overflow: 'hidden',
  border: isSelected ? `3px solid ${colors.accent.primary}` : '3px solid transparent',
  padding: 0,
  cursor: 'pointer',
  background: 'none',
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: isSelected ? colors.accent.primary : 'rgba(255, 255, 255, 0.3)',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const SaveButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isDisabled',
})<{ isDisabled?: boolean }>(({ isDisabled }) => ({
  display: 'flex',
  width: `calc(100% - ${spacing.lg * 2}px)`,
  margin: `${spacing.lg}px auto 0`,
  padding: `${spacing.md}px`,
  textTransform: 'none',
  fontWeight: fontWeight.bold,
  fontSize: fontSize.md,
  borderRadius: borderRadius.lg,
  backgroundColor: isDisabled ? 'rgba(255, 255, 255, 0.1)' : colors.accent.primary,
  color: isDisabled ? colors.text.secondary : colors.text.primary,
  '&:hover': {
    backgroundColor: isDisabled ? 'rgba(255, 255, 255, 0.1)' : colors.accent.primary,
  },
  '&.Mui-disabled': {
    color: colors.text.secondary,
  },
}));

const EmptyState = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing['3xl']}px`,
});

const LoadingState = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing['3xl']}px`,
});

const ScrollContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
});

// ============================================================================
// Component
// ============================================================================

export function AccountAvatarPage({ onBack }: AccountAvatarPageProps): React.ReactElement {
  const { t } = useTranslation();
  const [state, actions] = useAccountsContext();
  const { activeAccount } = state;

  const [activeTab, setActiveTab] = useState<'presets' | 'nfts'>('presets');
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(activeAccount?.avatar);

  const { nfts, loading: nftsLoading } = useAvatarNfts({
    account: activeAccount,
    enabled: activeTab === 'nfts',
  });

  const hasChanged = selectedUrl !== activeAccount?.avatar;

  const handleSave = useCallback(async () => {
    if (activeAccount && selectedUrl && hasChanged) {
      await actions.editAccount(activeAccount.id, { avatar: selectedUrl });
      onBack();
    }
  }, [activeAccount, selectedUrl, hasChanged, actions, onBack]);

  if (!activeAccount) return <div />;

  return (
    <SettingsPageLayout title={t('settings.profile_picture')} onBack={onBack}>
      {/* Toggle */}
      <ToggleContainer>
        <ToggleHighlight isRight={activeTab === 'nfts'} />
        <ToggleButton
          isActive={activeTab === 'presets'}
          onClick={() => setActiveTab('presets')}
        >
          {t('settings.avatar_presets')}
        </ToggleButton>
        <ToggleButton
          isActive={activeTab === 'nfts'}
          onClick={() => setActiveTab('nfts')}
        >
          {t('settings.avatar_nfts')}
        </ToggleButton>
      </ToggleContainer>

      {/* Content */}
      <ScrollContent>
        {activeTab === 'presets' ? (
          <PresetGrid>
            {PRESET_AVATAR_URLS.map((url, index) => (
              <AvatarCircle
                key={index}
                isSelected={selectedUrl === url}
                onClick={() => setSelectedUrl(url)}
              >
                <img src={url} alt={`Avatar ${index}`} loading="lazy" />
              </AvatarCircle>
            ))}
          </PresetGrid>
        ) : nftsLoading ? (
          <LoadingState>
            <CircularProgress size={32} sx={{ color: colors.accent.primary }} />
          </LoadingState>
        ) : nfts.length === 0 ? (
          <EmptyState>
            <Typography sx={{ color: colors.text.secondary, fontSize: fontSize.base }}>
              {t('settings.avatar_empty_nfts')}
            </Typography>
          </EmptyState>
        ) : (
          <NftGrid>
            {nfts.map((nft) => (
              <NftCard
                key={nft.mint}
                isSelected={selectedUrl === nft.image}
                onClick={() => nft.image && setSelectedUrl(nft.image)}
              >
                <img src={nft.image} alt={nft.name} loading="lazy" />
              </NftCard>
            ))}
          </NftGrid>
        )}
      </ScrollContent>

      {/* Save Button */}
      <SaveButton
        isDisabled={!hasChanged}
        disabled={!hasChanged}
        onClick={handleSave}
      >
        {t('actions.save')}
      </SaveButton>
    </SettingsPageLayout>
  );
}

export default AccountAvatarPage;
