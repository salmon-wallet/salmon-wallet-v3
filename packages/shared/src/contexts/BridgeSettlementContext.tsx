/**
 * BridgeSettlementContext - background settlement for cross-chain (StealthEX)
 * bridge exchanges.
 *
 * Unlike same-chain actions (send, Jupiter swap, NFT) — which settle in ~12-14s
 * and can dwell behind a success screen via `useSettleUntilChanged` — a bridge
 * exchange settles in MINUTES: StealthEX waits for source confirmations, runs
 * the swap, and pays out on the destination chain. Blocking a screen for that
 * long is unacceptable, so the success screen returns the user immediately and
 * this provider polls the exchange status in the background (surviving
 * navigation, since it mounts at the app root). When StealthEX reports
 * completion it settles the destination balance; on failure/refund it settles
 * the source.
 *
 * In-memory only: a bridge that outlives the session is not resumed after an
 * app restart (a persistence layer would be a follow-up). The user can still
 * see the result via refetch-on-focus / manual refresh once they reopen.
 *
 * @module contexts/BridgeSettlementContext
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NetworkId } from '../types/blockchain';
import type { BridgeTransaction } from '../types/bridge';
import { getBridgeTransaction } from '../api/services/bridge';
import { useSettleAfterTx } from '../query/invalidation';

export interface PendingBridgeExchange {
  /** StealthEX exchange id — used to poll status. */
  id: string;
  /** Chain the deposit left from (settled when the exchange completes/refunds). */
  sourceNetworkId?: NetworkId;
  sourceAccountId?: string;
  /** Chain the payout arrives on (settled when the exchange completes). */
  destNetworkId?: NetworkId;
  destAccountId?: string;
}

interface BridgeSettlementContextValue {
  /**
   * Start tracking a freshly created exchange. Its balances are settled in the
   * background when StealthEX reports completion (destination) or failure/
   * refund (source). Idempotent per exchange id.
   */
  trackBridgeExchange: (exchange: PendingBridgeExchange) => void;
  /** Exchanges currently being polled. */
  pendingExchanges: PendingBridgeExchange[];
}

const BridgeSettlementContext = createContext<BridgeSettlementContextValue | null>(null);

// StealthEX exchanges take minutes; a coarse cadence is plenty and keeps the
// status endpoint from being hammered.
const DEFAULT_BRIDGE_POLL_INTERVAL_MS = 20_000;

export interface BridgeSettlementProviderProps {
  children: React.ReactNode;
  /** Injectable for tests; defaults to the salmon-api bridge status endpoint. */
  getStatus?: (id: string) => Promise<BridgeTransaction | null>;
  /** Poll cadence in ms. */
  pollIntervalMs?: number;
}

export function BridgeSettlementProvider({
  children,
  getStatus = getBridgeTransaction,
  pollIntervalMs = DEFAULT_BRIDGE_POLL_INTERVAL_MS,
}: BridgeSettlementProviderProps): React.ReactElement {
  const [pendingExchanges, setPendingExchanges] = useState<PendingBridgeExchange[]>([]);
  const settleAfterTx = useSettleAfterTx();
  const pendingRef = useRef<PendingBridgeExchange[]>([]);
  pendingRef.current = pendingExchanges;

  const trackBridgeExchange = useCallback((exchange: PendingBridgeExchange) => {
    setPendingExchanges((prev) =>
      prev.some((p) => p.id === exchange.id) ? prev : [...prev, exchange],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setPendingExchanges((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    if (pendingExchanges.length === 0) return undefined;
    let cancelled = false;

    const poll = async () => {
      // Snapshot so removals mid-loop don't skip entries.
      for (const ex of [...pendingRef.current]) {
        let tx: BridgeTransaction | null = null;
        try {
          tx = await getStatus(ex.id);
        } catch (err) {
          console.warn('[BridgeSettlement] status poll failed:', err);
          continue;
        }
        if (cancelled || !tx) continue;

        if (tx.status === 'success') {
          // Payout landed on the destination chain, whose indexer still lags —
          // use the delayed settle schedule there. The source deposit is long
          // since spent, so settle it immediately (no delays).
          await settleAfterTx({
            networkId: ex.destNetworkId,
            accountId: ex.destAccountId,
            kinds: ['balance', 'transactions'],
          }).catch(() => undefined);
          if (ex.sourceNetworkId || ex.sourceAccountId) {
            await settleAfterTx({
              networkId: ex.sourceNetworkId,
              accountId: ex.sourceAccountId,
              kinds: ['balance', 'transactions'],
              settlementDelaysMs: [],
            }).catch(() => undefined);
          }
          remove(ex.id);
        } else if (tx.status === 'fail' || tx.status === 'refunded') {
          // Funds returned on the source side.
          await settleAfterTx({
            networkId: ex.sourceNetworkId,
            accountId: ex.sourceAccountId,
            kinds: ['balance', 'transactions'],
          }).catch(() => undefined);
          remove(ex.id);
        }
        // 'inProgress' / 'unknown' -> keep polling.
      }
    };

    const interval = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingExchanges.length, pollIntervalMs, getStatus, settleAfterTx, remove]);

  const value = useMemo(
    () => ({ trackBridgeExchange, pendingExchanges }),
    [trackBridgeExchange, pendingExchanges],
  );

  return (
    <BridgeSettlementContext.Provider value={value}>{children}</BridgeSettlementContext.Provider>
  );
}

export function useBridgeSettlement(): BridgeSettlementContextValue {
  const ctx = useContext(BridgeSettlementContext);
  if (!ctx) {
    throw new Error('useBridgeSettlement must be used within a BridgeSettlementProvider');
  }
  return ctx;
}
