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

import React, { useCallback, useMemo } from 'react';
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
import ShareIcon from '@mui/icons-material/Share';
import { colors, spacing, borderRadius, formatBlockNumber, formatDateTime } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { BlurContainer } from '../BlurContainer';
import { AddressCopyRow } from '../TransactionHistorySheet/AddressCopyRow';
import { ExplorerLinkButton } from '../TransactionHistorySheet/ExplorerLinkButton';
import { PriceImpactBadge } from '../TransactionHistorySheet/PriceImpactBadge';
import { ConversionRateDisplay } from '../TransactionHistorySheet/ConversionRateDisplay';
import type { TransactionDetailModalProps } from './types';
import type {
  TransactionType,
  TransactionTokenAmount,
  NftAttribute,
} from '../TransactionHistorySheet/types';

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
  alignItems: 'center',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const TypeIconContainer = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 14,
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
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.xl}px`,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
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

const Section = styled(BlurContainer)({
  borderRadius: borderRadius.lg,
  padding: 16,
});

const SectionRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const SectionTitle = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.secondary,
  marginBottom: 12,
});

const SectionLabel = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
});

const SectionValue = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
});

const HashValue = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.primary,
  fontFamily: 'monospace',
});

// Token row styles
const TokenRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 0',
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
  gap: 8,
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

// Action buttons
const ActionsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'space-around',
  marginTop: 8,
  gap: 8,
});

const ActionButton = styled(ButtonBase)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.md,
  padding: '12px',
  gap: 6,
  border: `1px solid ${colors.border.default}`,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: `${colors.background.card}cc`,
  },
});

const ActionButtonText = styled(Typography)({
  fontSize: 13,
  fontWeight: 600,
  color: colors.text.primary,
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
        <Box sx={{ mt: '8px' }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: colors.text.secondary,
              mb: '8px',
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

/**
 * TransactionDetailModal - MUI Dialog for transaction details
 *
 * Displays comprehensive information about a single transaction including
 * type, status, timestamps, token transfers, swap conversion data,
 * NFT metadata, network fee, and action buttons.
 */
export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onViewExplorer,
  onCopyHash,
  onShare,
  className,
  style,
}) => {
  // Handle action buttons
  const handleCopyHash = useCallback(() => {
    if (transaction && onCopyHash) {
      onCopyHash(transaction.id);
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
        {/* Type icon */}
        <TypeIconContainer
          sx={{ backgroundColor: `${typeConfig.color}20` }}
        >
          <Box sx={{ display: 'flex', color: typeConfig.color, '& > svg': { fontSize: 24 } }}>
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
      </HeaderContainer>

      {/* Content */}
      <StyledDialogContent>
        {/* Timestamp */}
        <Section>
          <SectionRow>
            <SectionLabel>Date & Time</SectionLabel>
            <SectionValue>{formatDateTime(transaction.timestamp)}</SectionValue>
          </SectionRow>
        </Section>

        {/* Block/Slot Number */}
        {transaction.slot && (
          <Section>
            <SectionRow>
              <SectionLabel>Block</SectionLabel>
              <SectionValue>#{formatBlockNumber(transaction.slot)}</SectionValue>
            </SectionRow>
          </Section>
        )}

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

        {/* Tokens Involved (for non-swaps) */}
        {transaction.type !== 'swap' && (
          <>
            {transaction.outputs.length > 0 && (
              <Section>
                <SectionTitle>Sent</SectionTitle>
                {transaction.outputs.map((token, index) => (
                  <TokenAmountRow key={`out-${index}`} token={token} sign="-" />
                ))}
              </Section>
            )}
            {transaction.inputs.length > 0 && (
              <Section>
                <SectionTitle>Received</SectionTitle>
                {transaction.inputs.map((token, index) => (
                  <TokenAmountRow key={`in-${index}`} token={token} sign="+" />
                ))}
              </Section>
            )}
          </>
        )}

        {/* Address Section - From/To addresses */}
        {(transaction.outputs.some((t) => t.destination) ||
          transaction.inputs.some((t) => t.source)) && (
          <Section>
            <SectionTitle>Addresses</SectionTitle>
            <AddressesContainer>
              {/* Show destination addresses from outputs (where tokens were sent) */}
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
              {/* Show source addresses from inputs (where tokens came from) */}
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

        {/* Network Fee */}
        {transaction.fee && (
          <Section>
            <SectionRow>
              <SectionLabel>Network Fee</SectionLabel>
              <SectionValue>
                {formatAmount(transaction.fee.amount, transaction.fee.decimals)}{' '}
                {transaction.fee.symbol}
              </SectionValue>
            </SectionRow>
          </Section>
        )}

        {/* Transaction Hash */}
        <Section>
          <SectionRow>
            <SectionLabel>Transaction Hash</SectionLabel>
            <HashValue>{truncateHash(transaction.id)}</HashValue>
          </SectionRow>
        </Section>

        {/* Explorer Link Button */}
        <Box sx={{ mt: '8px' }}>
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
        </Box>

        {/* Action Buttons */}
        <ActionsContainer>
          {onCopyHash && (
            <ActionButton onClick={handleCopyHash}>
              <ContentCopyIcon sx={{ fontSize: 18, color: colors.text.primary }} />
              <ActionButtonText>Copy Hash</ActionButtonText>
            </ActionButton>
          )}
          {onShare && (
            <ActionButton onClick={handleShare}>
              <ShareIcon sx={{ fontSize: 18, color: colors.text.primary }} />
              <ActionButtonText>Share</ActionButtonText>
            </ActionButton>
          )}
        </ActionsContainer>
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default TransactionDetailModal;
