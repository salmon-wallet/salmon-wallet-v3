/**
 * SwapRouteVisualization - Expandable visualization of swap routes
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 * Uses CSS transitions instead of react-native-reanimated for expand/collapse.
 *
 * Shows the path a swap took through different DEXes and tokens.
 */

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  borderRadius,
  colors,
  copyToClipboard,
  formatBlockNumber,
  formatDateTime,
  formatRawAmount,
  getShortAddress,
  spacing,
  truncateHash,
} from '@salmon/shared';
import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '../../utils/styled';
import { ConversionRateDisplay } from './ConversionRateDisplay';
import { PriceImpactBadge } from './PriceImpactBadge';
import type { SwapRouteHop, SwapRouteVisualizationProps, Transaction } from './types';

// ============================================================================
// Constants
// ============================================================================

const COPIED_FEEDBACK_DURATION = 1500;

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  overflow: 'hidden',
  transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease',
});

const Content = styled(Box)({
  paddingTop: spacing.sm,
  paddingBottom: spacing.xs,
  paddingLeft: spacing.xs,
  paddingRight: spacing.xs,
});

const RouteContainer = styled(Box)({
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.md,
  padding: spacing.sm,
});

const RouteHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: spacing.sm,
});

const RouteHeaderText = styled(Typography)({
  fontSize: 12,
  fontWeight: 500,
  color: colors.text.secondary,
});

const SimpleRoute = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
});

const RouteColumn = styled(Box)({
  flex: 1,
});

const RouteLabel = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.text.tertiary,
  marginBottom: spacing.xs,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const RouteTokenRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: 2,
});

