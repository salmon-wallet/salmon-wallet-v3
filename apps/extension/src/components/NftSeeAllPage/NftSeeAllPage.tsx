/**
 * NftSeeAllPage - Full-page grid view of all NFTs for a blockchain section
 *
 * Replaces the former NftSeeAllSheet dialog.
 * Renders as a full page with back navigation, matching the
 * page-navigation pattern used by TokenDetailPage and NftDetailPage.
 */

import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { colors, spacing, fontFamily } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { NftCard } from '../NftCard';
import type { NftSeeAllPageProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.background.secondary,
  position: 'relative',
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const HeaderTitle = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
});

const ScrollContent = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
});

const Grid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md,
  justifyItems: 'center',
  padding: spacing.lg,
});

// ============================================================================
// Component
// ============================================================================

export function NftSeeAllPage({
  title,
  nfts,
  onNftPress,
  onBack,
  style,
  className,
}: NftSeeAllPageProps): React.ReactElement {
  return (
    <Container style={style} className={className}>
      <ScalesBackground style={{ zIndex: 0 }} />

      <Header>
        <BackButton onClick={onBack} aria-label="Back">
          <ArrowBackIcon />
        </BackButton>
        <HeaderTitle>{title}</HeaderTitle>
      </Header>

      <ScrollContent>
        <Grid>
          {nfts.map((nft, index) => (
            <NftCard
              key={`${nft.mint}-${index}`}
              nft={nft}
              onPress={onNftPress ? () => onNftPress(nft) : undefined}
            />
          ))}
        </Grid>
      </ScrollContent>
    </Container>
  );
}
