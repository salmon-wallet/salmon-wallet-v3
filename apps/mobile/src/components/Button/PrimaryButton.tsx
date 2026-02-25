/**
 * PrimaryButton - Main call-to-action button
 *
 * White background with dark text, used for primary actions.
 */
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, componentSizes } from '@salmon/shared';

interface PrimaryButtonProps {
  onPress: () => void;
  children: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  onPress,
  children,
  disabled,
  loading,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.button, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.button.primaryText} />
      ) : (
        <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: componentSizes.buttonHeight,
    backgroundColor: colors.button.primaryBackground,
    borderRadius: componentSizes.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: colors.button.disabledOpacity,
  },
  text: {
    color: colors.button.primaryText,
    fontFamily: 'DMSansBold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
