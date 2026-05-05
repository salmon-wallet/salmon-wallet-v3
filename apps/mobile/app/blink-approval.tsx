/**
 * BlinkApprovalScreen — final approval surface for Solana Actions / Blinks.
 *
 * Flow:
 *   1. Read host + serialized payload params from BlinkDetail.
 *   2. POST to the Action endpoint via shared `requestActionTransaction` to
 *      obtain a serialized transaction (registry + HTTPS guards already
 *      enforced at the client layer).
 *   3. Simulate the tx via shared `simulateActionTx` and surface deltas.
 *   4. Render `<ActionApprovalSheet />` with metadata + simulation result.
 *   5. On Approve, run the sign+submit pipeline through
 *      `signAndSubmitActionTransaction` (split into a sibling module so this
 *      route is testable without `@solana/web3.js`).
 *
 * Risk gates:
 *   R2 — every tx is simulated before approval. Sim error gates Approve
 *        behind an explicit "I understand the risk" toggle.
 *   R8 — partial-signed txs flow through the sign helper with
 *        `partialSigned: true`; helper does NOT mutate feePayer /
 *        recentBlockhash in that branch.
 */
import {
  blinks,
  colors,
  fontFamilyNative,
  fontSize,
  ms,
  s,
  spacing,
  useAccountsContext,
  vs,
} from '@salmon/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  ActionApprovalSheet,
  type ActionApprovalSimulation,
  type ActionApprovalSimulationError,
} from '../src/components/ActionApprovalSheet';
import {
  inspectTransactionSigStatus,
  signAndSubmitActionTransaction,
} from './blink-approval-sign';

interface BlinkApprovalPayload {
  path?: string;
  action?: { href?: string; label?: string };
  values?: Record<string, string>;
}

function substituteHref(href: string, values: Record<string, string>): string {
  return href.replace(/\{([^}]+)\}/g, (_match, name) => {
    const v = values[name];
    return v != null ? encodeURIComponent(v) : `{${name}}`;
  });
}

function partitionDataValues(
  href: string,
  values: Record<string, string>,
): Record<string, string> {
  const used = new Set<string>();
  href.replace(/\{([^}]+)\}/g, (_m, name) => {
    used.add(name);
    return '';
  });
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!used.has(k)) out[k] = v;
  }
  return out;
}

export default function BlinkApprovalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ host?: string; data?: string }>();
  const host = params.host ?? '';

  const [accountState] = useAccountsContext() as unknown as [
    { activeBlockchainAccount?: any },
    unknown,
  ];
  const account = accountState.activeBlockchainAccount;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message?: string } | null>(null);
  const [transaction, setTransaction] =
    useState<{ serializedBase64: string; message?: string } | null>(null);
  const [simulation, setSimulation] = useState<ActionApprovalSimulation | null>(null);
  const [simulationError, setSimulationError] = useState<ActionApprovalSimulationError | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let payload: BlinkApprovalPayload = {};
    try {
      payload = params.data ? (JSON.parse(params.data) as BlinkApprovalPayload) : {};
    } catch {
      payload = {};
    }
    const href = payload.action?.href ?? payload.path ?? '/';
    const values = payload.values ?? {};
    const finalPath = substituteHref(href, values);
    const url = `https://${host}${finalPath.startsWith('/') ? finalPath : `/${finalPath}`}`;
    const data = partitionDataValues(href, values);

    async function run() {
      if (!account) {
        if (!cancelled) {
          setError({ code: 'no_account' });
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError(null);
      setSimulationError(null);
      try {
        const res = await blinks.client.requestActionTransaction({
          url,
          account: account.getReceiveAddress(),
          data: Object.keys(data).length > 0 ? data : undefined,
        });
        if (cancelled) return;
        // Action POST union — only the `transaction` branch carries a tx body.
        // Other branches (e.g. `post` follow-up) are not yet supported here.
        if (!('transaction' in res) || typeof res.transaction !== 'string') {
          setError({ code: 'invalid_response' });
          setLoading(false);
          return;
        }
        const b64 = res.transaction;
        setTransaction({ serializedBase64: b64, message: res.message });
        // Simulate next.
        try {
          const connection = await account.getConnection();
          const sim = await blinks.simulate.simulateActionTx({
            serializedTransactionBase64: b64,
            account: account.getReceiveAddress(),
            connection,
          });
          if (cancelled) return;
          setSimulation(sim as ActionApprovalSimulation);
        } catch (simErr: unknown) {
          if (cancelled) return;
          const code =
            simErr && typeof simErr === 'object' && 'code' in simErr
              ? String((simErr as { code: unknown }).code)
              : 'simulation_failed';
          const logs =
            simErr && typeof simErr === 'object' && 'logs' in simErr
              ? ((simErr as { logs?: string[] }).logs ?? undefined)
              : undefined;
          const message =
            simErr instanceof Error ? simErr.message : undefined;
          setSimulationError({ code, message, logs });
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const code =
          e && typeof e === 'object' && 'code' in e
            ? String((e as { code: unknown }).code)
            : 'generic';
        const message = e instanceof Error ? e.message : undefined;
        setError({ code, message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [host, params.data, account]);

  const handleApprove = async () => {
    if (!transaction || !account || submitting) return;
    setSubmitting(true);
    try {
      const connection = await account.getConnection();
      const status = inspectTransactionSigStatus(transaction.serializedBase64);
      const res = await signAndSubmitActionTransaction({
        serializedTransactionBase64: transaction.serializedBase64,
        account,
        connection,
        partialSigned: status.partialSigned,
      });
      router.replace({
        pathname: '/blink-success' as never,
        params: { signature: res.signature, host },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'submit_failed';
      setError({ code: 'submit_failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!account) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color={colors.text.primary} />
        <Text style={styles.fallbackText}>{t('blinks.approval.loading')}</Text>
      </View>
    );
  }

  return (
    <ActionApprovalSheet
      loading={loading || submitting}
      error={error ?? undefined}
      metadata={
        host
          ? {
              icon: '',
              title: t('blinks.approval.title'),
              description: transaction?.message ?? '',
              host,
            }
          : undefined
      }
      transaction={transaction ?? undefined}
      simulation={simulation ?? undefined}
      simulationError={simulationError ?? undefined}
      onApprove={handleApprove}
      onCancel={handleCancel}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  fallbackText: {
    marginTop: vs(spacing.md),
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.md),
    color: colors.text.muted,
    paddingHorizontal: s(spacing.md),
  },
});
