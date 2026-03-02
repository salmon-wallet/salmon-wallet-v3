/**
 * StepTokenSelect - Token selection step for the SendSheet (web/extension version)
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 * Features:
 * - Searchable token list
 * - Token logo, name, and balance display
 * - BlurContainer glassmorphism styling
 * - Scroll with top fade gradient
 */

import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import SearchIcon from '@mui/icons-material/Search';
import {
  colors,
  spacing,
  fontFamily,
  fontWeight,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { StepTokenSelectProps, SendToken } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  paddingTop: spacing.xl,
  paddingLeft: spacing.xl,
  paddingRight: spacing.xl,
  minHeight: 0,
});

const SearchWrapper = styled(Box)({
  marginBottom: spacing.xl,
});

const SearchInputStyled = styled(InputBase)({
  width: '100%',
  padding: `${spacing.sm}px ${spacing.md}px`,
  color: colors.text.primary,
  fontSize: 12,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  '& .MuiInputBase-input::placeholder': {
    color: colors.text.secondary,
    opacity: 1,
  },
});

const SearchIconStyled = styled(SearchIcon)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  fontSize: 18,
});

const SectionHeader = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing.md,
});

const ListWrapper = styled(Box)({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
});

const ListContent = styled(Box)({
  overflowY: 'auto',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  paddingBottom: spacing.xl,
  // Scrollbar styling
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
});

const TopFadeGradient = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 24,
  zIndex: 1,
  pointerEvents: 'none',
  background: `linear-gradient(to bottom, ${colors.background.secondary}, transparent)`,
  opacity: 0,
  transition: 'opacity 0.2s ease',
});

const TokenRowButton = styled(ButtonBase)({
  width: '100%',
  display: 'block',
  textAlign: 'left',
  borderRadius: 10,
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.85,
  },
});

const TokenRowContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 10,
  padding: `${spacing.md}px ${spacing.md}px`,
});

const TokenLogoImage = styled('img')({
  width: 32,
  height: 32,
  borderRadius: 16,
  objectFit: 'cover',
  marginRight: spacing.md,
  flexShrink: 0,
});

const TokenLogoFallback = styled(Box)({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.background.card,
  border: `1px solid ${colors.border.default}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.md,
  flexShrink: 0,
});

const TokenLogoFallbackText = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

const TokenName = styled(Typography)({
  flex: 1,
  fontSize: 14,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: '#d6d6d6',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const TokenBalance = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: '#d6d6d6',
  marginLeft: spacing.sm,
  flexShrink: 0,
});

const EmptyMessage = styled(Typography)({
  fontSize: 14,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  textAlign: 'center',
  padding: `${spacing['2xl']}px 0`,
});

// Skeleton styled components
const SkeletonRowContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 10,
  padding: `${spacing.md}px ${spacing.md}px`,
  gap: spacing.md,
});

const SkeletonLogo = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
  flexShrink: 0,
});

const SkeletonTextGroup = styled(Box)({
  flex: 1,
});

const SkeletonText = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
});

// ============================================================================
// Token Row Component
// ============================================================================

interface TokenRowProps {
  token: SendToken;
  onPress: (token: SendToken) => void;
}

const TokenRow = React.memo(function TokenRow({ token, onPress }: TokenRowProps) {
  const handlePress = useCallback(() => {
    onPress(token);
  }, [token, onPress]);

  const balanceDisplay = useMemo(() => {
    const amount =
      typeof token.uiAmount === 'string'
        ? parseFloat(token.uiAmount)
        : token.uiAmount;
    if (amount === 0) return `0 ${token.symbol}`;
    if (amount < 0.0001) return `<0.0001 ${token.symbol}`;
    return `${Number(amount.toFixed(4))} ${token.symbol}`;
  }, [token.uiAmount, token.symbol]);

  return (
    <TokenRowButton
      onClick={handlePress}
      aria-label={`${token.name}, ${balanceDisplay}`}
    >
      <BlurContainer style={{ borderRadius: 10 }}>
        <TokenRowContent>
          {/* Token Logo */}
          {token.logo ? (
            <TokenLogoImage
              src={token.logo}
              alt={token.symbol}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <TokenLogoFallback>
              <TokenLogoFallbackText>
                {token.symbol?.slice(0, 2).toUpperCase() || '?'}
              </TokenLogoFallbackText>
            </TokenLogoFallback>
          )}

          {/* Token Name */}
          <TokenName>{token.name}</TokenName>

          {/* Balance */}
          <TokenBalance>{balanceDisplay}</TokenBalance>
        </TokenRowContent>
      </BlurContainer>
    </TokenRowButton>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function StepTokenSelect({
  tokens,
  onSelectToken,
  showUnverifiedTokens,
  loading,
}: StepTokenSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // All hooks must be called before any early return (Rules of Hooks)
  const verifiedTokens = useMemo(() => {
    return tokens.filter((token) => {
      const hasMeaningfulTags =
        token.tags &&
        token.tags.length > 0 &&
        token.tags.some((tag) => tag !== 'unknown');
      if (hasMeaningfulTags) return true;
      return !!showUnverifiedTokens;
    });
  }, [tokens, showUnverifiedTokens]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return verifiedTokens;
    const query = searchQuery.toLowerCase().trim();
    return verifiedTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
  }, [verifiedTokens, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = (e.target as HTMLDivElement).scrollTop;
      setScrolled(scrollTop > 5);
    },
    []
  );

  if (loading) {
    return (
      <Container>
        {/* Search bar skeleton */}
        <SearchWrapper>
          <BlurContainer style={{ borderRadius: 8 }}>
            <Box sx={{ padding: `${spacing.sm}px ${spacing.md}px`, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <SkeletonLogo variant="circular" width={18} height={18} />
              <SkeletonText variant="text" width="60%" height={20} />
            </Box>
          </BlurContainer>
        </SearchWrapper>

        {/* Section header skeleton */}
        <SkeletonText variant="text" width={120} height={24} sx={{ mb: `${spacing.md}px` }} />

        {/* Token row skeletons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <BlurContainer key={i} style={{ borderRadius: 10 }}>
              <SkeletonRowContent>
                <SkeletonLogo variant="circular" width={32} height={32} />
                <SkeletonTextGroup>
                  <SkeletonText variant="text" width="60%" height={16} />
                </SkeletonTextGroup>
                <SkeletonText variant="text" width={80} height={16} />
              </SkeletonRowContent>
            </BlurContainer>
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {/* Search Input */}
      <SearchWrapper>
        <BlurContainer style={{ borderRadius: 8 }}>
          <SearchInputStyled
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            startAdornment={<SearchIconStyled />}
            autoComplete="off"
            inputProps={{
              autoCapitalize: 'none',
              autoCorrect: 'off',
              spellCheck: false,
            }}
          />
        </BlurContainer>
      </SearchWrapper>

      {/* Section Header */}
      <SectionHeader>Select Token</SectionHeader>

      {/* Token List */}
      <ListWrapper>
        <TopFadeGradient sx={{ opacity: scrolled ? 1 : 0 }} />
        <ListContent onScroll={handleScroll}>
          {filteredTokens.length === 0 ? (
            <EmptyMessage>No tokens found</EmptyMessage>
          ) : (
            filteredTokens.map((token) => (
              <TokenRow
                key={token.address}
                token={token}
                onPress={onSelectToken}
              />
            ))
          )}
        </ListContent>
      </ListWrapper>
    </Container>
  );
}

export default StepTokenSelect;
