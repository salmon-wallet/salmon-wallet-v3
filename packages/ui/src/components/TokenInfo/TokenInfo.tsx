import { Ionicons } from '@expo/vector-icons';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
  formatLargeNumber,
  formatUSD,
  getShortAddress,
} from '@salmon/shared';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TokenInfoProps } from './types';

/**
 * TokenInfo component for displaying token information
 *
 * Features:
 * - "About" section with description text
 * - Stats grid showing market cap, volume, supply metrics
 * - Contract address with copy button
 * - Website link (opens external browser)
 * - Loading skeleton state
 *
 * @example
 * ```tsx
 * <TokenInfo
 *   description="Solana is a high-performance blockchain..."
 *   marketCap={50000000000}
 *   volume24h={1500000000}
 *   circulatingSupply={400000000}
 *   totalSupply={500000000}
 *   contractAddress="So11111111111111111111111111111111111111112"
 *   website="https://solana.com"
 * />
 * ```
 */
export const TokenInfo: React.FC<TokenInfoProps> = ({
  description,
  marketCap,
  volume24h,
  circulatingSupply,
  totalSupply,
  maxSupply,
  contractAddress,
  website,
  loading = false,
  style,
}) => {
  const handleCopyAddress = useCallback(async () => {
    if (contractAddress) {
      await Clipboard.setStringAsync(contractAddress);
      Alert.alert('Copied', 'Contract address copied to clipboard');
    }
  }, [contractAddress]);

  const handleOpenWebsite = useCallback(async () => {
    if (website) {
      const supported = await Linking.canOpenURL(website);
      if (supported) {
        await Linking.openURL(website);
      }
    }
  }, [website]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {/* About section skeleton */}
        <View style={styles.section}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonDescription} />
          <View style={[styles.skeletonDescription, { width: '80%' }]} />
          <View style={[styles.skeletonDescription, { width: '60%' }]} />
        </View>

        {/* Stats grid skeleton */}
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.statItem}>
              <View style={styles.skeletonStatLabel} />
              <View style={styles.skeletonStatValue} />
            </View>
          ))}
        </View>

        {/* Contract skeleton */}
        <View style={styles.skeletonContract} />
      </View>
    );
  }

  const hasStats =
    marketCap !== undefined ||
    volume24h !== undefined ||
    circulatingSupply !== undefined ||
    totalSupply !== undefined ||
    maxSupply !== undefined;

  return (
    <View style={[styles.container, style]}>
      {/* About section */}
      {description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      )}

      {/* Stats grid */}
      {hasStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Stats</Text>
          <View style={styles.statsGrid}>
            {marketCap !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Market Cap</Text>
                <Text style={styles.statValue}>{formatUSD(marketCap)}</Text>
              </View>
            )}
            {volume24h !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24h Volume</Text>
                <Text style={styles.statValue}>{formatUSD(volume24h)}</Text>
              </View>
            )}
            {circulatingSupply !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Circulating</Text>
                <Text style={styles.statValue}>
                  {formatLargeNumber(circulatingSupply)}
                </Text>
              </View>
            )}
            {totalSupply !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Supply</Text>
                <Text style={styles.statValue}>
                  {formatLargeNumber(totalSupply)}
                </Text>
              </View>
            )}
            {maxSupply !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max Supply</Text>
                <Text style={styles.statValue}>
                  {formatLargeNumber(maxSupply)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Contract address */}
      {contractAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Address</Text>
          <TouchableOpacity
            style={styles.contractRow}
            onPress={handleCopyAddress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Copy contract address"
          >
            <Text style={styles.contractAddress}>
              {getShortAddress(contractAddress, 6) ?? ''}
            </Text>
            <View style={styles.copyButton}>
              <Ionicons
                name="copy-outline"
                size={18}
                color={colors.text.muted}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Website link */}
      {website && (
        <TouchableOpacity
          style={styles.websiteRow}
          onPress={handleOpenWebsite}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={`Open website: ${website}`}
        >
          <Ionicons
            name="globe-outline"
            size={20}
            color={colors.accent.primary}
          />
          <Text style={styles.websiteText}>Visit Website</Text>
          <Ionicons
            name="open-outline"
            size={16}
            color={colors.accent.primary}
            style={styles.websiteIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular as '400',
    color: colors.text.muted,
    lineHeight: fontSize.base * 1.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular as '400',
    color: colors.text.secondary,
    marginBottom: spacing['2xs'],
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium as '500',
    color: colors.text.primary,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  contractAddress: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular as '400',
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: spacing.xs,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  websiteText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as '500',
    color: colors.accent.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  websiteIcon: {
    marginLeft: spacing.xs,
  },
  // Skeleton styles
  skeletonTitle: {
    width: 80,
    height: 20,
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  skeletonDescription: {
    height: 16,
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  skeletonStatLabel: {
    width: 60,
    height: 14,
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.sm,
    marginBottom: spacing['2xs'],
  },
  skeletonStatValue: {
    width: 80,
    height: 18,
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.sm,
  },
  skeletonContract: {
    height: 52,
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.md,
  },
});

export default TokenInfo;
