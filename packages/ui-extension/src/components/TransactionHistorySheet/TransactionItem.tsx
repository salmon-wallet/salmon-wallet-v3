/**
 * TransactionItem - Individual transaction row for the transaction list
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 *
 * Features:
 * - Transaction type icon with token logos
 * - Collapses multiple amounts with expandable route visualization
 * - Badge showing source protocol (Jupiter, etc.)
 * - Click to expand swap routes, right-click or double-click for detail view
 */

import React, { useCallback, useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WidgetsIcon from '@mui/icons-material/Widgets';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { colors, spacing, borderRadius } from '@salmon/shared';
import { SwapRouteVisualization } from './SwapRouteVisualization';
import type { TransactionItemProps, TransactionType, TransactionTokenAmount } from './types';

// ============================================================================
// Constants
// ============================================================================

const HIDDEN_VALUE = '****';
const MAX_VISIBLE_AMOUNTS = 2;

// ============================================================================
// Transaction Type Config
// ============================================================================

interface TypeConfig {
  label: string;
  IconComponent: React.ComponentType<{ sx?: any }>;
  color: string;
}

const TYPE_CONFIGS: Record<TransactionType, TypeConfig> = {
  send: {
    label: 'Sent',
    IconComponent: ArrowUpwardIcon,
    color: colors.change.negative,
  },
  receive: {
    label: 'Received',
    IconComponent: ArrowDownwardIcon,
    color: colors.change.positive,
  },
  swap: {
    label: 'Swapped',
    IconComponent: SwapHorizIcon,
    color: colors.palette.purple,
  },
  mint: {
    label: 'Minted',
    IconComponent: AddCircleOutlineIcon,
    color: colors.palette.cyan,
  },
  burn: {
    label: 'Burned',
    IconComponent: LocalFireDepartmentIcon,
    color: colors.palette.orange,
  },
  stake: {
    label: 'Staked',
    IconComponent: LockIcon,
    color: colors.palette.green,
  },
  loan: {
    label: 'Loan',
    IconComponent: AccountBalanceWalletIcon,
    color: colors.palette.amber,
  },
  interaction: {
    label: 'Interaction',
    IconComponent: WidgetsIcon,
    color: colors.palette.blue,
  },
  unknown: {
    label: 'Unknown',
    IconComponent: HelpOutlineIcon,
    color: colors.text.secondary,
  },
};

function getTypeConfig(type: TransactionType): TypeConfig & { icon: React.ReactNode; badgeIcon: React.ReactNode } {
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.unknown;
  const { IconComponent } = config;

  return {
    ...config,
    icon: <IconComponent sx={{ fontSize: 22 }} />,
    badgeIcon: <IconComponent sx={{ fontSize: 10, color: '#FFFFFF' }} />,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

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

function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getDescription(
  type: TransactionType,
  inputs: TransactionTokenAmount[],
  outputs: TransactionTokenAmount[],
  source?: string,
  description?: string
): string {
  if (type === 'swap') {
    const outputSymbols = [...new Set(outputs.map((o) => o.symbol))];
    const inputSymbols = [...new Set(inputs.map((i) => i.symbol))];

    if (outputSymbols.length <= 2 && inputSymbols.length <= 2) {
      return `${outputSymbols.join(', ')} to ${inputSymbols.join(', ')}`;
    }
    return `${outputSymbols.length} tokens to ${inputSymbols.length} tokens`;
  }

  if (description && description.length > 0 && !description.includes('Unknown')) {
    return description;
  }

  switch (type) {
    case 'send':
      if (outputs[0]?.destination) return `To ${truncateAddress(outputs[0].destination)}`;
      return 'Sent tokens';
    case 'receive':
      if (inputs[0]?.source) return `From ${truncateAddress(inputs[0].source)}`;
      return 'Received tokens';
    case 'mint':
      return 'Token minted';
    case 'burn':
      return 'Token burned';
    case 'stake':
      return 'Staking operation';
    case 'loan':
      return 'Loan operation';
    case 'interaction':
      return 'Contract interaction';
    default:
      return 'Transaction';
  }
}

// ============================================================================
// Styled Components
// ============================================================================

const ItemWrapper = styled(Box)({
  borderRadius: borderRadius.lg,
  marginBottom: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${colors.border.subtle}`,
  overflow: 'hidden',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

const ItemButton = styled(ButtonBase)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  padding: '14px 16px',
  textAlign: 'left',
  justifyContent: 'flex-start',
});

const LogoSection = styled(Box)({
  marginRight: 12,
  flexShrink: 0,
});

const TokenLogoImg = styled('img')({
  borderRadius: '50%',
  backgroundColor: colors.background.card,
  objectFit: 'cover',
});

const TokenLogoPlaceholder = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: colors.background.card,
});

const SwapLogosContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  width: 54,
  position: 'relative',
});

const SwapLogoOverlap = styled(Box)({
  marginLeft: -14,
  border: `2px solid ${colors.background.secondary}`,
  borderRadius: 18,
  display: 'flex',
});

const LogoWithBadgeContainer = styled(Box)({
  position: 'relative',
  width: 40,
  height: 40,
});

const TypeBadge = styled(Box)({
  position: 'absolute',
  top: -4,
  right: -4,
  width: 18,
  height: 18,
  borderRadius: 9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${colors.background.secondary}`,
});

const TypeBadgeSingle = styled(TypeBadge)({
  top: -2,
  right: -2,
});

const IconContainer = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const InfoSection = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minWidth: 0,
});

const TypeRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
});

