import { colors, gradients, ms, s, vs } from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../GlassContainer';
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
          <CallMadeSvgIcon size={ms(15)} color="#e0e0e0" />
          <Text style={styles.primaryButtonText}>Send</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receive Button - Secondary with Glass Effect */}
      <GlassContainer
        style={[styles.secondaryButtonWrapper, receiveDisabled && styles.buttonDisabled]}
        fallbackBlurIntensity={2.5}
        fallbackBackgroundColor="rgba(255, 255, 255, 0.04)"
        fallbackBorderColor="rgba(255, 92, 69, 0.8)"
        fallbackBorderWidth={0.5}
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
            size={ms(15)}
            color={receiveDisabled ? colors.button.disabledText : '#e0e0e0'}
          />
          <Text style={[styles.secondaryButtonText, receiveDisabled && styles.textDisabled]}>
            Receive
          </Text>
        </TouchableOpacity>
      </GlassContainer>

      {/* Activity Button - Secondary with Glass Effect */}
      <GlassContainer
        style={[styles.secondaryButtonWrapper, activityDisabled && styles.buttonDisabled]}
        fallbackBlurIntensity={2.5}
        fallbackBackgroundColor="rgba(255, 255, 255, 0.04)"
        fallbackBorderColor="rgba(255, 92, 69, 0.8)"
        fallbackBorderWidth={0.5}
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
            size={ms(15)}
            color={activityDisabled ? colors.button.disabledText : '#e0e0e0'}
          />
          <Text style={[styles.secondaryButtonText, activityDisabled && styles.textDisabled]}>
            Activity
          </Text>
        </TouchableOpacity>
      </GlassContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(28),
    paddingVertical: vs(24),
  },
  buttonWrapper: {
    borderRadius: ms(14),
    overflow: 'hidden',
    width: s(118),
  },
  buttonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(47),
    paddingHorizontal: s(18),
    gap: s(9),
    borderRadius: ms(14),
    borderWidth: 0.5,
    borderColor: 'rgba(255, 92, 69, 0.8)',
  },
  primaryButtonText: {
    fontSize: ms(14.5),
    fontWeight: '400',
    color: '#e0e0e0',
    lineHeight: ms(14.5 * 1.5),
  },
  secondaryButtonWrapper: {
    borderRadius: ms(14),
    overflow: 'hidden',
    width: s(118),
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(47),
    paddingHorizontal: s(18),
    gap: s(9),
  },
  secondaryButtonText: {
    fontSize: ms(14.5),
    fontWeight: '400',
    color: '#e0e0e0',
    lineHeight: ms(14.5 * 1.5),
  },
  textDisabled: {
    color: colors.button.disabledText,
  },
});

export default ActionButtonRow;
