/**
 * DerivedAccountCardSkeleton - Loading placeholder for derived account cards
 *
 * Web version using MUI keyframe animations for shimmer effect.
 */
import React from 'react';
import { styled, keyframes } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { colors, spacing, borderRadius } from '@salmon/shared';
import type { DerivedAccountCardSkeletonProps } from './types';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const Card = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.card.background,
  border: `1px solid ${colors.card.border}`,
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
  marginBottom: spacing.md,
});

const SkeletonRect = styled(Box)({
  borderRadius: 4,
  background: `linear-gradient(90deg, ${colors.skeleton?.base ?? 'rgba(255,255,255,0.05)'} 25%, ${colors.skeleton?.highlight ?? 'rgba(255,255,255,0.1)'} 50%, ${colors.skeleton?.base ?? 'rgba(255,255,255,0.05)'} 75%)`,
  backgroundSize: '400px 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});

const DerivedAccountCardSkeletonComponent: React.FC<DerivedAccountCardSkeletonProps> = ({
  style,
  className,
}) => {
  return (
    <Card style={style} className={className}>
      {/* Checkbox skeleton */}
      <SkeletonRect sx={{ width: 24, height: 24, borderRadius: '6px', mr: `${spacing.lg}px`, flexShrink: 0 }} />

      {/* Info skeleton */}
      <Box sx={{ flex: 1 }}>
        <SkeletonRect sx={{ width: '55%', height: 16, mb: '2px' }} />
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: `${spacing.xs}px` }}>
          <SkeletonRect sx={{ width: 16, height: 16, borderRadius: '8px', flexShrink: 0 }} />
          <SkeletonRect sx={{ width: '35%', height: 12 }} />
        </Box>
      </Box>

      {/* Balance skeleton */}
      <SkeletonRect sx={{ width: 70, height: 16, flexShrink: 0 }} />
    </Card>
  );
};

export const DerivedAccountCardSkeleton = React.memo(DerivedAccountCardSkeletonComponent);
