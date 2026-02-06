import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors, ms, vs, s, spacing, fontSize, borderRadius, formatBlockNumber, formatDateTime } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { BlurContainer } from '../BlurContainer';
import { AddressCopyRow } from '../TransactionHistorySheet/AddressCopyRow';
import { ExplorerLinkButton } from '../TransactionHistorySheet/ExplorerLinkButton';
import { PriceImpactBadge } from '../TransactionHistorySheet/PriceImpactBadge';
import { ConversionRateDisplay } from '../TransactionHistorySheet/ConversionRateDisplay';
import type { TransactionDetailModalProps } from './types';
import type { TransactionType, TransactionTokenAmount, NftAttribute } from '../TransactionHistorySheet/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  semiBold: 'DMSansSemiBold',
  bold: 'DMSansBold',
  extraBold: 'DMSansExtraBold',
} as const;

/**
 * Transaction type display configuration
 */
const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  send: {
    label: 'Sent',
    icon: 'arrow-up-outline',
    color: colors.change.negative,
  },
  receive: {
    label: 'Received',
    icon: 'arrow-down-outline',
    color: colors.change.positive,
  },
  swap: {
    label: 'Swapped',
    icon: 'swap-horizontal-outline',
    color: colors.palette.purple,
  },
  mint: {
    label: 'Minted',
    icon: 'add-circle-outline',
    color: colors.palette.cyan,
  },
  burn: {
    label: 'Burned',
    icon: 'flame-outline',
    color: colors.palette.orange,
  },
  stake: {
    label: 'Staked',
    icon: 'lock-closed-outline',
    color: colors.palette.green,
  },
  loan: {
    label: 'Loan',
    icon: 'cash-outline',
    color: colors.palette.amber,
  },
  interaction: {
    label: 'Interaction',
    icon: 'cube-outline',
    color: colors.palette.blue,
  },
  unknown: {
    label: 'Unknown',
    icon: 'help-circle-outline',
    color: colors.text.secondary,
  },
};

/**
 * Status display configuration
 */
const STATUS_CONFIG = {
  completed: {
    label: 'Completed',
    color: colors.status.success,
    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
  },
  failed: {
    label: 'Failed',
    color: colors.status.error,
    icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
  },
  pending: {
    label: 'Pending',
    color: colors.status.warning,
    icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a raw amount with decimals
 */
function formatAmount(amount: string | number, decimals: number): string {
  const rawAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(rawAmount)) return '0';

  const formattedAmount = rawAmount / Math.pow(10, decimals);

  if (formattedAmount === 0) return '0';
  if (formattedAmount < 0.000001) return '<0.000001';
  if (formattedAmount >= 1000000) return `${(formattedAmount / 1000000).toFixed(2)}M`;
  if (formattedAmount >= 1000) return `${(formattedAmount / 1000).toFixed(2)}K`;
  if (formattedAmount >= 1) return formattedAmount.toFixed(4).replace(/\.?0+$/, '');

  return formattedAmount.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Format a timestamp to a full date string
 * @deprecated Use formatDateTime from @salmon/shared instead
 */
function formatFullTimestamp(timestamp: number): string {
  return formatDateTime(timestamp);
}

/**
 * Truncate a transaction hash for display
 */
function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Token logo component with fallback
 */
const TokenLogo: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 36,
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.tokenLogo, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.tokenLogoPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="help-circle-outline" size={size * 0.6} color={colors.text.secondary} />
    </View>
  );
};

/**
 * Token amount row component
 */
const TokenAmountRow: React.FC<{
  token: TransactionTokenAmount;
  sign: '+' | '-';
}> = ({ token, sign }) => {
  const color = sign === '+' ? colors.change.positive : colors.change.negative;
  const formattedAmount = formatAmount(token.amount, token.decimals);

  return (
    <View style={styles.tokenRow}>
      <TokenLogo uri={token.logo} size={32} />
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        {token.name && (
          <Text style={styles.tokenName} numberOfLines={1}>{token.name}</Text>
        )}
      </View>
      <Text style={[styles.tokenAmount, { color }]}>
        {sign} {formattedAmount}
      </Text>
    </View>
  );
};

/**
 * Swap visualization component
 */
