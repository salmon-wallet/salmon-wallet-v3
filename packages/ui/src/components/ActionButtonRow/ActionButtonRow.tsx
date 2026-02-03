import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors, gradients } from '@salmon/shared';
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

// Check if native Liquid Glass is available (iOS 26+)
const useNativeLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Glass effect wrapper for secondary buttons
 * Uses native Liquid Glass on iOS 26+, BlurView fallback otherwise
 */
function GlassButtonContent({ children }: { children: React.ReactNode }) {
  if (useNativeLiquidGlass) {
    return (
      <GlassView glassEffectStyle="clear" style={styles.glassContent}>
        {children}
      </GlassView>
    );
  }

  // Fallback: BlurView for iOS < 26 and Android
  return (
    <BlurView
      intensity={20}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={styles.blurContainer}
    >
      {children}
    </BlurView>
  );
}

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
          <CallMadeSvgIcon size={18} color={colors.text.primary} />
          <Text style={styles.primaryButtonText}>Send</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receive Button - Secondary with Glass Effect */}
      <TouchableOpacity
        style={[
          styles.buttonWrapper,
          styles.secondaryButton,
          receiveDisabled && styles.buttonDisabled,
        ]}
        onPress={handleReceivePress}
        activeOpacity={0.8}
        disabled={receiveDisabled}
        accessibilityRole="button"
        accessibilityLabel="Receive tokens"
      >
        <GlassButtonContent>
          <QrCodeScannerSvgIcon
            size={18}
            color={receiveDisabled ? colors.button.disabledText : '#e0e0e0'}
          />
          <Text style={[styles.secondaryButtonText, receiveDisabled && styles.textDisabled]}>
            Receive
          </Text>
        </GlassButtonContent>
      </TouchableOpacity>

      {/* Activity Button - Secondary with Glass Effect */}
      <TouchableOpacity
        style={[
          styles.buttonWrapper,
          styles.secondaryButton,
          activityDisabled && styles.buttonDisabled,
        ]}
        onPress={handleActivityPress}
        activeOpacity={0.8}
        disabled={activityDisabled}
        accessibilityRole="button"
        accessibilityLabel="View activity"
      >
        <GlassButtonContent>
          <ReceiptLongSvgIcon
            size={18}
            color={activityDisabled ? colors.button.disabledText : '#e0e0e0'}
          />
          <Text style={[styles.secondaryButtonText, activityDisabled && styles.textDisabled]}>
            Activity
          </Text>
        </GlassButtonContent>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
    paddingVertical: 32,
    gap: 16,
  },
  buttonWrapper: {
    borderRadius: 17,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    gap: 11,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    gap: 11,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  glassContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#e0e0e0',
  },
  textDisabled: {
    color: colors.button.disabledText,
  },
});

export default ActionButtonRow;
