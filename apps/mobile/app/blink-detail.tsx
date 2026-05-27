/**
 * BlinkDetailScreen — fetches Solana Action metadata for a trusted host and
 * renders the dynamic params form. Continue routes to the approval screen
 * (added in Task 1.3) with the collected parameter values.
 *
 * Source is restricted to hosts already validated by the registry guard inside
 * `fetchActionMetadata` — the host param flows from the discovery tab, never
 * from free-text input (phishing risk gate R1).
 *
 * Client-side `pattern` validation here is a UX nicety, not a security
 * boundary; server-side validation in Phase 3 is authoritative.
 */
import {
  blinks,
  colors,
  fontFamilyNative,
  fontSize,
  letterSpacing,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ActionParamForm,
  validateParameters,
  type ActionParamFormParameter,
} from '../src/components/ActionParamForm';

const ERROR_KEYS = [
  'untrusted_host',
  'not_https',
  'timeout',
  'invalid_response',
  'http_error',
  'cross_host_redirect',
  'oversize_response',
] as const;

type KnownErrorCode = (typeof ERROR_KEYS)[number];

function errorCodeToI18nKey(code: string | undefined): string {
  if (code && (ERROR_KEYS as readonly string[]).includes(code)) {
    return `blinks.detail.error.${code as KnownErrorCode}`;
  }
  return 'blinks.detail.error.generic';
}

type ActionMetadata = blinks.spec.ActionGetResponse;

export default function BlinkDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ host?: string; path?: string }>();
  const host = params.host ?? '';
  const path = params.path ?? '/';

  const [data, setData] = useState<ActionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const url = `https://${host}${path.startsWith('/') ? path : `/${path}`}`;
    setLoading(true);
    setErrorCode(null);
    blinks.client
      .fetchActionMetadata(url)
      .then((res) => {
        if (cancelled) return;
        setData(res as ActionMetadata);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code: unknown }).code)
            : 'generic';
        setErrorCode(code);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [host, path]);

  const action = data?.links?.actions?.[0];
  const parameters = useMemo<ActionParamFormParameter[]>(
    () => (action?.parameters ?? []) as ActionParamFormParameter[],
    [action],
  );

  const validation = useMemo(
    () => validateParameters(parameters, values),
    [parameters, values],
  );

  const continueDisabled = loading || !data || !validation.isValid;

  const handleContinue = () => {
    if (continueDisabled || !data || !action) return;
    const payload = {
      path,
      action: {
        href: action.href,
        label: action.label,
      },
      values,
    };
    router.push({
      pathname: '/blink-approval' as never,
      params: { host, data: JSON.stringify(payload) },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.text.primary} />
            <Text style={styles.loadingText}>{t('blinks.detail.loading')}</Text>
          </View>
        ) : errorCode ? (
          <View
            testID={
              errorCode === 'untrusted_host'
                ? 'blink-detail-untrusted-host-message'
                : 'blink-detail-error-banner'
            }
            style={styles.errorBanner}
            accessibilityRole="alert"
          >
            <Text style={styles.errorText}>{t(errorCodeToI18nKey(errorCode))}</Text>
          </View>
        ) : data ? (
          <>
            <View style={styles.header}>
              <Image
                testID="blink-icon"
                source={{ uri: data.icon }}
                style={styles.icon}
                resizeMode="cover"
              />
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.description}>{data.description}</Text>
            </View>
            {parameters.length > 0 ? (
              <View style={styles.formContainer}>
                <ActionParamForm
                  parameters={parameters}
                  value={values}
                  onChange={setValues}
                />
              </View>
            ) : null}
            <TouchableOpacity
              testID="blink-detail-continue"
              accessibilityRole="button"
              accessibilityState={{ disabled: continueDisabled }}
              disabled={continueDisabled}
              onPress={handleContinue}
              style={[
                styles.continueButton,
                continueDisabled && styles.continueButtonDisabled,
              ]}
            >
              <Text style={styles.continueText}>
                {action?.label ?? t('blinks.detail.continue')}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingVertical: vs(spacing.xl),
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(48),
  },
  loadingText: {
    marginTop: vs(spacing.md),
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.md),
    color: colors.text.muted,
  },
  errorBanner: {
    backgroundColor: colors.status.errorBackground,
    borderColor: colors.status.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: s(spacing.md),
  },
  errorText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.md),
    color: colors.status.error,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: vs(spacing.xl),
  },
  icon: {
    width: ms(96),
    height: ms(96),
    borderRadius: 16,
    marginBottom: vs(spacing.md),
    backgroundColor: colors.border.subtle,
  },
  title: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.xl),
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: letterSpacing.wide,
    marginBottom: vs(spacing.sm),
  },
  description: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.md),
    color: colors.text.muted,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: vs(spacing.xl),
  },
  continueButton: {
    backgroundColor: colors.button.primaryBackground,
    paddingVertical: vs(spacing.md),
    borderRadius: 24,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  continueText: {
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize.md),
    color: colors.button.primaryText,
    letterSpacing: letterSpacing.widest,
  },
});
