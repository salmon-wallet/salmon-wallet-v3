/**
 * ConversionRateDisplay - Displays the conversion rate for swap transactions
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 *
 * Shows the rate in format "1 SOL = 150.25 USDC" or compact "1:150.25" for small size.
 */

import React, { useMemo } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { colors } from '@salmon/shared';
import type { ConversionRateDisplayProps } from './types';

// ============================================================================
// Helper Functions
// ============================================================================

function formatRate(rate: string): string {
  const numericRate = parseFloat(rate);

  if (isNaN(numericRate) || numericRate === 0) return '0';
  if (numericRate < 0.0001) return '<0.0001';

  if (numericRate >= 1000) {
    const kValue = numericRate / 1000;
    return `${kValue.toFixed(2).replace(/\.?0+$/, '')}K`;
  }

  return numericRate.toFixed(4).replace(/\.?0+$/, '');
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const RateText = styled(Typography)({
  fontSize: 12,
  color: colors.text.secondary,
  lineHeight: 1.3,
});

const SymbolText = styled('span')({
  fontWeight: 500,
});

const CompactText = styled(Typography)({
  fontSize: 11,
  color: colors.text.secondary,
  lineHeight: 1.3,
});

// ============================================================================
// Component
// ============================================================================

export const ConversionRateDisplay: React.FC<ConversionRateDisplayProps> = ({
  fromSymbol,
  toSymbol,
  rate,
  size = 'medium',
  className,
}) => {
  const formattedRate = useMemo(() => formatRate(rate), [rate]);
  const isSmall = size === 'small';

  if (isSmall) {
    return (
      <Container className={className}>
        <SwapHorizIcon sx={{ fontSize: 12, color: colors.text.secondary, mr: '4px' }} />
        <CompactText>1:{formattedRate}</CompactText>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <SwapHorizIcon sx={{ fontSize: 14, color: colors.text.secondary, mr: '6px' }} />
      <RateText>
        <SymbolText>1 {fromSymbol}</SymbolText>
        {' = '}
        {formattedRate}{' '}
        <SymbolText>{toSymbol}</SymbolText>
      </RateText>
    </Container>
  );
};

export default ConversionRateDisplay;
