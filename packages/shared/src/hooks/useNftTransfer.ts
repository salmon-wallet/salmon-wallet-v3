/**
 * useNftTransfer Hook
 *
 * Shared hook for multi-chain NFT transfers.
 * Delegates to the account's transfer() method, which internally routes
 * to the appropriate blockchain transfer service.
 *
 * - Solana: transfers SPL token with amount=1 via account.transfer()
 * - Bitcoin: not supported (ordinal transfers require special UTXO selection)
 */

import { useState, useCallback } from 'react';
import type { BlockchainAccount } from '../types/blockchain';
import type {
  NftData,
  SolanaNftData,
} from '../utils/nft';
import { useInvalidateAfterTx } from '../query/invalidation';

export type NftTransferStatus = 'idle' | 'sending' | 'success' | 'failed';

export interface UseNftTransferParams {
  account: BlockchainAccount | undefined;
  /**
   * Optional callback fired after a transfer completes successfully. Consumers
   * should wire this to refetch the NFT list so the UI does not display the
   * sent NFT until the indexer (Helius DAS, ~10–30s) catches up. Without a
   * refetch, the list will look stale right after the user confirms the send.
   */
  onTransferSuccess?: (nft: NftData, txId: string) => void;
}

export interface UseNftTransferResult {
  sendNft: (nft: NftData, recipientAddress: string) => Promise<{ txId: string }>;
  status: NftTransferStatus;
  error: string | null;
  isError: boolean;
  reset: () => void;
}

export function useNftTransfer({ account, onTransferSuccess }: UseNftTransferParams): UseNftTransferResult {
  const [status, setStatus] = useState<NftTransferStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const invalidateAfterTx = useInvalidateAfterTx();

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const sendNft = useCallback(
    async (nft: NftData, recipientAddress: string): Promise<{ txId: string }> => {
      if (!account) {
        throw new Error('No account available');
      }

      setStatus('sending');
      setError(null);

      try {
        let result: { txId: string };

        if (nft.blockchain === 'solana') {
          const solanaNft = nft as SolanaNftData;
          result = await account.transfer(recipientAddress, solanaNft.mint, 1);
        } else {
          // TODO: Bitcoin ordinal transfers require inscription-aware UTXO selection.
          // QuickNode's Ordinals & Runes API provides ord_getOutput(txid:vout) which
          // returns the inscriptions[] in each UTXO — the missing piece to identify
          // which UTXOs are safe to spend for fees vs which carry the inscription.
          // Implementation path: bb_getUTXOs → ord_getOutput per UTXO → build PSBT
          // with bitcoinjs-lib → sign with BIP32 key → sendrawtransaction.
          // See: https://marketplace.quicknode.com/add-on/ordinals-json-rpc-api
          throw new Error('Ordinal transfers are not yet supported');
        }

        setStatus('success');
        const accountId = account.getReceiveAddress();
        const networkId = account.getNetworkId();
        invalidateAfterTx({
          accountId,
          networkId,
          kinds: ['balance', 'transactions', 'nfts', 'avatar-nfts'],
        }).catch(() => undefined);
        onTransferSuccess?.(nft, result.txId);
        return result;
      } catch (err) {
        console.error('[useNftTransfer] Transfer failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'NFT transfer failed';
        setError(errorMessage);
        setStatus('failed');
        throw err;
      }
    },
    [account, onTransferSuccess, invalidateAfterTx],
  );

  return { sendNft, status, error, isError: error !== null, reset };
}
