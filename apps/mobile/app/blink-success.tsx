/**
 * BlinkSuccessScreen — confirmation surface shown after a Solana Action /
 * Blink has been submitted and confirmed by `signAndSubmitActionTransaction`.
 *
 * Reads the resulting `signature` (and optional `host` for context) from
 * route params and renders the shared `TransactionSuccessScreen` with a
 * truncated signature and a Done button that dismisses the modal stack
 * back to the Blinks tab.
 */
import {
  colors,
  fontFamilyNative,
  fontSize,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { TransactionSuccessScreen } from '../src/components/TransactionSuccessScreen';

function truncateSignature(sig: string): string {
  if (!sig) return '';
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

export default function BlinkSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ signature?: string; host?: string }>();
  const signature = params.signature ?? '';
  const truncated = truncateSignature(signature);

  const handleDone = () => {
    if (typeof router.dismissAll === 'function') {
      router.dismissAll();
      return;
    }
    router.replace('/(app)/(tabs)/blinks' as never);
  };

  if (!signature) {
    return (
      <View testID="blink-success-empty" style={styles.fallback}>
        <Text style={styles.fallbackText}>{t('blinks.success.subtitle')}</Text>
      </View>
    );
  }

  return (
    <TransactionSuccessScreen
      title={t('blinks.success.title')}
      summary={truncated}
      explorerUrl={null}
      onContinue={handleDone}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: s(spacing.md),
  },
  fallbackText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.md),
    color: colors.text.muted,
    marginTop: vs(spacing.md),
    textAlign: 'center',
  },
});
