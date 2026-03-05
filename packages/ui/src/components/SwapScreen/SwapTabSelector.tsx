/**
 * SwapTabSelector - Tab selector for switching between Swap and Bridge
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  fontWeight,
  fontSize,
} from '@salmon/shared';
import type { SwapTabSelectorProps, SwapTab } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.lg,
});

const Tab = styled(ButtonBase)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing.xs}px 0`,
  gap: spacing.xs,
  cursor: 'pointer',
  background: 'none',
  '&:hover': {
    opacity: 0.8,
  },
});

const TabText = styled(Typography)<{ $active: boolean }>(({ $active }) => ({
  fontSize: fontSize.lg,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  letterSpacing: 0.18,
  lineHeight: `${18 * 1.3}px`,
  color: $active ? colors.text.primary : colors.text.disabled,
  transition: 'color 0.2s ease',
}));

const TabIndicator = styled(Box)<{ $active: boolean }>(({ $active }) => ({
  width: '100%',
  height: 1,
  backgroundColor: $active ? colors.text.primary : colors.border.default,
  transition: 'background-color 0.2s ease',
}));

// ============================================================================
// SwapTabSelector Component
// ============================================================================

/**
 * Tab selector for switching between Swap and Bridge
 */
export function SwapTabSelector({
  activeTab,
  onTabChange,
  style,
}: SwapTabSelectorProps): React.ReactElement {
  const handleTabPress = (tab: SwapTab) => {
    if (tab !== activeTab) {
      onTabChange(tab);
    }
  };

  return (
    <Container style={style}>
      <Tab onClick={() => handleTabPress('swap')} aria-label="Swap tab">
        <TabText $active={activeTab === 'swap'}>Swap</TabText>
        <TabIndicator $active={activeTab === 'swap'} />
      </Tab>

      <Tab onClick={() => handleTabPress('bridge')} aria-label="Bridge tab">
        <TabText $active={activeTab === 'bridge'}>Bridge</TabText>
        <TabIndicator $active={activeTab === 'bridge'} />
      </Tab>
    </Container>
  );
}

export default SwapTabSelector;
