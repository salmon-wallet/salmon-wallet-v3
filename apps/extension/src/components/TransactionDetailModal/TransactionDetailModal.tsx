/**
 * TransactionDetailModal - Dialog for transaction details (web/extension version)
 *
 * Migrated from packages/ui (React Native) to MUI Dialog.
 *
 * Features:
 * - MUI Dialog container (replacing RN Modal + Reanimated)
 * - Scrollable content with DialogContent (replacing RN ScrollView)
 * - Transaction type header with icon and status badge
 * - Protocol/source badge
 * - Token inputs/outputs visualization
 * - Swap conversion display with price impact
 * - NFT metadata with attributes grid
 * - Network fee
 * - Action buttons (View on Explorer, Copy Hash, Share)
 * - Reuses sub-components from TransactionHistorySheet
 *
 * @example
 * ```tsx
 * <TransactionDetailModal
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   transaction={selectedTransaction}
 *   onViewExplorer={(tx) => openExplorer(tx.id)}
 *   onCopyHash={(hash) => copyToClipboard(hash)}
 *   onShare={(tx) => shareTransaction(tx)}
 * />
 * ```
 */

import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '../../utils/styled';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import { colors, spacing, borderRadius, fontSize, fontFamily, fontWeight, letterSpacing, lineHeight, formatBlockNumber, formatDateTime, getShortAddress, copyToClipboard } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { AddressCopyRow } from '../TransactionHistoryPage/AddressCopyRow';
import { ExplorerLinkButton } from '../TransactionHistoryPage/ExplorerLinkButton';
import { PriceImpactBadge } from '../TransactionHistoryPage/PriceImpactBadge';
import { ConversionRateDisplay } from '../TransactionHistoryPage/ConversionRateDisplay';
import type { TransactionDetailModalProps } from './types';
import type {
  TransactionType,
  TransactionTokenAmount,
  NftAttribute,
} from '../TransactionHistoryPage/types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Transaction type display configuration (MUI icon equivalents)
 */
const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  send: {
    label: 'Sent',
    icon: <ArrowUpwardIcon />,
    color: colors.change.negative,
  },
  receive: {
    label: 'Received',
    icon: <ArrowDownwardIcon />,
    color: colors.change.positive,
  },
  swap: {
    label: 'Swapped',
    icon: <SwapHorizIcon />,
    color: colors.palette.purple,
  },
  mint: {
    label: 'Minted',
    icon: <AddCircleOutlineIcon />,
    color: colors.palette.cyan,
  },
  burn: {
    label: 'Burned',
    icon: <LocalFireDepartmentIcon />,
    color: colors.palette.orange,
  },
  stake: {
    label: 'Staked',
    icon: <LockOutlinedIcon />,
    color: colors.palette.green,
  },
  loan: {
    label: 'Loan',
    icon: <AccountBalanceWalletOutlinedIcon />,
    color: colors.palette.amber,
  },
  interaction: {
    label: 'Interaction',
    icon: <ViewInArOutlinedIcon />,
    color: colors.palette.blue,
  },
  unknown: {
    label: 'Unknown',
    icon: <HelpOutlineIcon />,
    color: colors.text.secondary,
  },
};

/**
 * Status display configuration
 */
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  completed: {
    label: 'Completed',
    color: colors.status.success,
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
  },
  failed: {
    label: 'Failed',
    color: colors.status.error,
    icon: <CancelIcon sx={{ fontSize: 16 }} />,
  },
  pending: {
    label: 'Pending',
    color: colors.status.warning,
    icon: <AccessTimeIcon sx={{ fontSize: 16 }} />,
  },
};

/**
 * Confirmation status display configuration
 */
const CONFIRMATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  processed: { label: 'Processed', color: colors.status.warning },
  confirmed: { label: 'Confirmed', color: colors.palette.blue },
  finalized: { label: 'Finalized', color: colors.status.success },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a raw amount with decimals
 */
