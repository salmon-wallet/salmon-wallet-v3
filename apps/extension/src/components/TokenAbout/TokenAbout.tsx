/**
 * TokenAbout - Token description/about section
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Provides a glassmorphism container with expandable description text.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  fontWeight,
  fontSize,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { TokenAboutProps } from './types';

const ContentContainer = styled(Box)({
  padding: spacing.md,
});

const Title = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing.sm,
});

const Description = styled(Typography)<{
  $maxLines: number;
  $expanded: boolean;
}>(({ $maxLines, $expanded }) => ({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  lineHeight: 1.4,
  ...($maxLines > 0 && !$expanded
    ? {
        display: '-webkit-box',
        WebkitLineClamp: $maxLines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }
    : {}),
}));

const ReadMoreButton = styled('button')({
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.accent.primary,
  marginTop: spacing.sm,
  '&:hover': {
    opacity: 0.8,
  },
});

/**
 * TokenAbout component for displaying token description
 *
 * Features:
 * - Glassmorphism container (BlurContainer)
 * - "About" section header
 * - Expandable text with "Read more" / "Read less"
 * - Loading skeleton state
 *
 * @example
 * ```tsx
 * <TokenAbout
 *   description="Bitcoin is a decentralized digital currency..."
 *   maxLines={4}
 * />
 * ```
 */
export function TokenAbout({
  description,
  title = 'About',
  loading = false,
  maxLines = 0, // 0 = no limit, container adapts to content
  style,
  className,
}: TokenAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const descriptionRef = useRef<HTMLElement>(null);

  // Detect whether text is clamped (overflows) to show the "Read more" button
  useEffect(() => {
    if (maxLines > 0 && descriptionRef.current) {
      const el = descriptionRef.current;
      setShouldShowReadMore(el.scrollHeight > el.clientHeight);
    }
  }, [description, maxLines]);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (loading) {
    return (
      <BlurContainer
        style={{ borderRadius: borderRadius.lg, overflow: 'hidden', ...style }}
        className={className}
      >
        <ContentContainer>
          <Skeleton
            variant="text"
            width={60}
            height={24}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={18}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="95%"
            height={18}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="90%"
            height={18}
            sx={{ bgcolor: colors.skeleton.base }}
          />
          <Skeleton
            variant="text"
            width="70%"
            height={18}
            sx={{ bgcolor: colors.skeleton.base }}
          />
        </ContentContainer>
      </BlurContainer>
    );
  }

  if (!description) {
    return null;
  }

  return (
    <BlurContainer
      style={{ borderRadius: borderRadius.lg, overflow: 'hidden', ...style }}
      className={className}
    >
      <ContentContainer>
        <Title>{title}</Title>
        <Description
          ref={descriptionRef}
          $maxLines={maxLines}
          $expanded={expanded}
        >
          {description}
        </Description>
        {shouldShowReadMore && (
          <ReadMoreButton
            onClick={toggleExpanded}
            aria-label={expanded ? 'Read less' : 'Read more'}
          >
            {expanded ? 'Read less' : 'Read more'}
          </ReadMoreButton>
        )}
      </ContentContainer>
    </BlurContainer>
  );
}

export default TokenAbout;
