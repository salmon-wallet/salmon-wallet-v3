/**
 * PriceImpactBadge - Displays price impact with color coding based on severity
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 *
 * Severity levels:
 * - Safe (< 0.5%): Green with checkmark icon
 * - Warning (0.5% - 1%): Yellow/Orange with warning icon
 * - High (> 1%): Red with alert icon
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { colors, spacing, borderRadius } from '@salmon/shared';
import type { PriceImpactBadgeProps } from './types';

// ============================================================================
// Types
// ============================================================================

type PriceImpactSeverity = 'safe' | 'warning' | 'high';

// ============================================================================
// Constants
// ============================================================================

const THRESHOLDS = {
  safe: 0.5,
  warning: 1,
} as const;

const SEVERITY_COLORS: Record<PriceImpactSeverity, string> = {
  safe: colors.status.success,
  warning: colors.status.warning,
  high: colors.status.error,
};

const SIZE_CONFIG = {
  small: { iconSize: 12, fontSize: 11, paddingH: spacing.xs, paddingV: 2 },
  medium: { iconSize: 14, fontSize: 12, paddingH: spacing.sm, paddingV: 4 },
  large: { iconSize: 16, fontSize: 14, paddingH: spacing.md, paddingV: 6 },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function getSeverity(value: string): PriceImpactSeverity {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue) || numericValue < THRESHOLDS.safe) return 'safe';
  if (numericValue <= THRESHOLDS.warning) return 'warning';
  return 'high';
}

function getSeverityIcon(severity: PriceImpactSeverity, size: number) {
  const sx = { fontSize: size };
  switch (severity) {
    case 'safe':
      return <CheckCircleIcon sx={sx} />;
    case 'warning':
      return <WarningIcon sx={sx} />;
    case 'high':
      return <ErrorIcon sx={sx} />;
  }
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: borderRadius.sm,
});

// ============================================================================
// Component
// ============================================================================

export const PriceImpactBadge: React.FC<PriceImpactBadgeProps> = ({
  value,
  size = 'medium',
  showIcon = false,
}) => {
  const severity = getSeverity(value);
  const color = SEVERITY_COLORS[severity];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <Container
      sx={{
        backgroundColor: `${color}15`,
        padding: `${sizeConfig.paddingV}px ${sizeConfig.paddingH}px`,
        color,
      }}
    >
      {showIcon && (
        <Box sx={{ display: 'flex', mr: `${spacing.xs}px` }}>
          {getSeverityIcon(severity, sizeConfig.iconSize)}
        </Box>
      )}
      <Typography
        component="span"
        sx={{
          fontSize: sizeConfig.fontSize,
          fontWeight: 500,
          color: 'inherit',
          lineHeight: 1.2,
        }}
      >
        {value}%
      </Typography>
    </Container>
  );
};

export default PriceImpactBadge;
