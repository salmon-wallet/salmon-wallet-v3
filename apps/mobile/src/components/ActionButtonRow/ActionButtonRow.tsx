import {
  borderRadius,
  borderWidth,
  colors,
  componentSizes,
  fontSize,
  gradients,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurContainer } from '../BlurContainer';
import {
  CallMadeSvgIcon,
  QrCodeScannerSvgIcon,
  ReceiptLongSvgIcon,
} from '../Icon/SvgIcons';
import type { ActionButtonRowProps } from './types';

/**
 * ActionButtonRow component for primary wallet actions
 *
 * Displays three main action buttons:
 * - Send: Primary orange gradient button
 * - Receive: Secondary glass effect button
 * - Activity: Secondary glass effect button
 *
 * iOS 26+: Uses native Liquid Glass effect via expo-glass-effect
 * iOS < 26 / Android: Falls back to BlurView with enhanced glass simulation
 *
 * @example
 * ```tsx
 * <ActionButtonRow
 *   onSendPress={() => navigation.navigate('Send')}
 *   onReceivePress={() => navigation.navigate('Receive')}
 *   onActivityPress={() => navigation.navigate('Activity')}
 * />
 * ```
 */

export const ActionButtonRow: React.FC<ActionButtonRowProps> = ({
  onSendPress,
  onReceivePress,
  onActivityPress,
  sendDisabled = false,
  receiveDisabled = false,
  activityDisabled = false,
  style,
}) => {
  const handleSendPress = useCallback(() => {
    if (!sendDisabled) {
      onSendPress?.();
    }
  }, [onSendPress, sendDisabled]);

  const handleReceivePress = useCallback(() => {
    if (!receiveDisabled) {
      onReceivePress?.();
    }
  }, [onReceivePress, receiveDisabled]);

  const handleActivityPress = useCallback(() => {
    if (!activityDisabled) {
      onActivityPress?.();
    }
  }, [onActivityPress, activityDisabled]);

  return (
    <View style={[styles.container, style]}>
      {/* Send Button - Primary */}
      <TouchableOpacity
        style={[styles.buttonWrapper, sendDisabled && styles.buttonDisabled]}
        onPress={handleSendPress}
        activeOpacity={0.8}
        disabled={sendDisabled}
        accessibilityRole="button"
        accessibilityLabel="Send tokens"
      >
        <LinearGradient
          colors={sendDisabled ? gradients.disabled.colors : gradients.primaryButton.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={styles.primaryButton}
        >
          <CallMadeSvgIcon size={ms(componentSizes.actionButtonIcon)} color="#e0e0e0" />
          <Text style={styles.primaryButtonText}>Send</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receive Button - Secondary with BlurContainer */}
      <View style={[styles.buttonWrapper, receiveDisabled && styles.buttonDisabled]}>
        <BlurContainer
          style={styles.secondaryButton}
          borderColor={colors.accent.primary}
          borderWidth={borderWidth.actionButton}
        >
          <TouchableOpacity
            style={styles.secondaryButtonContent}
            onPress={handleReceivePress}
            activeOpacity={0.8}
            disabled={receiveDisabled}
            accessibilityRole="button"
            accessibilityLabel="Receive tokens"
          >
            <QrCodeScannerSvgIcon
              size={ms(componentSizes.actionButtonIcon)}
              color={receiveDisabled ? colors.button.disabledText : '#e0e0e0'}
            />
            <Text style={[styles.secondaryButtonText, receiveDisabled && styles.textDisabled]}>
              Receive
            </Text>
          </TouchableOpacity>
        </BlurContainer>
      </View>

      {/* Activity Button - Secondary with BlurContainer */}
      <View style={[styles.buttonWrapper, activityDisabled && styles.buttonDisabled]}>
        <BlurContainer
          style={styles.secondaryButton}
          borderColor={colors.accent.primary}
          borderWidth={borderWidth.actionButton}
        >
          <TouchableOpacity
            style={styles.secondaryButtonContent}
            onPress={handleActivityPress}
            activeOpacity={0.8}
            disabled={activityDisabled}
            accessibilityRole="button"
            accessibilityLabel="View activity"
          >
            <ReceiptLongSvgIcon
              size={ms(componentSizes.actionButtonIcon)}
              color={activityDisabled ? colors.button.disabledText : '#e0e0e0'}
            />
            <Text style={[styles.secondaryButtonText, activityDisabled && styles.textDisabled]}>
              Activity
            </Text>
          </TouchableOpacity>
        </BlurContainer>
      </View>
    </View>
  );
};

// Figma spec dimensions - Updated to match new design
// Container: paddingHorizontal: 40px
// Buttons: width: 112px, height: 47px, borderRadius: 14px, gap: 8px
// Icons: ~15px
// Text: fontSize: 14.5px, lineHeight: 1.5
// Border: 0.5px rgba(255,92,69,0.8)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(spacing['4xl']), // 40px
  },
  buttonWrapper: {
    width: s(componentSizes.actionButtonWidth), // 112px
    height: vs(componentSizes.actionButtonHeight), // 47px
    borderRadius: ms(componentSizes.actionButtonRadius), // 14px
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.sm), // 8px
    borderRadius: ms(componentSizes.actionButtonRadius), // 14px
    borderWidth: borderWidth.actionButton, // 0.5px
    borderColor: 'rgba(255, 92, 69, 0.8)',
  },
  primaryButtonText: {
    fontSize: ms(fontSize.actionButton), // 14.5px
    fontWeight: '400',
    color: '#e0e0e0',
    lineHeight: ms(fontSize.actionButton * 1.5), // lineHeight: 1.5
  },
  secondaryButton: {
    flex: 1,
    borderRadius: ms(componentSizes.actionButtonRadius), // 14px
  },
  secondaryButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.sm), // 8px
  },
  secondaryButtonText: {
    fontSize: ms(fontSize.actionButton), // 14.5px
    fontWeight: '400',
    color: '#e0e0e0',
    lineHeight: ms(fontSize.actionButton * 1.5), // lineHeight: 1.5
  },
  textDisabled: {
    color: colors.button.disabledText,
  },
});

export default ActionButtonRow;
