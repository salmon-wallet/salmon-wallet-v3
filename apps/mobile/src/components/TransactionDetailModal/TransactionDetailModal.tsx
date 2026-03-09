import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
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
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../../utils/haptics';
import { borderWidth, colors, shadows, componentSizes, ms, vs, s, spacing, fontSize, borderRadius, letterSpacing, fontFamilyNative, formatBlockNumber, formatDateTime, formatRawAmount, truncateHash, getShortAddress, opacity } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { BlurContainer } from '../BlurContainer';
import { TokenLogo } from '../TokenLogo';
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

/**
 * Confirmation status display configuration
 */
const CONFIRMATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  processed: { label: 'Processed', color: colors.status.warning },
  confirmed: { label: 'Confirmed', color: colors.palette.blue },
  finalized: { label: 'Finalized', color: colors.status.success },
};

/** Translation key maps — resolved via t() inside the component */
const TYPE_LABEL_KEYS: Record<TransactionType, string> = {
  send: 'transactions.detail.sent',
  receive: 'transactions.detail.received',
  swap: 'transactions.detail.swapped',
  mint: 'transactions.detail.minted',
  burn: 'transactions.detail.burned',
  stake: 'transactions.detail.staked',
  loan: 'transactions.detail.loan',
  interaction: 'transactions.detail.interaction',
  unknown: 'transactions.detail.unknown',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  completed: 'transactions.detail.completed',
  failed: 'transactions.detail.failed',
  pending: 'transactions.detail.pending',
};