const SwapVisualization: React.FC<{
  outputs: TransactionTokenAmount[];
  inputs: TransactionTokenAmount[];
}> = ({ outputs, inputs }) => {
  const fromToken = outputs[0];
  const toToken = inputs[0];

  if (!fromToken || !toToken) return null;

  return (
    <View style={styles.swapContainer}>
      <View style={styles.swapTokenSection}>
        <TokenLogo uri={fromToken.logo} size={40} />
        <Text style={styles.swapAmount}>
          {formatAmount(fromToken.amount, fromToken.decimals)}
        </Text>
        <Text style={styles.swapSymbol}>{fromToken.symbol}</Text>
      </View>
      <View style={styles.swapArrow}>
        <Ionicons name="arrow-forward" size={24} color={colors.text.secondary} />
      </View>
      <View style={styles.swapTokenSection}>
        <TokenLogo uri={toToken.logo} size={40} />
        <Text style={styles.swapAmount}>
          {formatAmount(toToken.amount, toToken.decimals)}
        </Text>
        <Text style={styles.swapSymbol}>{toToken.symbol}</Text>
      </View>
    </View>
  );
};

/**
 * NFT Attribute chip component
 */
const NftAttributeChip: React.FC<{ attribute: NftAttribute }> = ({ attribute }) => {
  return (
    <View style={styles.nftAttributeChip}>
      <Text style={styles.nftAttributeType}>{attribute.trait_type}</Text>
      <Text style={styles.nftAttributeValue} numberOfLines={1}>
        {String(attribute.value)}
      </Text>
    </View>
  );
};

/**
 * NFT Metadata section component
 */
const NftMetadataSection: React.FC<{
  token: TransactionTokenAmount;
}> = ({ token }) => {
  if (!token.isNft) return null;

  return (
    <BlurContainer style={styles.section}>
      <Text style={styles.sectionTitle}>NFT Details</Text>

      {/* NFT Media Preview */}
      {token.nftMedia && (
        <View style={styles.nftMediaContainer}>
          <Image
            source={{ uri: token.nftMedia }}
            style={styles.nftMediaPreview}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Collection Info */}
      {token.nftCollection && (
        <View style={styles.nftCollectionRow}>
          <Text style={styles.sectionLabel}>Collection</Text>
          <View style={styles.nftCollectionInfo}>
            <Text style={styles.sectionValue}>{token.nftCollection}</Text>
            {token.nftCollectionVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.status.success}
                style={styles.verifiedIcon}
              />
            )}
          </View>
        </View>
      )}

      {/* NFT Attributes Grid */}
      {token.nftAttributes && token.nftAttributes.length > 0 && (
        <View style={styles.nftAttributesContainer}>
          <Text style={styles.nftAttributesLabel}>Attributes</Text>
          <View style={styles.nftAttributesGrid}>
            {token.nftAttributes.map((attr, index) => (
              <NftAttributeChip key={`${attr.trait_type}-${index}`} attribute={attr} />
            ))}
          </View>
        </View>
      )}
    </BlurContainer>
  );
};

/**
 * Action button component
 */
const ActionButton: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.text.primary} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransactionDetailModal - Bottom sheet modal for transaction details
 *
 * Features:
 * - Slide-up animation from bottom (~70% height)
 * - Drag to dismiss
 * - Backdrop press to close
 * - Transaction type header with icon
 * - Protocol/source badge
 * - Status indicator
 * - Formatted timestamp
 * - Token inputs/outputs visualization
 * - Swap conversion display
 * - Network fee
 * - Action buttons (View on Solscan, Copy Hash, Share)
 * - Haptic feedback on open
 *
 * @example
 * ```tsx
 * <TransactionDetailModal
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   transaction={selectedTransaction}
 *   onViewExplorer={(tx) => openExplorer(tx.id)}
 *   onCopyHash={(hash) => copyToClipboard(hash)}
 *   onShare={(tx) => shareTransaction(tx)}
 * />
 * ```
 */