function formatAmount(amount: string | number, decimals: number): string {
  const rawAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(rawAmount)) return '0';

  const formattedAmount = rawAmount / Math.pow(10, decimals);

  if (formattedAmount === 0) return '0';
  if (formattedAmount < 0.000001) return '<0.000001';
  if (formattedAmount >= 1000000) return `${(formattedAmount / 1000000).toFixed(2)}M`;
  if (formattedAmount >= 1000) return `${(formattedAmount / 1000).toFixed(2)}K`;
  if (formattedAmount >= 1) return formattedAmount.toFixed(4).replace(/\.?0+$/, '');

  return formattedAmount.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Truncate a transaction hash for display
 */
function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.dialog.border}`,
    minWidth: 380,
    maxWidth: 440,
    maxHeight: '85vh',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: 0,
  pointerEvents: 'none',
});

const HeaderContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  padding: `${spacing.md}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const HeaderRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
});

const TypeIconContainer = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.md,
  flexShrink: 0,
});

const HeaderInfoBox = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
});

const TitleText = styled(Typography)({
  fontSize: 20,
  fontWeight: 800,
  color: colors.text.primary,
  letterSpacing: -0.12,
});

const SourceBadge = styled(Box)({
  padding: '3px 8px',
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.sm,
});

const SourceText = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.text.tertiary,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
});

const StatusRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  marginLeft: 'auto',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.md}px`,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

const Section = styled(Box)({
  padding: `0 ${spacing.xs}px`,
});

const SectionRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const SectionTitle = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  color: colors.text.secondary,
  marginBottom: spacing.md,
});

const SectionLabel = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  color: colors.text.secondary,
});

const SectionValue = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

const HashValue = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
  fontFamily: fontFamily.mono,
});

const CopyIconButton = styled(IconButton)({
  width: 28,
  height: 28,
  padding: 4,
  backgroundColor: `${colors.background.card}80`,
  '&:hover': {
    backgroundColor: colors.background.card,
  },
});

const CardContainer = styled(Box)({
  padding: `${spacing.md}px`,
  backgroundColor: `${colors.background.card}60`,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
});

const InternalDivider = styled(Box)({
  height: 1,
  backgroundColor: colors.border.subtle,
  marginTop: spacing.sm,
  marginBottom: spacing.sm,
});

// Token row styles
const TokenRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px`,
  backgroundColor: `${colors.background.card}60`,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
});

const TokenLogoImg = styled('img')({
  width: 32,
  height: 32,
  borderRadius: 16,
  objectFit: 'cover',
  backgroundColor: colors.background.card,
});

const TokenLogoPlaceholder = styled(Box)({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.background.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const TokenInfoBox = styled(Box)({
  flex: 1,
  marginLeft: 12,
  minWidth: 0,
});

const TokenSymbol = styled(Typography)({
  fontSize: 15,
  fontWeight: 600,
  color: colors.text.primary,
});

const TokenName = styled(Typography)({
  fontSize: 13,
  fontWeight: 400,
  color: colors.text.secondary,
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const TokenAmount = styled(Typography)({
  fontSize: 15,
  fontWeight: 700,
  flexShrink: 0,
});

// Swap visualization styles
const SwapContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '8px 0',
});

const SwapTokenSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
});

const SwapLogoImg = styled('img')({
  width: 40,
  height: 40,
  borderRadius: 20,
  objectFit: 'cover',
  backgroundColor: colors.background.card,
});

const SwapLogoPlaceholder = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.background.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const SwapAmount = styled(Typography)({
  fontSize: 15,
  fontWeight: 700,
  color: colors.text.primary,
  marginTop: 8,
});

const SwapSymbol = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.secondary,
  marginTop: 2,
});

const SwapHeaderRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
});

