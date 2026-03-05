/**
 * TextButton - Text-only button without background
 *
 * Used for tertiary actions or links.
 */
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, componentSizes, spacing, fontSize, letterSpacing, } from '@salmon/shared';

interface TextButtonProps {
  onPress: () => void;
  children: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  color?: string;
}

export function TextButton({
  onPress,
  children,
  disabled,
  loading,
  style,
  color,
}: TextButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[styles.button, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={color || colors.text.primary} />
      ) : (
        <Text style={[styles.text, color ? { color } : undefined]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: componentSizes.buttonHeightSmall,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: colors.button.disabledOpacity,
  },
  text: {
    color: colors.text.primary,
    fontFamily: 'DMSansMedium',
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.wider,
  },
});