const CONFIRMATION_LABEL_KEYS: Record<string, string> = {
  processed: 'transactions.detail.processed',
  confirmed: 'transactions.detail.confirmed',
  finalized: 'transactions.detail.finalized',
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Internal divider for grouping rows within a single card
 */
const InternalDivider: React.FC = () => <View style={styles.internalDivider} />;

/**
 * Token amount row component
 */
const TokenAmountRow: React.FC<{
  token: TransactionTokenAmount;
  sign: '+' | '-';
}> = ({ token, sign }) => {
  const color = sign === '+' ? colors.change.positive : colors.change.negative;
  const formattedAmount = formatRawAmount(token.amount, token.decimals);

  return (
    <View style={styles.tokenRow}>
      <TokenLogo uri={token.logo || undefined} symbol={token.symbol} size={32} />
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
        <TokenLogo uri={fromToken.logo || undefined} symbol={fromToken.symbol} size={40} />
        <Text style={styles.swapAmount}>
          {formatRawAmount(fromToken.amount, fromToken.decimals)}
        </Text>
        <Text style={styles.swapSymbol}>{fromToken.symbol}</Text>
      </View>
      <View style={styles.swapArrow}>
        <Ionicons name="arrow-forward" size={24} color={colors.text.secondary} />
      </View>
      <View style={styles.swapTokenSection}>
        <TokenLogo uri={toToken.logo || undefined} symbol={toToken.symbol} size={40} />
        <Text style={styles.swapAmount}>
          {formatRawAmount(toToken.amount, toToken.decimals)}
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
  const { t } = useTranslation();
  if (!token.isNft) return null;

  return (
    <BlurContainer style={styles.section}>
      <Text style={styles.sectionTitle}>{t('transactions.detail.nftDetails', 'NFT Details')}</Text>

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
          <Text style={styles.sectionLabel}>{t('transactions.detail.collection', 'Collection')}</Text>
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
          <Text style={styles.nftAttributesLabel}>{t('transactions.detail.attributes', 'Attributes')}</Text>
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

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onViewExplorer,
  onCopyHash,
  onShare,
  developerMode,
  style,
}) => {
  const { t } = useTranslation();

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
  }, [visible, backdropOpacity, dragY, translateY]);

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

  // Inline hash copy state
  const [hashCopied, setHashCopied] = useState(false);

  const handleCopyInlineHash = useCallback(async () => {
    if (!transaction) return;
    try {
      await Clipboard.setStringAsync(transaction.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onCopyHash) onCopyHash(transaction.id);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 1500);
    } catch (error) {
      console.warn('Failed to copy hash:', error);
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
                    <Ionicons name={typeConfig.icon} size={22} color={typeConfig.color} />
                  </View>

                  {/* Title and source */}
                  <View style={styles.headerInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{t(TYPE_LABEL_KEYS[transaction.type] ?? TYPE_LABEL_KEYS.unknown, typeConfig.label)}</Text>
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
                        {t(STATUS_LABEL_KEYS[transaction.status] ?? '', statusConfig.label)}
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
              {/* Card 1 — Details: Date/Time + Confirmation + Block */}
              <BlurContainer style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>{t('transactions.detail.dateTime', 'Date & Time')}</Text>
                  <Text style={styles.sectionValue}>
                    {formatDateTime(transaction.timestamp)}
                  </Text>
                </View>

                {transaction.confirmationStatus && (
                  <>
                    <InternalDivider />
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>{t('transactions.detail.confirmation', 'Confirmation')}</Text>
                      <View style={[
                        styles.confirmationBadge,
                        { backgroundColor: `${CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.color ?? colors.text.secondary}20` },
                      ]}>
                        <Text style={[
                          styles.confirmationText,
                          { color: CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.color ?? colors.text.secondary },
                        ]}>
                          {t(CONFIRMATION_LABEL_KEYS[transaction.confirmationStatus] ?? '', CONFIRMATION_STATUS_CONFIG[transaction.confirmationStatus]?.label ?? transaction.confirmationStatus)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {transaction.slot && (
                  <>
                    <InternalDivider />
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>{t('transactions.detail.block', 'Block')}</Text>
                      <Text style={styles.sectionValue}>
                        #{formatBlockNumber(transaction.slot)}
                      </Text>
                    </View>
                  </>
                )}
              </BlurContainer>

              {/* Swap Visualization (for swaps) */}
              {transaction.type === 'swap' && (
                <BlurContainer style={styles.section}>
                  <View style={styles.swapHeaderRow}>
                    <Text style={styles.sectionTitle}>{t('transactions.detail.conversion', 'Conversion')}</Text>
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

              {/* Swap Route Hops (for multi-hop swaps) */}
              {transaction.type === 'swap' && transaction.swapRoute?.hops && transaction.swapRoute.hops.length > 0 && (
                <BlurContainer style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('transactions.detail.swapRoute', 'Swap Route')}</Text>
                  {transaction.swapRoute.hops.map((hop, index) => (
                    <View key={`hop-${index}`} style={styles.hopRow}>
                      <View style={styles.hopBadge}>
                        <Text style={styles.hopBadgeText}>{hop.dex}</Text>
                      </View>
                      <View style={styles.hopTokens}>
                        <Text style={styles.hopTokenText}>
                          {hop.inputToken.symbol}
                        </Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.text.tertiary} />
                        <Text style={styles.hopTokenText}>
                          {hop.outputToken.symbol}
                        </Text>
                      </View>
                      {hop.percent < 100 && (
                        <Text style={styles.hopPercent}>{hop.percent}%</Text>
                      )}
                    </View>
                  ))}
                </BlurContainer>
              )}

              {/* Card 2 — Tokens (non-swap): Sent + Received merged */}
              {transaction.type !== 'swap' && (transaction.outputs.length > 0 || transaction.inputs.length > 0) && (
                <BlurContainer style={styles.section}>
                  {transaction.outputs.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>{t('transactions.detail.sentLabel', 'Sent')}</Text>
                      {transaction.outputs.map((token, index) => (
                        <TokenAmountRow key={`out-${index}`} token={token} sign="-" />
                      ))}
                    </>
                  )}
                  {transaction.outputs.length > 0 && transaction.inputs.length > 0 && (
                    <InternalDivider />
                  )}
                  {transaction.inputs.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>{t('transactions.detail.receivedLabel', 'Received')}</Text>
                      {transaction.inputs.map((token, index) => (
                        <TokenAmountRow key={`in-${index}`} token={token} sign="+" />
                      ))}
                    </>
                  )}
                </BlurContainer>
              )}

              {/* Address Section */}
              {(transaction.outputs.some(t => t.destination) || transaction.inputs.some(t => t.source) || transaction.feePayer) && (
                <BlurContainer style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('transactions.detail.addresses', 'Addresses')}</Text>
                  <View style={styles.addressesContainer}>
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
                    {transaction.feePayer && (
                      <AddressCopyRow
                        label="Fee Payer"
                        address={transaction.feePayer}
                        truncate="medium"
                        style={styles.addressRow}
                      />
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

              {/* Card 3 — Transaction Info: Fee + Swap Fee + Hash merged */}
              <BlurContainer style={styles.section}>
                {transaction.fee && (
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>{t('transactions.detail.networkFee', 'Network Fee')}</Text>
                    <Text style={styles.sectionValue}>
                      {formatRawAmount(transaction.fee.amount, transaction.fee.decimals)} {transaction.fee.symbol}
                    </Text>
                  </View>
                )}

                {transaction.swapRoute?.totalFee && (
                  <>
                    {transaction.fee && <InternalDivider />}
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>{t('transactions.detail.swapFee', 'Swap Fee')}</Text>
                      <Text style={styles.sectionValue}>
                        {transaction.swapRoute.totalFee.amount} {transaction.swapRoute.totalFee.symbol}
                      </Text>
                    </View>
                  </>
                )}

                {(transaction.fee || transaction.swapRoute?.totalFee) && <InternalDivider />}

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>{t('transactions.detail.transactionHash', 'Transaction Hash')}</Text>
                  <View style={styles.hashRow}>
                    <Text style={styles.hashValue}>{truncateHash(transaction.id, 8)}</Text>
                    <TouchableOpacity
                      onPress={handleCopyInlineHash}
                      style={[styles.copyIconButton, hashCopied && styles.copyIconButtonCopied]}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel="Copy transaction hash"
                    >
                      <Ionicons
                        name={hashCopied ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={hashCopied ? colors.status.success : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurContainer>

              {/* Developer Info (dev mode only) */}
              {developerMode && (
                <BlurContainer style={styles.section}>
                  <View style={styles.devSectionHeader}>
                    <Ionicons name="code-slash-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.sectionTitle}>{t('transactions.detail.developerInfo', 'Developer Info')}</Text>
                  </View>

                  {transaction.heliusType && (
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>{t('transactions.detail.heliusType', 'Helius Type')}</Text>
                      <View style={styles.devBadge}>
                        <Text style={styles.devBadgeText}>{transaction.heliusType}</Text>
                      </View>
                    </View>
                  )}

                  {transaction.accountsInvolved != null && (
                    <View style={[styles.sectionRow, { marginTop: vs(spacing.sm) }]}>
                      <Text style={styles.sectionLabel}>{t('transactions.detail.accountsInvolved', 'Accounts Involved')}</Text>
                      <Text style={styles.sectionValue}>{transaction.accountsInvolved}</Text>
                    </View>
                  )}

                  {transaction.instructions && transaction.instructions.length > 0 && (
                    <View style={styles.devSubSection}>
                      <Text style={styles.devSubTitle}>{t('transactions.detail.programs', 'Programs')}</Text>
                      {transaction.instructions.map((ix, index) => (
                        <View key={`ix-${index}`} style={styles.devRow}>
                          <Text style={styles.devMonoText}>
                            {getShortAddress(ix.programId, 6)}
                          </Text>
                          {ix.innerInstructionsCount > 0 && (
                            <Text style={styles.devSecondaryText}>
                              {ix.innerInstructionsCount} inner
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {transaction.innerSwaps && transaction.innerSwaps.length > 0 && (
                    <View style={styles.devSubSection}>
                      <Text style={styles.devSubTitle}>{t('transactions.detail.innerSwaps', 'Inner Swaps')}</Text>
                      {transaction.innerSwaps.map((swap, index) => (
                        <View key={`inner-${index}`} style={styles.devRow}>
                          <Text style={styles.devMonoText}>
                            {swap.programInfo.source}
                          </Text>
                          <Text style={styles.devSecondaryText}>
                            {swap.programInfo.programName} / {swap.programInfo.instructionName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {transaction.swapFees && (
                    <View style={styles.devSubSection}>
                      <Text style={styles.devSubTitle}>{t('transactions.detail.swapFees', 'Swap Fees')}</Text>
                      {transaction.swapFees.nativeFees.map((fee, index) => (
                        <View key={`nfee-${index}`} style={styles.devRow}>
                          <Text style={styles.devMonoText}>
                            {getShortAddress(fee.account, 6)}
                          </Text>
                          <Text style={styles.devSecondaryText}>
                            {fee.amount} SOL
                          </Text>
                        </View>
                      ))}
                      {transaction.swapFees.tokenFees.map((fee, index) => (
                        <View key={`tfee-${index}`} style={styles.devRow}>
                          <Text style={styles.devMonoText}>
                            {getShortAddress(fee.account, 6)}
                          </Text>
                          <Text style={styles.devSecondaryText}>
                            {fee.amount} ({getShortAddress(fee.mint, 4)})
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </BlurContainer>
              )}
            </ScrollView>

            {/* Fixed Bottom Action Bar */}
            <View style={styles.fixedBottomBar}>
              <ExplorerLinkButton
                txHash={transaction.id}
                blockchain="SOLANA"
                environment="solana-mainnet"
                showMenu
                onPress={(_url, _explorerName) => {
                  if (onViewExplorer) {
                    onViewExplorer(transaction);
                  }
                }}
              />
              {onShare && (
                <View style={styles.actionsRow}>
                  <ActionButton
                    icon="share-outline"
                    label="Share"
                    onPress={handleShare}
                  />
                </View>
              )}
            </View>
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
    backgroundColor: colors.sheet.backdrop,
  },
  sheetContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    borderTopWidth: 0.75,
    borderTopColor: colors.border.default,
    height: '70%',
    overflow: 'hidden',
    // Shadow
    ...shadows.sheet,
  },
  dragArea: {
    // This area is draggable
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(spacing.sm),
    paddingBottom: vs(spacing.sm),
  },
  handle: {
    width: s(componentSizes.sheetHandleWidth),
    height: vs(componentSizes.sheetHandleHeight),
    borderRadius: 75,
    backgroundColor: colors.sheet.handle,
    opacity: opacity.faint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(spacing.md),
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.tokenIcon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(spacing.md),
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.sm),
    marginBottom: vs(spacing.xs),
  },
  title: {
    fontSize: ms(fontSize['2xl']),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
  sourceBadge: {
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xxs),
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  statusText: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(spacing.md),
    gap: vs(spacing.md),
  },
  internalDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: vs(spacing.sm),
  },
  section: {
    borderRadius: borderRadius.lg,
    padding: s(spacing.lg),
    borderWidth: 0,
    borderColor: 'transparent',
  },
  sectionTitle: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.secondary,
    marginBottom: vs(spacing.md),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
  },
  sectionValue: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  hashValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: 'monospace',
    color: colors.text.primary,
  },
  copyIconButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.background.card}80`,
  },
  copyIconButtonCopied: {
    backgroundColor: `${colors.status.success}20`,
  },
  // Token row styles
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(spacing.sm),
  },
  tokenInfo: {
    flex: 1,
    marginLeft: s(spacing.md),
  },
  tokenSymbol: {
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
  tokenName: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
    marginTop: vs(spacing.xxs),
  },
  tokenAmount: {
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.bold,
  },
  // Swap visualization styles
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: vs(spacing.sm),
  },
  swapTokenSection: {
    alignItems: 'center',
    flex: 1,
  },
  swapAmount: {
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    marginTop: vs(spacing.sm),
  },
  swapSymbol: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    marginTop: vs(spacing.xxs),
  },
  swapArrow: {
    paddingHorizontal: s(spacing.md),
  },
  // Swap header row (title + price impact badge)
  swapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(spacing.md),
  },
  // Conversion rate display container
  conversionRateContainer: {
    marginTop: vs(spacing.md),
    paddingTop: vs(spacing.md),
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'center',
  },
  // Address section styles
  addressesContainer: {
    gap: vs(spacing.sm),
  },
  addressRow: {
    marginVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  // NFT metadata section styles
  nftMediaContainer: {
    alignItems: 'center',
    marginBottom: vs(spacing.lg),
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
    marginBottom: vs(spacing.md),
  },
  nftCollectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginLeft: s(spacing.xs),
  },
  nftAttributesContainer: {
    marginTop: vs(spacing.sm),
  },
  nftAttributesLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    marginBottom: vs(spacing.sm),
  },
  nftAttributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(spacing.sm),
  },
  nftAttributeChip: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.xs),
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    minWidth: '45%',
  },
  nftAttributeType: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
    marginBottom: vs(spacing.xxs),
  },
  nftAttributeValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
  // Confirmation status badge
  confirmationBadge: {
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xxs),
    borderRadius: borderRadius.sm,
  },
  confirmationText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  // Swap route hop styles
  hopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(spacing.xs),
    gap: s(spacing.sm),
  },
  hopBadge: {
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xxs),
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
  },
  hopBadgeText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
  hopTokens: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  hopTokenText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
  },
  hopPercent: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.tertiary,
  },
  // Developer info section styles
  devSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    marginBottom: vs(spacing.md),
  },
  devBadge: {
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xxs),
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
  },
  devBadgeText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  devSubSection: {
    marginTop: vs(spacing.md),
    paddingTop: vs(spacing.sm),
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  devSubTitle: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
    marginBottom: vs(spacing.xs),
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(spacing.xs),
  },
  devMonoText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  devSecondaryText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.tertiary,
  },
  // Fixed bottom action bar
  fixedBottomBar: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingTop: vs(spacing.md),
    paddingBottom: vs(spacing.xl),
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: vs(spacing.sm),
    gap: s(spacing.sm),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: vs(spacing.md),
    paddingHorizontal: s(spacing.md),
    gap: s(spacing.xs),
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
  },
  actionButtonText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
  },
});

export default TransactionDetailModal;