const ConversionRateContainer = styled(Box)({
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${colors.border.default}`,
  display: 'flex',
  justifyContent: 'center',
});

// Address section styles
const AddressesContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

// NFT styles
const NftMediaContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 16,
});

const NftMediaPreview = styled('img')({
  width: 120,
  height: 120,
  borderRadius: borderRadius.md,
  objectFit: 'cover',
  backgroundColor: colors.background.card,
});

const NftCollectionRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
});

const NftCollectionInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const NftAttributesGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

const NftAttributeChip = styled(Box)({
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.sm,
  padding: '6px 10px',
  border: `1px solid ${colors.border.default}`,
  minWidth: '45%',
  flex: '0 0 auto',
  boxSizing: 'border-box',
});

const NftAttributeType = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.text.tertiary,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  marginBottom: 2,
});

const NftAttributeValue = styled(Typography)({
  fontSize: 13,
  fontWeight: 600,
  color: colors.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

// Fixed bottom bar
const FixedBottomBar = styled(Box)({
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.lg}px`,
  borderTop: `1px solid ${colors.border.subtle}`,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  position: 'relative',
  zIndex: 1,
});

// Action buttons
const ActionsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'space-around',
  gap: spacing.sm,
});

const ActionButton = styled(ButtonBase)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.md,
  padding: `${spacing.md}px`,
  gap: spacing.xs,
  border: `1px solid ${colors.border.default}`,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: `${colors.background.card}cc`,
  },
});

const ActionButtonText = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

// Confirmation badge
const ConfirmationBadge = styled(Box)({
  padding: `${spacing['2xs']}px ${spacing.sm}px`,
  borderRadius: borderRadius.sm,
  display: 'inline-flex',
});

const ConfirmationText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
});

// Swap route hop styles
const HopRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.xs}px 0`,
  gap: spacing.sm,
});

const HopBadge = styled(Box)({
  padding: `${spacing['2xs']}px ${spacing.sm}px`,
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.sm,
  border: `1px solid ${colors.border.default}`,
});

const HopBadgeText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

const HopTokens = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

const HopTokenText = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.text.secondary,
});

const HopPercent = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
  color: colors.text.tertiary,
  flexShrink: 0,
});

// Developer info section styles
const DevSectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: spacing.md,
});

const DevBadge = styled(Box)({
  padding: `${spacing['2xs']}px ${spacing.sm}px`,
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.sm,
  border: `1px solid ${colors.border.default}`,
  display: 'inline-flex',
});

const DevBadgeText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
});

const DevSubSection = styled(Box)({
  marginTop: spacing.md,
  paddingTop: spacing.sm,
  borderTop: `1px solid ${colors.border.default}`,
});

const DevSubTitle = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.text.tertiary,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
  marginBottom: spacing.xs,
});

const DevRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing.xs}px 0`,
});

const DevMonoText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
  fontFamily: fontFamily.mono,
});

const DevSecondaryText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: fontWeight.regular,
  color: colors.text.tertiary,
});

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Token logo component with fallback
 */