const TypeText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const SourceBadge = styled(Chip)({
  height: 18,
  fontSize: 10,
  fontWeight: 500,
  color: colors.text.tertiary,
  backgroundColor: colors.background.card,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  '& .MuiChip-label': {
    padding: '0 6px',
  },
});

const DescriptionText = styled(Typography)({
  fontSize: 13,
  color: colors.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const RightSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  marginLeft: 8,
  flexShrink: 0,
});

const AmountsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
});

const AmountText = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 2,
  whiteSpace: 'nowrap',
});

const TimeRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
});

const TimeText = styled(Typography)({
  fontSize: 11,
  color: colors.text.tertiary,
});

const FailedBadge = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
});

const FailedText = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.status.error,
});

const PendingBadge = styled(Box)({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  padding: `4px 8px`,
  backgroundColor: `${colors.status.warning}15`,
  borderRadius: borderRadius.sm,
});

const PendingText = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.status.warning,
});

const ExpandBadge = styled(ButtonBase)({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
  marginTop: 4,
  padding: '2px 4px',
  borderRadius: 4,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const ExpandText = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.accent.primary,
});

// ============================================================================
// Sub-components
// ============================================================================

const TokenLogo: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 40,
}) => {
  if (uri) {
    return (
      <TokenLogoImg
        src={uri}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <TokenLogoPlaceholder style={{ width: size, height: size }}>
      <HelpOutlineIcon sx={{ fontSize: size * 0.6, color: colors.text.secondary }} />
    </TokenLogoPlaceholder>
  );
};

const AmountDisplay: React.FC<{
  token: TransactionTokenAmount;
  sign: '+' | '-';
  hidden: boolean;
}> = ({ token, sign, hidden }) => {
  const displayAmount = hidden
    ? `${sign} ${HIDDEN_VALUE} ${token.symbol}`
    : `${sign} ${formatAmount(token.amount, token.decimals)} ${token.symbol}`;

  const color = sign === '+' ? colors.change.positive : colors.change.negative;

  return (
    <AmountText sx={{ color }} noWrap>
      {displayAmount}
    </AmountText>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  onDetailClick,
  hiddenBalance = false,
  className,
  style,
}) => {
  const { type, timestamp, status, inputs, outputs, description, source } = transaction;
  const config = getTypeConfig(type);

  const [expanded, setExpanded] = useState(false);

  const totalAmounts = inputs.length + outputs.length;
  const isComplex = type === 'swap' && totalAmounts > MAX_VISIBLE_AMOUNTS;
  const isSwap = type === 'swap';

  const handleClick = useCallback(() => {
    if (isSwap) {
      setExpanded((prev) => !prev);
    } else {
      onPress?.(transaction);
    }
  }, [isSwap, onPress, transaction]);

  const handleDoubleClick = useCallback(() => {
    onDetailClick?.(transaction);
  }, [onDetailClick, transaction]);

  const descriptionText = useMemo(
    () => getDescription(type, inputs, outputs, source, description),
    [type, inputs, outputs, source, description]
  );

  // Render logo
  const renderLogo = () => {
    if (type === 'swap' && inputs[0]?.logo && outputs[0]?.logo) {
      return (
        <SwapLogosContainer>
          <TokenLogo uri={outputs[0].logo} size={34} />
          <SwapLogoOverlap>
            <TokenLogo uri={inputs[0].logo} size={34} />
          </SwapLogoOverlap>
          <TypeBadge sx={{ backgroundColor: config.color }}>
            {config.badgeIcon}
          </TypeBadge>
        </SwapLogosContainer>
      );
    }

    const primaryToken = type === 'receive' ? inputs[0] : outputs[0];
    if (primaryToken?.logo) {
      return (
        <LogoWithBadgeContainer>
          <TokenLogo uri={primaryToken.logo} size={40} />
          <TypeBadgeSingle sx={{ backgroundColor: config.color }}>
            {config.badgeIcon}
          </TypeBadgeSingle>
        </LogoWithBadgeContainer>
      );
    }

    return (
      <IconContainer sx={{ backgroundColor: `${config.color}20`, color: config.color }}>
        {config.icon}
      </IconContainer>
    );
  };

  // Helper to render token amounts
  const renderTokenAmounts = (tokens: TransactionTokenAmount[], sign: '+' | '-') => {
    return tokens.map((token, i) => (
      <AmountDisplay
        key={`${sign}-${i}`}
        token={token}
        sign={sign}
        hidden={hiddenBalance}
      />
    ));
  };

  // Render amounts
  const renderAmounts = () => {
    // Status badges
    if (status === 'failed') {
      return (
        <FailedBadge>
          <CancelIcon sx={{ fontSize: 16, color: colors.status.error }} />
          <FailedText>Failed</FailedText>
        </FailedBadge>
      );
    }

    if (status === 'pending') {
      return (
        <PendingBadge>
          <AccessTimeIcon sx={{ fontSize: 14, color: colors.status.warning }} />
          <PendingText>Pending</PendingText>
        </PendingBadge>
      );
    }

    // Complex swap with expand toggle
    if (isComplex) {
      const firstOutput = outputs[0];
      const firstInput = inputs[0];
      const hiddenCount = totalAmounts - 2;

      return (
        <AmountsContainer>
          {firstOutput && (
            <AmountDisplay token={firstOutput} sign="-" hidden={hiddenBalance} />
          )}
          {firstInput && (
            <AmountDisplay token={firstInput} sign="+" hidden={hiddenBalance} />
          )}
          <ExpandBadge
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            <ExpandText>
              {expanded ? 'Show less' : `+${hiddenCount} more`}
            </ExpandText>
            {expanded ? (
              <ExpandLessIcon sx={{ fontSize: 12, color: colors.accent.primary }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 12, color: colors.accent.primary }} />
            )}
          </ExpandBadge>
        </AmountsContainer>
      );
    }

    // Type-specific amount rendering
    const showOutputs = type !== 'receive';
    const showInputs = type !== 'send';

    return (
      <AmountsContainer>
        {showOutputs && renderTokenAmounts(outputs, '-')}
        {showInputs && renderTokenAmounts(inputs, '+')}
      </AmountsContainer>
    );
  };

  return (
    <ItemWrapper className={className} style={style}>
      <ItemButton
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        aria-label={`${config.label} transaction, ${descriptionText}`}
      >
        {/* Left: Logo/Icon */}
        <LogoSection>{renderLogo()}</LogoSection>

        {/* Center: Type and description */}
        <InfoSection>
          <TypeRow>
            <TypeText>{config.label}</TypeText>
            {source && <SourceBadge label={source} size="small" />}
          </TypeRow>
          <DescriptionText>{descriptionText}</DescriptionText>
        </InfoSection>

        {/* Right: Amounts and time */}
        <RightSection>
          {renderAmounts()}
          <TimeRow>
            <TimeText>{formatTimestamp(timestamp)}</TimeText>
            {isSwap && (
              expanded ? (
                <ExpandLessIcon sx={{ fontSize: 14, color: colors.text.tertiary, ml: '4px' }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 14, color: colors.text.tertiary, ml: '4px' }} />
              )
            )}
          </TimeRow>
        </RightSection>
      </ItemButton>

      {/* Expandable route visualization for swaps */}
      {type === 'swap' && (
        <SwapRouteVisualization
          transaction={transaction}
          expanded={expanded}
        />
      )}
    </ItemWrapper>
  );
};

export default TransactionItem;
