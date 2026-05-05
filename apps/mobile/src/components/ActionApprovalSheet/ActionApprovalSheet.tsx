/**
 * ActionApprovalSheet — pre-sign approval UI for Solana Actions / Blinks.
 *
 * Risk gates (do not relax without re-running the threat model):
 *   R2 — every Action transaction is simulated BEFORE the user can approve.
 *        Balance deltas are surfaced. If simulation errored, Approve is
 *        disabled by default; the user must explicitly toggle a "I understand
 *        the risk" affordance to re-enable it. Blind-approval reflex is the
 *        primary attacker payoff — this toggle is the chokepoint.
 *   R8 — partial-signed transactions surface a yellow banner so the user is
 *        aware existing signatures are present. The screen route owning this
 *        sheet must NOT mutate `feePayer` / `recentBlockhash` for partial-
 *        signed txs (enforced by the route + simulator).
 */
import {
  colors,
  fontFamilyNative,
  fontSize,
  letterSpacing,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const LAMPORTS_PER_SOL = 1_000_000_000n;

export interface ActionApprovalMetadata {
  icon: string;
  title: string;
  description: string;
  host: string;
}

export interface ActionApprovalTransaction {
  serializedBase64: string;
  message?: string;
}

export interface ActionApprovalTokenDelta {
  mint: string;
  owner: string;
  uiAmountBefore: string | null;
  uiAmountAfter: string | null;
  rawAmountDelta: bigint;
  decimals: number | null;
}

export interface ActionApprovalSimulation {
  signerBalanceDelta: {
    lamportsBefore: bigint;
    lamportsAfter: bigint;
    lamportsDelta: bigint;
  };
  tokenDeltas: ActionApprovalTokenDelta[];
  computeUnitsConsumed: number | null;
  logs: string[];
  warning?: string;
}

export interface ActionApprovalSimulationError {
  code: string;
  message?: string;
  logs?: string[];
}

export interface ActionApprovalSheetProps {
  loading: boolean;
  error?: { code: string; message?: string };
  metadata?: ActionApprovalMetadata;
  transaction?: ActionApprovalTransaction;
  simulation?: ActionApprovalSimulation;
  simulationError?: ActionApprovalSimulationError;
  onApprove: () => void | Promise<void>;
  onCancel: () => void;
}

function formatLamportsAsSol(lamports: bigint): string {
  const neg = lamports < 0n;
  const abs = neg ? -lamports : lamports;
  const whole = abs / LAMPORTS_PER_SOL;
  const frac = abs % LAMPORTS_PER_SOL;
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  const out = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return neg ? `-${out}` : out;
}

function shortMint(mint: string): string {
  if (mint.length <= 8) return mint;
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

function formatTokenDelta(delta: ActionApprovalTokenDelta): string {
  if (delta.uiAmountBefore != null && delta.uiAmountAfter != null) {
    const before = delta.uiAmountBefore;
    const after = delta.uiAmountAfter;
    const sign = delta.rawAmountDelta < 0n ? '-' : '+';
    return `${sign} ${before} → ${after}`;
  }
  return `Δ ${delta.rawAmountDelta.toString()}`;
}

export function ActionApprovalSheet(props: ActionApprovalSheetProps) {
  const { t } = useTranslation();
  const {
    loading,
    error,
    metadata,
    transaction,
    simulation,
    simulationError,
    onApprove,
    onCancel,
  } = props;

  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const isPartialSigned = !!simulation?.warning?.toLowerCase().includes('partial-signed');

  const approveDisabled =
    loading ||
    !!error ||
    !transaction ||
    (!!simulationError && !riskAcknowledged);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {metadata ? (
          <View style={styles.header}>
            <Image
              testID="action-icon"
              source={{ uri: metadata.icon }}
              style={styles.icon}
              resizeMode="cover"
            />
            <Text style={styles.title}>{metadata.title}</Text>
            <View style={styles.hostBadge}>
              <Text style={styles.hostText}>{metadata.host}</Text>
            </View>
            <Text style={styles.description}>{metadata.description}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>
              {t('blinks.approval.error.generic')}
            </Text>
            {error.message ? (
              <Text style={styles.errorSubText}>{error.message}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Simulation block */}
        <View style={styles.simBlock}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text.primary} />
            </View>
          ) : simulationError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorText}>
                {t('blinks.approval.simulation.failed')}
              </Text>
              {simulationError.message ? (
                <Text style={styles.errorSubText}>{simulationError.message}</Text>
              ) : null}
              {simulationError.logs && simulationError.logs.length > 0 ? (
                <Text style={styles.logsText} testID="approval-sim-logs">
                  {simulationError.logs.slice(0, 6).join('\n')}
                </Text>
              ) : null}
            </View>
          ) : simulation ? (
            <View>
              {isPartialSigned ? (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    {t('blinks.approval.partial_signed')}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.sectionLabel}>SOL</Text>
              <Text testID="sol-delta" style={styles.solDelta}>
                {formatLamportsAsSol(simulation.signerBalanceDelta.lamportsDelta)} SOL
              </Text>
              {simulation.tokenDeltas.map((delta, idx) => (
                <View
                  key={`${delta.mint}-${idx}`}
                  testID={`token-delta-${idx}`}
                  style={styles.tokenRow}
                >
                  <Text style={styles.tokenMint}>{shortMint(delta.mint)}</Text>
                  <Text style={styles.tokenAmount}>
                    {formatTokenDelta(delta)}
                  </Text>
                  {delta.decimals === null ? (
                    <Text style={styles.unknownAmount}>
                      {t('blinks.approval.simulation.unknown_amount')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {simulationError ? (
          <View style={styles.riskRow}>
            <Switch
              testID="approval-risk-toggle"
              value={riskAcknowledged}
              onValueChange={setRiskAcknowledged}
              accessibilityRole="switch"
            />
            <Text style={styles.riskText}>
              {t('blinks.approval.risk_acknowledge')}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          testID="approval-cancel"
          accessibilityRole="button"
          onPress={onCancel}
          style={[styles.button, styles.cancelButton]}
        >
          <Text style={styles.cancelText}>{t('blinks.approval.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="approval-approve"
          accessibilityRole="button"
          accessibilityState={{ disabled: approveDisabled }}
          disabled={approveDisabled}
          onPress={() => {
            void onApprove();
          }}
          style={[
            styles.button,
            styles.approveButton,
            approveDisabled && styles.approveDisabled,
          ]}
        >
          <Text style={styles.approveText}>{t('blinks.approval.approve')}</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    alignItems: 'center',
    marginBottom: vs(spacing.xl),
  },
  icon: {
    width: ms(72),
    height: ms(72),
    borderRadius: 14,
    marginBottom: vs(spacing.md),
    backgroundColor: colors.border.subtle,
  },
  title: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.xl),
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: letterSpacing.wide,
    marginBottom: vs(spacing.xs),
  },
  hostBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xs),
    borderRadius: 12,
    marginBottom: vs(spacing.sm),
  },
  hostText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.muted,
  },
  description: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.md),
    color: colors.text.muted,
    textAlign: 'center',
  },
  simBlock: {
    marginBottom: vs(spacing.lg),
  },
  sectionLabel: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.muted,
    marginBottom: vs(spacing.xs),
  },
  solDelta: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.lg),
    color: colors.text.primary,
    marginBottom: vs(spacing.md),
  },
  tokenRow: {
    paddingVertical: vs(spacing.xs),
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
  },
  tokenMint: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.muted,
  },
  tokenAmount: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.md),
    color: colors.text.primary,
  },
  unknownAmount: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.sm),
    color: colors.status.warning,
    marginTop: vs(spacing.xs),
  },
  errorBanner: {
    backgroundColor: colors.status.errorBackground,
    borderColor: colors.status.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: s(spacing.md),
    marginBottom: vs(spacing.md),
  },
  errorText: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.md),
    color: colors.status.error,
  },
  errorSubText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.sm),
    color: colors.status.error,
    marginTop: vs(spacing.xs),
  },
  logsText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.sm),
    color: colors.text.muted,
    marginTop: vs(spacing.xs),
  },
  warningBanner: {
    backgroundColor: colors.status.warningBackground,
    borderColor: colors.status.warning,
    borderWidth: 1,
    borderRadius: 12,
    padding: s(spacing.md),
    marginBottom: vs(spacing.md),
  },
  warningText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.status.warning,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(spacing.md),
  },
  riskText: {
    flex: 1,
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.text.primary,
    marginLeft: s(spacing.sm),
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: s(spacing.headerPadding),
    paddingVertical: vs(spacing.md),
    gap: s(spacing.sm),
  },
  button: {
    flex: 1,
    paddingVertical: vs(spacing.md),
    borderRadius: 24,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
  },
  cancelText: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.md),
    color: colors.text.primary,
    letterSpacing: letterSpacing.widest,
  },
  approveButton: {
    backgroundColor: colors.button.primaryBackground,
  },
  approveDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  approveText: {
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize.md),
    color: colors.button.primaryText,
    letterSpacing: letterSpacing.widest,
  },
});