export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onViewExplorer,
  onCopyHash,
  onShare,
  style,
}) => {
  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Close handler for worklet
  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Reset drag position
      dragY.value = 0;
      // Animate sheet up
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      // Fade in backdrop
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Animate sheet down
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      // Fade out backdrop
      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Pan gesture for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        dragY.value = event.translationY;
        // Update backdrop opacity based on drag
        backdropOpacity.value = interpolate(
          event.translationY,
          [0, SCREEN_HEIGHT * 0.5],
          [BACKDROP_OPACITY, 0]
        );
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      // If dragged past threshold or with high velocity, close the sheet
      if (event.translationY > DRAG_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeSheet)();
      } else {
        // Snap back to open position
        dragY.value = withSpring(0, SPRING_CONFIG);
        backdropOpacity.value = withSpring(BACKDROP_OPACITY, SPRING_CONFIG);
      }
    });

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle action buttons
  const handleViewExplorer = useCallback(() => {
    if (transaction && onViewExplorer) {
      onViewExplorer(transaction);
    }
  }, [transaction, onViewExplorer]);

  const handleCopyHash = useCallback(() => {
    if (transaction && onCopyHash) {
      onCopyHash(transaction.id);
    }
  }, [transaction, onCopyHash]);

  const handleShare = useCallback(() => {
    if (transaction && onShare) {
      onShare(transaction);
    }
  }, [transaction, onShare]);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Get transaction config
  const typeConfig = useMemo(() => {
    if (!transaction) return TRANSACTION_TYPE_CONFIG.unknown;
    return TRANSACTION_TYPE_CONFIG[transaction.type] || TRANSACTION_TYPE_CONFIG.unknown;
  }, [transaction]);

  const statusConfig = useMemo(() => {
    if (!transaction) return STATUS_CONFIG.completed;
    return STATUS_CONFIG[transaction.status] || STATUS_CONFIG.completed;
  }, [transaction]);

  if (!visible || !transaction) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
          </TouchableWithoutFeedback>

          {/* Sheet Container */}
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle, style]}>
            {/* Scales Background */}
            <ScalesBackground />

            {/* Draggable Header Area */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.dragArea}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                  {/* Type icon */}
                  <View style={[styles.typeIconContainer, { backgroundColor: `${typeConfig.color}20` }]}>
                    <Ionicons name={typeConfig.icon} size={28} color={typeConfig.color} />
                  </View>

                  {/* Title and source */}
                  <View style={styles.headerInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{typeConfig.label}</Text>
                      {transaction.source && (
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceText}>{transaction.source}</Text>
                        </View>
                      )}
                    </View>

                    {/* Status */}
                    <View style={styles.statusRow}>
                      <Ionicons
                        name={statusConfig.icon}
                        size={16}
                        color={statusConfig.color}
                      />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Timestamp */}
              <BlurContainer style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Date & Time</Text>
                  <Text style={styles.sectionValue}>
                    {formatFullTimestamp(transaction.timestamp)}
                  </Text>
                </View>
              </BlurContainer>

              {/* Block/Slot Number */}
              {transaction.slot && (
                <BlurContainer style={styles.section}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>Block</Text>
                    <Text style={styles.sectionValue}>
                      #{formatBlockNumber(transaction.slot)}
                    </Text>
                  </View>
                </BlurContainer>
              )}

              {/* Swap Visualization (for swaps) */}
              {transaction.type === 'swap' && (
                <BlurContainer style={styles.section}>
                  <View style={styles.swapHeaderRow}>
                    <Text style={styles.sectionTitle}>Conversion</Text>
                    {transaction.swapRoute?.priceImpact && (
                      <PriceImpactBadge
                        value={transaction.swapRoute.priceImpact}
                        size="medium"
                        showIcon
                      />
                    )}
                  </View>
                  <SwapVisualization
                    outputs={transaction.outputs}
                    inputs={transaction.inputs}
                  />
                  {transaction.swapRoute?.conversionRate && (
                    <View style={styles.conversionRateContainer}>
                      <ConversionRateDisplay
                        fromSymbol={transaction.swapRoute.conversionRate.fromSymbol}
                        toSymbol={transaction.swapRoute.conversionRate.toSymbol}
                        rate={transaction.swapRoute.conversionRate.rate}
                        size="medium"
                      />
                    </View>
                  )}
                </BlurContainer>
              )}

              {/* Tokens Involved (for non-swaps) */}
              {transaction.type !== 'swap' && (
                <>
                  {transaction.outputs.length > 0 && (
                    <BlurContainer style={styles.section}>
                      <Text style={styles.sectionTitle}>Sent</Text>
                      {transaction.outputs.map((token, index) => (
                        <TokenAmountRow key={`out-${index}`} token={token} sign="-" />
                      ))}
                    </BlurContainer>
                  )}
                  {transaction.inputs.length > 0 && (
                    <BlurContainer style={styles.section}>
                      <Text style={styles.sectionTitle}>Received</Text>
                      {transaction.inputs.map((token, index) => (
                        <TokenAmountRow key={`in-${index}`} token={token} sign="+" />
                      ))}
                    </BlurContainer>
                  )}
                </>
              )}

              {/* Address Section - From/To addresses */}
              {(transaction.outputs.some(t => t.destination) || transaction.inputs.some(t => t.source)) && (
                <BlurContainer style={styles.section}>
                  <Text style={styles.sectionTitle}>Addresses</Text>
                  <View style={styles.addressesContainer}>
                    {/* Show destination addresses from outputs (where tokens were sent) */}
                    {transaction.outputs.map((token, index) =>
                      token.destination ? (
                        <AddressCopyRow
                          key={`to-${index}`}
                          label="To"
                          address={token.destination}
                          truncate="medium"
                          style={styles.addressRow}
                        />
                      ) : null
                    )}
                    {/* Show source addresses from inputs (where tokens came from) */}
                    {transaction.inputs.map((token, index) =>
                      token.source ? (
                        <AddressCopyRow
                          key={`from-${index}`}
                          label="From"
                          address={token.source}
                          truncate="medium"
                          style={styles.addressRow}
                        />
                      ) : null
                    )}
                  </View>
                </BlurContainer>
              )}

              {/* NFT Metadata Sections */}
              {transaction.inputs
                .filter(token => token.isNft)
                .map((token, index) => (
                  <NftMetadataSection key={`nft-in-${index}`} token={token} />
                ))}
              {transaction.outputs
                .filter(token => token.isNft)
                .map((token, index) => (
                  <NftMetadataSection key={`nft-out-${index}`} token={token} />
                ))}

              {/* Network Fee */}
              {transaction.fee && (
                <BlurContainer style={styles.section}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>Network Fee</Text>
                    <Text style={styles.sectionValue}>
                      {formatAmount(transaction.fee.amount, transaction.fee.decimals)} {transaction.fee.symbol}
                    </Text>
                  </View>
                </BlurContainer>
              )}

              {/* Transaction Hash */}
              <BlurContainer style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Transaction Hash</Text>
                  <Text style={styles.hashValue}>{truncateHash(transaction.id)}</Text>
                </View>
              </BlurContainer>

              {/* Explorer Link Button */}
              <ExplorerLinkButton
                txHash={transaction.id}
                blockchain="SOLANA"
                environment="mainnet-beta"
                showMenu
                onPress={(url, explorerName) => {
                  if (onViewExplorer) {
                    onViewExplorer(transaction);
                  }
                }}
                style={styles.explorerButton}
              />

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {onCopyHash && (
                  <ActionButton
                    icon="copy-outline"
                    label="Copy Hash"
                    onPress={handleCopyHash}
                  />
                )}
                {onShare && (
                  <ActionButton
                    icon="share-outline"
                    label="Share"
                    onPress={handleShare}
                  />
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    backgroundColor: '#161c2d',
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    borderTopWidth: 0.75,
    borderTopColor: '#404962',
    height: '70%',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  dragArea: {
    // This area is draggable
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(9),
    paddingBottom: vs(8),
  },
  handle: {
    width: s(70),
    height: vs(6),
    borderRadius: 75,
    backgroundColor: '#b9b9b9',
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(16),
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(4),
  },
  title: {
    fontSize: ms(fontSize['2xl']),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
  },
  sourceBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  statusText: {
    fontSize: ms(fontSize.base),
    fontFamily: FONT_FAMILY.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(40),
    gap: vs(12),
  },
  section: {
    borderRadius: borderRadius.lg,
    padding: s(16),
  },
  sectionTitle: {
    fontSize: ms(fontSize.base),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.secondary,
    marginBottom: vs(12),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: ms(fontSize.base),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  sectionValue: {
    fontSize: ms(fontSize.base),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  hashValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
  },
  // Token row styles
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  tokenLogo: {
    backgroundColor: colors.background.card,
  },
  tokenLogoPlaceholder: {
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenInfo: {
    flex: 1,
    marginLeft: s(12),
  },
  tokenSymbol: {
    fontSize: ms(fontSize.lg),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  tokenName: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
    marginTop: vs(2),
  },
  tokenAmount: {
    fontSize: ms(fontSize.lg),
    fontFamily: FONT_FAMILY.bold,
  },
  // Swap visualization styles
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: vs(8),
  },
  swapTokenSection: {
    alignItems: 'center',
    flex: 1,
  },
  swapAmount: {
    fontSize: ms(fontSize.lg),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    marginTop: vs(8),
  },
  swapSymbol: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
    marginTop: vs(2),
  },
  swapArrow: {
    paddingHorizontal: s(12),
  },
  // Swap header row (title + price impact badge)
  swapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  // Conversion rate display container
  conversionRateContainer: {
    marginTop: vs(12),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'center',
  },
  // Address section styles
  addressesContainer: {
    gap: vs(8),
  },
  addressRow: {
    marginVertical: 0,
  },
  // NFT metadata section styles
  nftMediaContainer: {
    alignItems: 'center',
    marginBottom: vs(16),
  },
  nftMediaPreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
  },
  nftCollectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  nftCollectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginLeft: s(4),
  },
  nftAttributesContainer: {
    marginTop: vs(8),
  },
  nftAttributesLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
    marginBottom: vs(8),
  },
  nftAttributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  nftAttributeChip: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderWidth: 1,
    borderColor: colors.border.default,
    minWidth: '45%',
  },
  nftAttributeType: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: vs(2),
  },
  nftAttributeValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  // Explorer button styles
  explorerButton: {
    marginTop: vs(8),
  },
  // Action buttons styles
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: vs(8),
    gap: s(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: vs(12),
    paddingHorizontal: s(12),
    gap: s(6),
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionButtonText: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
});

export default TransactionDetailModal;