const RouteTokenText = styled(Typography)({
  fontSize: 13,
  color: colors.text.primary,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const RouteArrowColumn = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.lg}px ${spacing.sm}px 0`,
});

const MoreText = styled(Typography)({
  fontSize: 11,
  color: colors.text.tertiary,
  marginTop: 2,
});

const RouteSummary = styled(Box)({
  borderTop: `1px solid ${colors.border.subtle}`,
  paddingTop: spacing.xs,
  marginTop: 2,
});

const SummaryRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
});

const SummaryLabel = styled(Typography)({
  fontSize: 12,
  color: colors.text.tertiary,
});

const SummaryValue = styled(Typography)({
  fontSize: 12,
  fontWeight: 500,
  color: colors.text.secondary,
});

const TokenIconImg = styled('img')({
  borderRadius: '50%',
  backgroundColor: colors.background.card,
  objectFit: 'cover',
});

const TokenIconPlaceholder = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: colors.background.card,
});

const HopContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.xs,
});

const HopToken = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  flex: 1,
  minWidth: 0,
});

const HopAmount = styled(Typography)({
  fontSize: 12,
  color: colors.text.primary,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const HopArrow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `0 ${spacing.sm}px`,
});

const DexBadge = styled(Box)({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.background.tokenItem,
  padding: `2px ${spacing.xs}px`,
  borderRadius: borderRadius.sm,
});

const DexText = styled(Typography)({
  fontSize: 10,
  fontWeight: 500,
  color: colors.text.secondary,
});

const PercentText = styled(Typography)({
  fontSize: 10,
  color: colors.text.tertiary,
});

const HashCopyContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
});

// ============================================================================
// Sub-components
// ============================================================================

const TokenIcon: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 24,
}) => {
  if (uri) {
    return (
      <TokenIconImg
        src={uri}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <TokenIconPlaceholder style={{ width: size, height: size }}>
      <HelpOutlineIcon sx={{ fontSize: size * 0.6, color: colors.text.tertiary }} />
    </TokenIconPlaceholder>
  );
};

const HashCopyRow: React.FC<{
  label: string;
  value: string;
  displayValue?: string;
}> = ({ label, value, displayValue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION);
    } catch (error) {
      console.warn('Failed to copy:', error);
    }
  }, [value]);

  return (
    <SummaryRow>
      <SummaryLabel>{label}</SummaryLabel>
      <HashCopyContainer onClick={handleCopy}>
        <SummaryValue>{displayValue ?? value}</SummaryValue>
        {copied ? (
          <CheckIcon sx={{ fontSize: 12, color: colors.status.success }} />
        ) : (
          <ContentCopyIcon sx={{ fontSize: 12, color: colors.text.tertiary }} />
        )}
      </HashCopyContainer>
    </SummaryRow>
  );
};

const RouteHop: React.FC<{ hop: SwapRouteHop; isLast: boolean }> = ({ hop, isLast }) => {
  return (
    <HopContainer>
      <HopToken>
        <TokenIcon uri={hop.inputToken.logo} size={20} />
        <HopAmount>
          {formatRawAmount(hop.inputToken.amount, hop.inputToken.decimals)} {hop.inputToken.symbol}
        </HopAmount>
      </HopToken>

      <HopArrow>
        <DexBadge>
          <DexText>{hop.dex}</DexText>
          {hop.percent < 100 && <PercentText>{hop.percent}%</PercentText>}
        </DexBadge>
        <ArrowForwardIcon sx={{ fontSize: 14, color: colors.text.secondary }} />
      </HopArrow>

      {isLast && (
        <HopToken>
          <TokenIcon uri={hop.outputToken.logo} size={20} />
          <HopAmount>
            {formatRawAmount(hop.outputToken.amount, hop.outputToken.decimals)} {hop.outputToken.symbol}
          </HopAmount>
        </HopToken>
      )}
    </HopContainer>
  );
};

// ============================================================================
// Route Views
// ============================================================================

const TransactionSummaryRows: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { fee, slot, id, timestamp, swapRoute } = transaction;

  const conversionRate = useMemo(() => {
    if (swapRoute?.conversionRate) return swapRoute.conversionRate;
    if (transaction.outputs.length === 1 && transaction.inputs.length === 1) {
      const fromToken = transaction.outputs[0];
      const toToken = transaction.inputs[0];
      const fromAmount = parseFloat(fromToken.amount) / Math.pow(10, fromToken.decimals);
      const toAmount = parseFloat(toToken.amount) / Math.pow(10, toToken.decimals);
      if (fromAmount > 0) {
        return {
          fromSymbol: fromToken.symbol,
          toSymbol: toToken.symbol,
          rate: (toAmount / fromAmount).toFixed(6),
        };
      }
    }
    return null;
  }, [swapRoute, transaction.outputs, transaction.inputs]);

  return (
    <RouteSummary>
      {swapRoute?.priceImpact && (
        <SummaryRow>
          <SummaryLabel>Price Impact</SummaryLabel>
          <PriceImpactBadge value={swapRoute.priceImpact} size="small" showIcon />
        </SummaryRow>
      )}

      {conversionRate && (
        <SummaryRow>
          <SummaryLabel>Rate</SummaryLabel>
          <ConversionRateDisplay
            fromSymbol={conversionRate.fromSymbol}
            toSymbol={conversionRate.toSymbol}
            rate={conversionRate.rate}
            size="small"
          />
        </SummaryRow>
      )}

      {swapRoute?.totalFee && (
        <SummaryRow>
          <SummaryLabel>Total Fees</SummaryLabel>
          <SummaryValue>{swapRoute.totalFee.amount} {swapRoute.totalFee.symbol}</SummaryValue>
        </SummaryRow>
      )}

      {!swapRoute?.totalFee && fee && (
        <SummaryRow>
          <SummaryLabel>Network Fee</SummaryLabel>
          <SummaryValue>
            {(fee.amount / Math.pow(10, fee.decimals)).toFixed(6)} {fee.symbol}
          </SummaryValue>
        </SummaryRow>
      )}

      {slot != null && (
        <SummaryRow>
          <SummaryLabel>Block</SummaryLabel>
          <SummaryValue>#{formatBlockNumber(slot)}</SummaryValue>
        </SummaryRow>
      )}

      {timestamp != null && (
        <SummaryRow>
          <SummaryLabel>Time</SummaryLabel>
          <SummaryValue>{formatDateTime(timestamp)}</SummaryValue>
        </SummaryRow>
      )}

      {id && (
        <HashCopyRow
          label="Tx Hash"
          value={id}
          displayValue={truncateHash(id)}
        />
      )}

      {transaction.feePayer && (
        <SummaryRow>
          <SummaryLabel>Fee Payer</SummaryLabel>
          <SummaryValue>{getShortAddress(transaction.feePayer, 4)}</SummaryValue>
        </SummaryRow>
      )}

      {transaction.accountsInvolved != null && transaction.accountsInvolved > 0 && (
        <SummaryRow>
          <SummaryLabel>Accounts</SummaryLabel>
          <SummaryValue>{transaction.accountsInvolved}</SummaryValue>
        </SummaryRow>
      )}

      {transaction.instructions && transaction.instructions.length > 0 && (
        <SummaryRow>
          <SummaryLabel>Programs</SummaryLabel>
          <SummaryValue>{transaction.instructions.length}</SummaryValue>
        </SummaryRow>
      )}

      {transaction.swapFees?.nativeFees && transaction.swapFees.nativeFees.length > 0 && (
        <SummaryRow>
          <SummaryLabel>Swap Fees (Native)</SummaryLabel>
          <SummaryValue>{transaction.swapFees.nativeFees.length} fee(s)</SummaryValue>
        </SummaryRow>
      )}

      {transaction.innerSwaps && transaction.innerSwaps.length > 0 && (
        <SummaryRow>
          <SummaryLabel>Route Hops</SummaryLabel>
          <SummaryValue>{transaction.innerSwaps.length} hop(s)</SummaryValue>
        </SummaryRow>
      )}
    </RouteSummary>
  );
};

const SimpleRouteView: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { inputs, outputs, source } = transaction;

  return (
    <RouteContainer>
      <RouteHeader>
        <AccountTreeIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
        <RouteHeaderText>
          Route {source ? `via ${source}` : ''}
        </RouteHeaderText>
      </RouteHeader>

      <SimpleRoute>
        <RouteColumn>
          <RouteLabel>Sent</RouteLabel>
          {outputs.slice(0, 3).map((output, i) => (
            <RouteTokenRow key={`out-${i}`}>
              <TokenIcon uri={output.logo} size={18} />
              <RouteTokenText>
                {formatRawAmount(output.amount, output.decimals)} {output.symbol}
              </RouteTokenText>
            </RouteTokenRow>
          ))}
          {outputs.length > 3 && (
            <MoreText>+{outputs.length - 3} more</MoreText>
          )}
        </RouteColumn>

        <RouteArrowColumn>
          <ArrowForwardIcon sx={{ fontSize: 20, color: colors.accent.primary }} />
        </RouteArrowColumn>

        <RouteColumn>
          <RouteLabel>Received</RouteLabel>
          {inputs.slice(0, 3).map((input, i) => (
            <RouteTokenRow key={`in-${i}`}>
              <TokenIcon uri={input.logo} size={18} />
              <RouteTokenText>
                {formatRawAmount(input.amount, input.decimals)} {input.symbol}
              </RouteTokenText>
            </RouteTokenRow>
          ))}
          {inputs.length > 3 && (
            <MoreText>+{inputs.length - 3} more</MoreText>
          )}
        </RouteColumn>
      </SimpleRoute>

      <TransactionSummaryRows transaction={transaction} />
    </RouteContainer>
  );
};

const DetailedRouteView: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { swapRoute, source } = transaction;

  if (!swapRoute || swapRoute.hops.length === 0) {
    return <SimpleRouteView transaction={transaction} />;
  }

  return (
    <RouteContainer>
      <RouteHeader>
        <AccountTreeIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
        <RouteHeaderText>
          Route {source ? `via ${source}` : ''} ({swapRoute.hops.length}{' '}
          {swapRoute.hops.length === 1 ? 'hop' : 'hops'})
        </RouteHeaderText>
      </RouteHeader>

      <Box sx={{ mb: `${spacing.xs}px` }}>
        {swapRoute.hops.map((hop, index) => (
          <RouteHop
            key={`hop-${index}`}
            hop={hop}
            isLast={index === swapRoute.hops.length - 1}
          />
        ))}
      </Box>

      <TransactionSummaryRows transaction={transaction} />
    </RouteContainer>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SwapRouteVisualization: React.FC<SwapRouteVisualizationProps> = ({
  transaction,
  expanded,
}) => {
  if (transaction.type !== 'swap') {
    return null;
  }

  return (
    <Container
      sx={{
        maxHeight: expanded ? 800 : 0,
        opacity: expanded ? 1 : 0,
        pointerEvents: expanded ? 'auto' : 'none',
      }}
    >
      <Content>
        {transaction.swapRoute ? (
          <DetailedRouteView transaction={transaction} />
        ) : (
          <SimpleRouteView transaction={transaction} />
        )}
      </Content>
    </Container>
  );
};

export default SwapRouteVisualization;
