/**
 * TokenInfo - Token information display component
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  fontWeight,
  fontSize,
} from '@salmon/shared';
import { CopyIcon } from '../Icon';
import type { TokenInfoProps } from './types';

/**
 * Format large numbers for display (e.g., 1.5B, 2.3M, 150K)
 */
function formatLargeNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '-';

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
}

/**
 * Format USD currency for display
 */
function formatUSD(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return `$${formatLargeNumber(value)}`;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const Container = styled(Box)({
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
});

const Section = styled(Box)({
  marginBottom: spacing.lg,
});

const SectionTitle = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing.sm,
});

const Description = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.regular,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.muted,
  lineHeight: 1.5,
});

const StatsGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  margin: `0 -${spacing.xs}px`,
});

const StatItem = styled(Box)({
  width: '50%',
  padding: `0 ${spacing.xs}px`,
  marginBottom: spacing.md,
  boxSizing: 'border-box',
});

const StatLabel = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  marginBottom: spacing['2xs'],
});

const StatValue = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

const ContractRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.input.background,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: `${colors.input.background}cc`,
  },
});

const ContractAddress = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.regular,
  fontFamily: `${fontFamily.mono}, monospace`,
  color: colors.text.muted,
});

const CopyButton = styled(Box)({
  padding: spacing.xs,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const WebsiteRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: colors.input.background,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  marginTop: spacing.sm,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: `${colors.input.background}cc`,
  },
});

const WebsiteText = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.accent.primary,
  marginLeft: spacing.sm,
  flex: 1,
});

/**
 * Globe icon for website link
 */
function GlobeIcon({ color = colors.accent.primary }: { color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill={color}
      />
    </svg>
  );
}

/**
 * External link icon
 */
function ExternalLinkIcon({ color = colors.accent.primary }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
        fill={color}
      />
    </svg>
  );
}

/**
 * TokenInfo component for displaying token information
 *
 * Features:
 * - "About" section with description text
 * - Stats grid showing market cap, volume, supply metrics
 * - Contract address with copy button
 * - Website link (opens external browser)
 * - Loading skeleton state
 *
 * @example
 * ```tsx
 * <TokenInfo
 *   description="Solana is a high-performance blockchain..."
 *   marketCap={50000000000}
 *   volume24h={1500000000}
 *   circulatingSupply={400000000}
 *   totalSupply={500000000}
 *   contractAddress="So11111111111111111111111111111111111111112"
 *   website="https://solana.com"
 * />
 * ```
 */
export function TokenInfo({
  description,
  marketCap,
  volume24h,
  circulatingSupply,
  totalSupply,
  maxSupply,
  contractAddress,
  website,
  loading = false,
  style,
  className,
}: TokenInfoProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    if (contractAddress) {
      try {
        await navigator.clipboard.writeText(contractAddress);
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  }, [contractAddress]);

  const handleOpenWebsite = useCallback(() => {
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  }, [website]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  if (loading) {
    return (
      <Container style={style} className={className}>
        {/* About section skeleton */}
        <Section>
          <Skeleton
            variant="text"
            width={80}
            height={24}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="80%"
            height={20}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="60%"
            height={20}
            sx={{ bgcolor: colors.skeleton.base }}
          />
        </Section>

        {/* Stats grid skeleton */}
        <StatsGrid>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StatItem key={i}>
              <Skeleton
                variant="text"
                width={60}
                height={16}
                sx={{ bgcolor: colors.skeleton.base }}
              />
              <Skeleton
                variant="text"
                width={80}
                height={22}
                sx={{ bgcolor: colors.skeleton.base }}
              />
            </StatItem>
          ))}
        </StatsGrid>

        {/* Contract skeleton */}
        <Skeleton
          variant="rounded"
          height={52}
          sx={{ bgcolor: colors.skeleton.base, borderRadius: `${borderRadius.md}px` }}
        />
      </Container>
    );
  }

  const hasStats =
    marketCap !== undefined ||
    volume24h !== undefined ||
    circulatingSupply !== undefined ||
    totalSupply !== undefined ||
    maxSupply !== undefined;

  return (
    <Container style={style} className={className}>
      {/* About section */}
      {description && (
        <Section>
          <SectionTitle>About</SectionTitle>
          <Description>{description}</Description>
        </Section>
      )}

      {/* Stats grid */}
      {hasStats && (
        <Section>
          <SectionTitle>Market Stats</SectionTitle>
          <StatsGrid>
            {marketCap !== undefined && (
              <StatItem>
                <StatLabel>Market Cap</StatLabel>
                <StatValue>{formatUSD(marketCap)}</StatValue>
              </StatItem>
            )}
            {volume24h !== undefined && (
              <StatItem>
                <StatLabel>24h Volume</StatLabel>
                <StatValue>{formatUSD(volume24h)}</StatValue>
              </StatItem>
            )}
            {circulatingSupply !== undefined && (
              <StatItem>
                <StatLabel>Circulating</StatLabel>
                <StatValue>{formatLargeNumber(circulatingSupply)}</StatValue>
              </StatItem>
            )}
            {totalSupply !== undefined && (
              <StatItem>
                <StatLabel>Total Supply</StatLabel>
                <StatValue>{formatLargeNumber(totalSupply)}</StatValue>
              </StatItem>
            )}
            {maxSupply !== undefined && (
              <StatItem>
                <StatLabel>Max Supply</StatLabel>
                <StatValue>{formatLargeNumber(maxSupply)}</StatValue>
              </StatItem>
            )}
          </StatsGrid>
        </Section>
      )}

      {/* Contract address */}
      {contractAddress && (
        <Section>
          <SectionTitle>Contract Address</SectionTitle>
          <ContractRow
            onClick={handleCopyAddress}
            role="button"
            aria-label="Copy contract address"
          >
            <ContractAddress>{truncateAddress(contractAddress)}</ContractAddress>
            <CopyButton>
              <CopyIcon sx={{ color: colors.text.muted, fontSize: 18 }} />
            </CopyButton>
          </ContractRow>
        </Section>
      )}

      {/* Website link */}
      {website && (
        <WebsiteRow
          onClick={handleOpenWebsite}
          role="link"
          aria-label={`Open website: ${website}`}
        >
          <GlobeIcon />
          <WebsiteText>Visit Website</WebsiteText>
          <ExternalLinkIcon />
        </WebsiteRow>
      )}

      {/* Copy confirmation snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Contract address copied"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}

export default TokenInfo;
