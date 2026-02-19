import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { keyframes } from '@mui/material/styles';
import { styled } from '../../utils/styled';
import { colors, spacing, borderRadius, fontFamily } from '@salmon/shared';

const scaleIn = keyframes`
  0% { transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled(Box)({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
});

const Circle = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#10B981',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing['3xl'],
  animation: `${scaleIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
});

const Checkmark = styled(Typography)({
  fontSize: 36,
  color: '#FFFFFF',
  fontWeight: 700,
  lineHeight: 1,
});

const Title = styled(Typography)({
  fontSize: 22,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 600,
  color: colors.text.primary,
  textAlign: 'center',
  marginBottom: spacing.sm,
  opacity: 0,
  animation: `${fadeIn} 0.3s ease-out 0.3s forwards`,
});

const Summary = styled(Typography)({
  fontSize: 15,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  textAlign: 'center',
  marginBottom: spacing['4xl'],
  opacity: 0,
  animation: `${fadeIn} 0.3s ease-out 0.5s forwards`,
});

const ContinueButton = styled(Button)({
  minWidth: 160,
  height: 42,
  borderRadius: borderRadius.lg,
  background: `linear-gradient(135deg, #FF5C45, rgba(161, 42, 42, 0.9))`,
  border: '0.8px solid rgba(255, 92, 69, 0.8)',
  color: '#FFFFFF',
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 600,
  fontSize: 15,
  textTransform: 'none',
  opacity: 0,
  animation: `${fadeIn} 0.3s ease-out 0.6s forwards`,
  '&:hover': {
    background: `linear-gradient(135deg, #FF5C45, rgba(161, 42, 42, 1))`,
  },
});

interface SwapSuccessScreenProps {
  inAmount: string;
  outAmount: string;
  inSymbol: string;
  outSymbol: string;
  onContinue: () => void;
}

export function SwapSuccessScreen({
  inAmount,
  outAmount,
  inSymbol,
  outSymbol,
  onContinue,
}: SwapSuccessScreenProps): React.ReactElement {
  return (
    <Container>
      <Circle>
        <Checkmark>✓</Checkmark>
      </Circle>
      <Title>Swap Complete</Title>
      <Summary>
        {inAmount} {inSymbol} → {outAmount} {outSymbol}
      </Summary>
      <ContinueButton onClick={onContinue}>Continue</ContinueButton>
    </Container>
  );
}
