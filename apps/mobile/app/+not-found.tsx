import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from 'react-native';
import { colors, fontFamilyNative, fontSize, spacing } from '@salmon/shared';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamilyNative.bold,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  link: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
  },
  linkText: {
    fontSize: fontSize.base,
    color: colors.accent.primary,
  },
});
