/**
 * SecondaryButton - Secondary action button
 *
 * Dark background with white text, used for secondary actions.
 */
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, componentSizes, fontSize, } from '@salmon/shared';

interface SecondaryButtonProps {
  onPress: () => void;
  children: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function SecondaryButton({
  onPress,
  children,
  disabled,
  loading,
  style,
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.button, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.button.secondaryText} />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: componentSizes.buttonHeight,
    backgroundColor: colors.button.secondaryBackground,
    borderRadius: componentSizes.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: colors.button.disabledOpacity,
  },
  text: {
    color: colors.button.secondaryText,
    fontFamily: 'DMSansBold',
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
});
