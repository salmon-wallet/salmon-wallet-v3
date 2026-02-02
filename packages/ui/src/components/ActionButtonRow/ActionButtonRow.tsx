import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ActionButtonRowProps } from './types';

/**
 * Gradient colors for primary (send) button
 */
const PRIMARY_GRADIENT: readonly [ColorValue, ColorValue] = ['#ff5c45', '#ff3d2e'];
const DISABLED_GRADIENT: readonly [ColorValue, ColorValue] = ['#666', '#444'];

/**
 * ActionButtonRow component for primary wallet actions
 *
 * Displays three main action buttons:
 * - Send: Primary orange gradient button
 * - Receive: Secondary outlined button
 * - Activity: Secondary outlined button
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
          colors={sendDisabled ? DISABLED_GRADIENT : PRIMARY_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Send</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receive Button - Secondary */}
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
        <Ionicons
          name="arrow-down"
          size={22}
          color={receiveDisabled ? '#666' : '#FFFFFF'}
        />
        <Text style={[styles.secondaryButtonText, receiveDisabled && styles.textDisabled]}>
          Receive
        </Text>
      </TouchableOpacity>

      {/* Activity Button - Secondary */}
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
        <Ionicons
          name="time-outline"
          size={22}
          color={activityDisabled ? '#666' : '#FFFFFF'}
        />
        <Text style={[styles.secondaryButtonText, activityDisabled && styles.textDisabled]}>
          Activity
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textDisabled: {
    color: '#666',
  },
});

export default ActionButtonRow;
