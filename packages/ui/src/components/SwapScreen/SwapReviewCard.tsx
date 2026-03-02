/**
 * SwapReviewCard - Card displaying token amount for review screen
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses BlurContainer instead of expo BlurView.
 */
import React from 'react';
import { styled } from '../../utils/styled';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  fontWeight,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { SwapReviewCardProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const BlurContent = styled('div')({
  padding: `${spacing.sm}px ${spacing.base}px`,
  minHeight: 75,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

const Label = styled(Typography)({
  fontSize: 15,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.075,
  lineHeight: `${15 * 1.5}px`,
});

const Amount = styled(Typography)({
  fontSize: 25,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.12,
  lineHeight: '25px',
  marginTop: 2,
});

const UsdValue = styled(Typography)({
  fontSize: 13,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  letterSpacing: -0.065,
  lineHeight: `${13 * 1.4}px`,
  marginTop: 2,
});

// ============================================================================
// SwapReviewCard Component
// ============================================================================

/**
 * SwapReviewCard - Card displaying token amount for review screen
 * Shows label (You Send/You Receive) and the amount with symbol
 */
export function SwapReviewCard({
  label,
  amount,
  usdValue,
  style,
}: SwapReviewCardProps): React.ReactElement {
  return (
    <BlurContainer
      style={{
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...style,
      }}
    >
      <BlurContent>
        <Label>{label}</Label>
        <Amount>{amount}</Amount>
        {usdValue != null && <UsdValue>{usdValue}</UsdValue>}
      </BlurContent>
    </BlurContainer>
  );
}

export default SwapReviewCard;
