import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, ms, s, fontFamilyNative } from '@salmon/shared';
import type { SwapTabSelectorProps, SwapTab } from './types';

/**
 * Tab selector for switching between Swap and Bridge
 */
export const SwapTabSelector: React.FC<SwapTabSelectorProps> = ({
  activeTab,
  onTabChange,
  style,
}) => {
  const handleTabPress = (tab: SwapTab) => {
    if (tab !== activeTab) {
      onTabChange(tab);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('swap')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'swap' ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Swap
        </Text>
        <View
          style={[
            styles.tabIndicator,
            activeTab === 'swap' ? styles.tabIndicatorActive : styles.tabIndicatorInactive,
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('bridge')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'bridge' ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Bridge
        </Text>
        <View
          style={[
            styles.tabIndicator,
            activeTab === 'bridge' ? styles.tabIndicatorActive : styles.tabIndicatorInactive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.lg),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  tabText: {
    fontSize: ms(18),
    fontFamily: fontFamilyNative.bold,
    letterSpacing: 0.18,
    lineHeight: ms(18 * 1.3),
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  tabTextInactive: {
    color: colors.text.disabled,
  },
  tabIndicator: {
    width: '100%',
    height: 1,
  },
  tabIndicatorActive: {
    backgroundColor: colors.text.primary,
  },
  tabIndicatorInactive: {
    backgroundColor: colors.border.default,
  },
});

export default SwapTabSelector;
