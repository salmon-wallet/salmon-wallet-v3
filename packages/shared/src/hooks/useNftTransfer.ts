/**
 * useNftTransfer Hook
 *
 * Shared hook for multi-chain NFT transfers.
 * Routes to the appropriate blockchain transfer service (Solana, Ethereum)
 * based on the NFT's blockchain field.
 *
 * - Solana: uses createTransfer (SPL token transfer with amount=1)
 * - Ethereum: uses sendTransaction with ERC721/ERC1155 token type
 * - Bitcoin: not supported (ordinal transfers require special UTXO selection)
 */

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { isSolanaAccount, isEthereumAccount } from '../utils/account';
import type { EthereumAccount } from '../blockchain/ethereum';
import { createTransfer as solanaCreateTransfer } from '../blockchain/solana/transfer';
import { sendTransaction as ethSendTransaction } from '../blockchain/ethereum/transfer';
import { createERC721Token, createERC1155Token } from '../utils/tokens';
import type { BlockchainAccount } from '../types/blockchain';
import type {
  NftData,
  SolanaNftData,
  EthereumNftData,
} from '../utils/nft';

export type NftTransferStatus = 'idle' | 'sending' | 'success' | 'failed';

export interface UseNftTransferParams {
  account: BlockchainAccount | undefined;
}

export interface UseNftTransferResult {
  sendNft: (nft: NftData, recipientAddress: string) => Promise<{ txId: string }>;
  status: NftTransferStatus;
  error: string | null;
  reset: () => void;
}

export function useNftTransfer({ account }: UseNftTransferParams): UseNftTransferResult {
  const [status, setStatus] = useState<NftTransferStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const sendSolanaNft = useCallback(
    async (nft: SolanaNftData, recipientAddress: string): Promise<{ txId: string }> => {
      if (!account || !isSolanaAccount(account)) {
        throw new Error('Solana account not available');
      }

      const connection = await account.getConnection();
      const result = await solanaCreateTransfer(
        connection,
        account.keyPair,
        new PublicKey(recipientAddress),
        nft.mint,
        1, // NFTs have amount = 1
      );

      return { txId: result.txId as string };
    },
    [account],
  );

  const sendEthereumNft = useCallback(
    async (nft: EthereumNftData, recipientAddress: string): Promise<{ txId: string }> => {
      if (!account || !isEthereumAccount(account)) {
        throw new Error('Ethereum account not available');
      }

      const ethAccount = account as EthereumAccount;
      const wallet = await ethAccount.getConnection();

      const transferToken = nft.tokenType === 'ERC1155'
        ? createERC1155Token(nft.contractAddress, nft.symbol)
        : createERC721Token(nft.contractAddress, nft.symbol);

      const result = await ethSendTransaction(
        wallet,
        recipientAddress,
        transferToken,
        1,
        { tokenId: nft.tokenId },
      );

      return { txId: result.txHash };
    },
    [account],
  );

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
          result = await sendSolanaNft(nft as SolanaNftData, recipientAddress);
        } else if (nft.blockchain === 'ethereum') {
          result = await sendEthereumNft(nft as EthereumNftData, recipientAddress);
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
        return result;
      } catch (err) {
        console.error('[useNftTransfer] Transfer failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'NFT transfer failed';
        setError(errorMessage);
        setStatus('failed');
        throw err;
      }
    },
    [account, sendSolanaNft, sendEthereumNft],
  );

  return { sendNft, status, error, reset };
}

export default useNftTransfer;
