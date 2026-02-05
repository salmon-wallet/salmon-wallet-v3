import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextLayoutEventData, NativeSyntheticEvent } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { colors, ms, vs, s } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { TokenAboutProps } from './types';

/**
 * TokenAbout component for displaying token description
 *
 * Features:
 * - Glassmorphism container
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
export const TokenAbout: React.FC<TokenAboutProps> = ({
  description,
  title = 'About',
  loading = false,
  maxLines = 0, // 0 = no limit, container adapts to content
  style,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (maxLines > 0 && e.nativeEvent.lines.length > maxLines) {
        setShouldShowReadMore(true);
      }
    },
    [maxLines]
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (loading) {
    return (
      <BlurContainer style={[styles.glassWrapper, style]}>
        <View style={styles.container}>
          <ContentLoader
            speed={1.5}
            width="100%"
            height={100}
            backgroundColor={colors.skeleton.base}
            foregroundColor={colors.skeleton.highlight}
          >
            <Rect x="0" y="0" rx="4" ry="4" width="60" height="18" />
            <Rect x="0" y="28" rx="4" ry="4" width="100%" height="12" />
            <Rect x="0" y="46" rx="4" ry="4" width="95%" height="12" />
            <Rect x="0" y="64" rx="4" ry="4" width="90%" height="12" />
            <Rect x="0" y="82" rx="4" ry="4" width="70%" height="12" />
          </ContentLoader>
        </View>
      </BlurContainer>
    );
  }

  if (!description) {
    return null;
  }

  return (
    <BlurContainer style={[styles.glassWrapper, style]}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text
          style={styles.description}
          numberOfLines={expanded || maxLines === 0 ? undefined : maxLines}
          onTextLayout={handleTextLayout}
        >
          {description}
        </Text>
        {shouldShowReadMore && (
          <TouchableOpacity
            onPress={toggleExpanded}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Read less' : 'Read more'}
          >
            <Text style={styles.readMore}>
              {expanded ? 'Read less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BlurContainer>
  );
};

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: 18,
    marginHorizontal: s(24),
    overflow: 'hidden',
  },
  container: {
    padding: s(12),
  },
  title: {
    fontSize: ms(14),
    fontFamily: 'DMSansSemiBold',
    color: colors.text.primary,
    marginBottom: vs(8),
    letterSpacing: ms(-0.07, 0.3),
  },
  description: {
    fontSize: ms(9),
    fontFamily: 'DMSansRegular',
    color: colors.text.primary,
    lineHeight: ms(9) * 1.4,
    letterSpacing: ms(-0.045, 0.3),
  },
  readMore: {
    fontSize: ms(12),
    fontFamily: 'DMSansMedium',
    color: colors.accent.primary,
    marginTop: vs(8),
  },
});

export default TokenAbout;