const TokenLogo: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 32,
}) => {
  if (uri) {
    return (
      <TokenLogoImg
        src={uri}
        alt=""
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <TokenLogoPlaceholder
      sx={{ width: size, height: size, borderRadius: `${size / 2}px` }}
    >
      <HelpOutlineIcon sx={{ fontSize: size * 0.6, color: colors.text.secondary }} />
    </TokenLogoPlaceholder>
  );
};

/**
 * Token amount row component
 */
const TokenAmountRow: React.FC<{
  token: TransactionTokenAmount;
  sign: '+' | '-';
}> = ({ token, sign }) => {
  const color = sign === '+' ? colors.change.positive : colors.change.negative;
  const formattedAmount = formatAmount(token.amount, token.decimals);

  return (
    <TokenRow>
      <TokenLogo uri={token.logo} size={32} />
      <TokenInfoBox>
        <TokenSymbol>{token.symbol}</TokenSymbol>
        {token.name && <TokenName>{token.name}</TokenName>}
      </TokenInfoBox>
      <TokenAmount sx={{ color }}>
        {sign} {formattedAmount}
      </TokenAmount>
    </TokenRow>
  );
};

/**
 * Swap visualization component
 */
const SwapVisualization: React.FC<{
  outputs: TransactionTokenAmount[];
  inputs: TransactionTokenAmount[];
}> = ({ outputs, inputs }) => {
  const fromToken = outputs[0];
  const toToken = inputs[0];

  if (!fromToken || !toToken) return null;

  return (
    <SwapContainer>
      <SwapTokenSection>
        {fromToken.logo ? (
          <SwapLogoImg src={fromToken.logo} alt={fromToken.symbol} />
        ) : (
          <SwapLogoPlaceholder>
            <HelpOutlineIcon sx={{ fontSize: 24, color: colors.text.secondary }} />
          </SwapLogoPlaceholder>
        )}
        <SwapAmount>
          {formatAmount(fromToken.amount, fromToken.decimals)}
        </SwapAmount>
        <SwapSymbol>{fromToken.symbol}</SwapSymbol>
      </SwapTokenSection>
      <Box sx={{ px: '12px' }}>
        <ArrowForwardIcon sx={{ fontSize: 24, color: colors.text.secondary }} />
      </Box>
      <SwapTokenSection>
        {toToken.logo ? (
          <SwapLogoImg src={toToken.logo} alt={toToken.symbol} />
        ) : (
          <SwapLogoPlaceholder>
            <HelpOutlineIcon sx={{ fontSize: 24, color: colors.text.secondary }} />
          </SwapLogoPlaceholder>
        )}
        <SwapAmount>
          {formatAmount(toToken.amount, toToken.decimals)}
        </SwapAmount>
        <SwapSymbol>{toToken.symbol}</SwapSymbol>
      </SwapTokenSection>
    </SwapContainer>
  );
};

/**
 * NFT Attribute chip component
 */
const NftAttributeChipComponent: React.FC<{ attribute: NftAttribute }> = ({
  attribute,
}) => {
  return (
    <NftAttributeChip>
      <NftAttributeType>{attribute.trait_type}</NftAttributeType>
      <NftAttributeValue>{String(attribute.value)}</NftAttributeValue>
    </NftAttributeChip>
  );
};

/**
 * NFT Metadata section component
 */
const NftMetadataSection: React.FC<{
  token: TransactionTokenAmount;
}> = ({ token }) => {
  if (!token.isNft) return null;

  return (
    <Section>
      <SectionTitle>NFT Details</SectionTitle>

      {/* NFT Media Preview */}
      {token.nftMedia && (
        <NftMediaContainer>
          <NftMediaPreview src={token.nftMedia} alt="NFT media" />
        </NftMediaContainer>
      )}

      {/* Collection Info */}
      {token.nftCollection && (
        <NftCollectionRow>
          <SectionLabel>Collection</SectionLabel>
          <NftCollectionInfo>
            <SectionValue>{token.nftCollection}</SectionValue>
            {token.nftCollectionVerified && (
              <VerifiedIcon
                sx={{ fontSize: 16, color: colors.status.success, ml: '4px' }}
              />
            )}
          </NftCollectionInfo>
        </NftCollectionRow>
      )}

      {/* NFT Attributes Grid */}
      {token.nftAttributes && token.nftAttributes.length > 0 && (
        <Box sx={{ mt: `${spacing.sm}px` }}>
          <Typography
            sx={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.text.secondary,
              mb: `${spacing.sm}px`,
            }}
          >
            Attributes
          </Typography>
          <NftAttributesGrid>
            {token.nftAttributes.map((attr, index) => (
              <NftAttributeChipComponent
                key={`${attr.trait_type}-${index}`}
                attribute={attr}
              />
            ))}
          </NftAttributesGrid>
        </Box>
      )}
    </Section>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onViewExplorer,
  onCopyHash,
  onShare,
  developerMode,
  className,
  style,
}) => {
  // Inline hash copy state
  const [hashCopied, setHashCopied] = useState(false);

  const handleCopyInlineHash = useCallback(async () => {
    if (!transaction) return;
    try {
      await copyToClipboard(transaction.id);
      if (onCopyHash) onCopyHash(transaction.id);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 1500);
    } catch (error) {
      console.warn('Failed to copy hash:', error);
    }
  }, [transaction, onCopyHash]);

  const handleShare = useCallback(() => {
    if (transaction && onShare) {
      onShare(transaction);
    }
  }, [transaction, onShare]);

  // Get transaction config
  const typeConfig = useMemo(() => {
    if (!transaction) return TRANSACTION_TYPE_CONFIG.unknown;
    return TRANSACTION_TYPE_CONFIG[transaction.type] || TRANSACTION_TYPE_CONFIG.unknown;
  }, [transaction]);

  const statusConfig = useMemo(() => {
    if (!transaction) return STATUS_CONFIG.completed;
    return STATUS_CONFIG[transaction.status] || STATUS_CONFIG.completed;
  }, [transaction]);

  if (!transaction) {
    return null;
  }

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="transaction-detail-title"
      className={className}
      PaperProps={{ style }}
    >
      {/* Decorative background */}
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

      {/* Header */}
      <HeaderContainer>
        <HeaderRow>
          {/* Type icon */}
          <TypeIconContainer
            sx={{ backgroundColor: `${typeConfig.color}20` }}
          >
            <Box sx={{ display: 'flex', color: typeConfig.color, '& > svg': { fontSize: 20 } }}>
              {typeConfig.icon}
            </Box>
          </TypeIconContainer>

          {/* Title and source */}
          <HeaderInfoBox>
            <TitleRow>
              <TitleText id="transaction-detail-title">
                {typeConfig.label}
              </TitleText>
              {transaction.source && (
                <SourceBadge>
                  <SourceText>{transaction.source}</SourceText>
                </SourceBadge>
              )}
            </TitleRow>

            {/* Status */}
            <StatusRow sx={{ color: statusConfig.color }}>
              {statusConfig.icon}
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </Typography>
            </StatusRow>
          </HeaderInfoBox>

          {/* Close button */}
          <CloseButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </CloseButton>
        </HeaderRow>
      </HeaderContainer>

      {/* Content */}
      <StyledDialogContent>
        {/* Card 1 — Details: Date/Time + Confirmation + Block */}
        <Section>
          <CardContainer>
            <SectionRow>
              <SectionLabel>Date & Time</SectionLabel>
              <SectionValue>{formatDateTime(transaction.timestamp)}</SectionValue>
            </SectionRow>

            {transaction.confirmationStatus && (
              <>
                <InternalDivider />
                <SectionRow>
                  <SectionLabel>Confirmation</SectionLabel>
                  <ConfirmationBadge
                    sx={{
                      backgroundColor: `${CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.color ?? colors.text.secondary}20`,
                    }}
                  >
                    <ConfirmationText
                      sx={{
                        color: CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.color ?? colors.text.secondary,
                      }}
                    >
                      {CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.label ?? transaction.confirmationStatus}
                    </ConfirmationText>
                  </ConfirmationBadge>
                </SectionRow>
              </>
            )}

            {transaction.slot && (
              <>
                <InternalDivider />
                <SectionRow>
                  <SectionLabel>Block</SectionLabel>
                  <SectionValue>#{formatBlockNumber(transaction.slot)}</SectionValue>
                </SectionRow>
              </>
            )}
          </CardContainer>
        </Section>

        {/* Swap Visualization (for swaps) */}
        {transaction.type === 'swap' && (
          <Section>
            <SwapHeaderRow>
              <SectionTitle sx={{ mb: 0 }}>Conversion</SectionTitle>
              {transaction.swapRoute?.priceImpact && (
                <PriceImpactBadge
                  value={transaction.swapRoute.priceImpact}
                  size="medium"
                  showIcon
                />
              )}
            </SwapHeaderRow>
            <SwapVisualization
              outputs={transaction.outputs}
              inputs={transaction.inputs}
            />
            {transaction.swapRoute?.conversionRate && (
              <ConversionRateContainer>
                <ConversionRateDisplay
                  fromSymbol={transaction.swapRoute.conversionRate.fromSymbol}
                  toSymbol={transaction.swapRoute.conversionRate.toSymbol}
                  rate={transaction.swapRoute.conversionRate.rate}
                  size="medium"
                />
              </ConversionRateContainer>
            )}
          </Section>
        )}

        {/* Swap Route Hops (for multi-hop swaps) */}
        {transaction.type === 'swap' && transaction.swapRoute?.hops && transaction.swapRoute.hops.length > 0 && (
          <Section>
            <SectionTitle>Swap Route</SectionTitle>
            {transaction.swapRoute.hops.map((hop, index) => (
              <HopRow key={`hop-${index}`}>
                <HopBadge>
                  <HopBadgeText>{hop.dex}</HopBadgeText>
                </HopBadge>
                <HopTokens>
                  <HopTokenText>{hop.inputToken.symbol}</HopTokenText>
                  <ArrowForwardIcon sx={{ fontSize: 12, color: colors.text.tertiary }} />
                  <HopTokenText>{hop.outputToken.symbol}</HopTokenText>
                </HopTokens>
                {hop.percent < 100 && (
                  <HopPercent>{hop.percent}%</HopPercent>
                )}
              </HopRow>
            ))}
          </Section>
        )}

        {/* Card 2 — Tokens (non-swap): Sent + Received merged */}
        {transaction.type !== 'swap' && (transaction.outputs.length > 0 || transaction.inputs.length > 0) && (
          <Section>
            {transaction.outputs.length > 0 && (
              <>
                <SectionTitle>Sent</SectionTitle>
                {transaction.outputs.map((token, index) => (
                  <TokenAmountRow key={`out-${index}`} token={token} sign="-" />
                ))}
              </>
            )}
            {transaction.outputs.length > 0 && transaction.inputs.length > 0 && (
              <InternalDivider />
            )}
            {transaction.inputs.length > 0 && (
              <>
                <SectionTitle>Received</SectionTitle>
                {transaction.inputs.map((token, index) => (
                  <TokenAmountRow key={`in-${index}`} token={token} sign="+" />
                ))}
              </>
            )}
          </Section>
        )}

        {/* Address Section */}
        {(transaction.outputs.some((t) => t.destination) ||
          transaction.inputs.some((t) => t.source) ||
          transaction.feePayer) && (
          <Section>
            <SectionTitle>Addresses</SectionTitle>
            <AddressesContainer>
              {transaction.outputs.map((token, index) =>
                token.destination ? (
                  <AddressCopyRow
                    key={`to-${index}`}
                    label="To"
                    address={token.destination}
                    truncate="medium"
                  />
                ) : null
              )}
              {transaction.inputs.map((token, index) =>
                token.source ? (
                  <AddressCopyRow
                    key={`from-${index}`}
                    label="From"
                    address={token.source}
                    truncate="medium"
                  />
                ) : null
              )}
              {transaction.feePayer && (
                <AddressCopyRow
                  label="Fee Payer"
                  address={transaction.feePayer}
                  truncate="medium"
                />
              )}
            </AddressesContainer>
          </Section>
        )}

        {/* NFT Metadata Sections */}
        {transaction.inputs
          .filter((token) => token.isNft)
          .map((token, index) => (
            <NftMetadataSection key={`nft-in-${index}`} token={token} />
          ))}
        {transaction.outputs
          .filter((token) => token.isNft)
          .map((token, index) => (
            <NftMetadataSection key={`nft-out-${index}`} token={token} />
          ))}

        {/* Card 3 — Transaction Info: Fee + Swap Fee + Hash merged */}
        <Section>
          <CardContainer>
            {transaction.fee && (
              <SectionRow>
                <SectionLabel>Network Fee</SectionLabel>
                <SectionValue>
                  {formatAmount(transaction.fee.amount, transaction.fee.decimals)}{' '}
                  {transaction.fee.symbol}
                </SectionValue>
              </SectionRow>
            )}

            {transaction.swapRoute?.totalFee && (
              <>
                {transaction.fee && <InternalDivider />}
                <SectionRow>
                  <SectionLabel>Swap Fee</SectionLabel>
                  <SectionValue>
                    {transaction.swapRoute.totalFee.amount} {transaction.swapRoute.totalFee.symbol}
                  </SectionValue>
                </SectionRow>
              </>
            )}

            {(transaction.fee || transaction.swapRoute?.totalFee) && <InternalDivider />}

            <SectionRow>
              <SectionLabel>Transaction Hash</SectionLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px` }}>
                <HashValue>{truncateHash(transaction.id)}</HashValue>
                <CopyIconButton
                  onClick={handleCopyInlineHash}
                  size="small"
                  aria-label="Copy transaction hash"
                  sx={hashCopied ? { backgroundColor: `${colors.status.success}20` } : undefined}
                >
                  {hashCopied ? (
                    <CheckIcon sx={{ fontSize: 14, color: colors.status.success }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 14, color: colors.text.secondary }} />
                  )}
                </CopyIconButton>
              </Box>
            </SectionRow>
          </CardContainer>
        </Section>

        {/* Developer Info (dev mode only) */}
        {developerMode && (
          <Section>
            <DevSectionHeader>
              <CodeIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
              <SectionTitle sx={{ mb: 0 }}>Developer Info</SectionTitle>
            </DevSectionHeader>

            {transaction.heliusType && (
              <SectionRow>
                <SectionLabel>Helius Type</SectionLabel>
                <DevBadge>
                  <DevBadgeText>{transaction.heliusType}</DevBadgeText>
                </DevBadge>
              </SectionRow>
            )}

            {transaction.accountsInvolved != null && (
              <SectionRow sx={{ mt: `${spacing.sm}px` }}>
                <SectionLabel>Accounts Involved</SectionLabel>
                <SectionValue>{transaction.accountsInvolved}</SectionValue>
              </SectionRow>
            )}

            {transaction.instructions && transaction.instructions.length > 0 && (
              <DevSubSection>
                <DevSubTitle>Programs</DevSubTitle>
                {transaction.instructions.map((ix, index) => (
                  <DevRow key={`ix-${index}`}>
                    <DevMonoText>
                      {getShortAddress(ix.programId, 6)}
                    </DevMonoText>
                    {ix.innerInstructionsCount > 0 && (
                      <DevSecondaryText>
                        {ix.innerInstructionsCount} inner
                      </DevSecondaryText>
                    )}
                  </DevRow>
                ))}
              </DevSubSection>
            )}

            {transaction.innerSwaps && transaction.innerSwaps.length > 0 && (
              <DevSubSection>
                <DevSubTitle>Inner Swaps</DevSubTitle>
                {transaction.innerSwaps.map((swap, index) => (
                  <DevRow key={`inner-${index}`}>
                    <DevMonoText>
                      {swap.programInfo.source}
                    </DevMonoText>
                    <DevSecondaryText>
                      {swap.programInfo.programName} / {swap.programInfo.instructionName}
                    </DevSecondaryText>
                  </DevRow>
                ))}
              </DevSubSection>
            )}

            {transaction.swapFees && (
              <DevSubSection>
                <DevSubTitle>Swap Fees</DevSubTitle>
                {transaction.swapFees.nativeFees.map((fee, index) => (
                  <DevRow key={`nfee-${index}`}>
                    <DevMonoText>
                      {getShortAddress(fee.account, 6)}
                    </DevMonoText>
                    <DevSecondaryText>
                      {fee.amount} SOL
                    </DevSecondaryText>
                  </DevRow>
                ))}
                {transaction.swapFees.tokenFees.map((fee, index) => (
                  <DevRow key={`tfee-${index}`}>
                    <DevMonoText>
                      {getShortAddress(fee.account, 6)}
                    </DevMonoText>
                    <DevSecondaryText>
                      {fee.amount} ({getShortAddress(fee.mint, 4)})
                    </DevSecondaryText>
                  </DevRow>
                ))}
              </DevSubSection>
            )}
          </Section>
        )}
      </StyledDialogContent>

      {/* Fixed Bottom Action Bar */}
      <FixedBottomBar>
        <ExplorerLinkButton
          txHash={transaction.id}
          blockchain="SOLANA"
          environment="solana-mainnet"
          showMenu
          onPress={(url, explorerName) => {
            if (onViewExplorer) {
              onViewExplorer(transaction);
            }
          }}
        />
        {onShare && (
          <ActionsContainer>
            <ActionButton onClick={handleShare}>
              <ShareIcon sx={{ fontSize: 18, color: colors.text.primary }} />
              <ActionButtonText>Share</ActionButtonText>
            </ActionButton>
          </ActionsContainer>
        )}
      </FixedBottomBar>
    </StyledDialog>
  );
};

export default TransactionDetailModal;
