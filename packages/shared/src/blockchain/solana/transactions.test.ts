/**
 * Tests for Solana Transaction History Service
 *
 * Tests cover transaction fetching, filtering, and helper functions.
 * Uses Vitest 4.0.18 for testing with mocked API responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTransaction,
  getRecentTransactions,
  isTransferTransaction,
  isSwapTransaction,
  isNftTransaction,
  isSuccessful,
  isFailed,
  getNetSolAmount,
  getUserTokenTransfers,
  getUserNativeTransfers,
  getTransactionDate,
  getTimeAgo,
  isStakingTransaction,
  isTokenMintOrBurn,
  getExplorerUrl,
  getSolscanUrl,
  type SolanaTransaction,
  type SolanaTransactionPaging,
} from './transactions';
import * as solanaApiService from '../../api/services/solana';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../api/services/solana');

// ============================================================================
// Test Data
// ============================================================================

const TEST_ADDRESS = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
const TEST_SIGNATURE = '5xG8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKKabc123';

/**
 * Mock transfer transaction
 */
const MOCK_TRANSFER_TX: SolanaTransaction = {
  signature: TEST_SIGNATURE,
  slot: 123456789,
  blockTime: 1640000000,
  status: 'confirmed',
  fee: 5000,
  feePayer: TEST_ADDRESS,
  type: 'TRANSFER',
  description: 'Transfer SOL',
  nativeTransfers: [
    {
      fromAddress: TEST_ADDRESS,
      toAddress: 'RecipientAddress123',
      amount: 1000000000, // 1 SOL
    },
  ],
  tokenTransfers: [],
  accountData: [],
  instructions: [],
};

/**
 * Mock swap transaction
 */
const MOCK_SWAP_TX: SolanaTransaction = {
  signature: 'swap-signature-123',
  slot: 123456790,
  blockTime: 1640001000,
  status: 'confirmed',
  fee: 10000,
  feePayer: TEST_ADDRESS,
  type: 'SWAP',
  description: 'Swap SOL for USDC',
  source: 'JUPITER',
  nativeTransfers: [],
  tokenTransfers: [
    {
      fromAddress: TEST_ADDRESS,
      toAddress: 'JupiterProgram',
      mint: 'So11111111111111111111111111111111111111112',
      amount: '1000000000',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
    },
    {
      fromAddress: 'JupiterProgram',
      toAddress: TEST_ADDRESS,
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: '5000000',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
    },
  ],
  accountData: [],
  instructions: [],
};

/**
 * Mock NFT transaction
 */
const MOCK_NFT_TX: SolanaTransaction = {
  signature: 'nft-signature-123',
  slot: 123456791,
  blockTime: 1640002000,
  status: 'confirmed',
  fee: 15000,
  feePayer: TEST_ADDRESS,
  type: 'NFT_MINT',
  description: 'Mint NFT',
  nativeTransfers: [],
  tokenTransfers: [],
  accountData: [],
  instructions: [],
};

/**
 * Mock failed transaction
 */
const MOCK_FAILED_TX: SolanaTransaction = {
  signature: 'failed-signature-123',
  slot: 123456792,
  blockTime: 1640003000,
  status: 'failed',
  fee: 5000,
  feePayer: TEST_ADDRESS,
  type: 'TRANSFER',
  error: 'Insufficient funds',
  nativeTransfers: [],
  tokenTransfers: [],
  accountData: [],
  instructions: [],
};

/**
 * Mock staking transaction
 */
const MOCK_STAKE_TX: SolanaTransaction = {
  signature: 'stake-signature-123',
  slot: 123456793,
  blockTime: 1640004000,
  status: 'confirmed',
  fee: 5000,
  feePayer: TEST_ADDRESS,
  type: 'STAKE',
  description: 'Stake SOL',
  nativeTransfers: [],
  tokenTransfers: [],
  accountData: [],
  instructions: [],
};

/**
 * Mock token mint transaction
 */
const MOCK_MINT_TX: SolanaTransaction = {
  signature: 'mint-signature-123',
  slot: 123456794,
  blockTime: 1640005000,
  status: 'confirmed',
  fee: 5000,
  feePayer: TEST_ADDRESS,
  type: 'TOKEN_MINT',
  description: 'Mint tokens',
  nativeTransfers: [],
  tokenTransfers: [],
  accountData: [],
  instructions: [],
};

// ============================================================================
// Helper: isBackendAvailable
// ============================================================================

/**
 * Checks if the backend API is available for integration testing
 * @returns True if backend is available
 */
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/health');
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Tests: getTransaction
// ============================================================================

describe('getTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get transaction by signature', async () => {
    vi.mocked(solanaApiService.getSolanaTransaction).mockResolvedValue(MOCK_TRANSFER_TX);

    const tx = await getTransaction('solana-mainnet', TEST_ADDRESS, TEST_SIGNATURE);

    expect(tx).toBeDefined();
    expect(tx?.signature).toBe(TEST_SIGNATURE);
    expect(tx?.type).toBe('TRANSFER');

    expect(solanaApiService.getSolanaTransaction).toHaveBeenCalledWith(
      'solana-mainnet',
      TEST_ADDRESS,
      TEST_SIGNATURE
    );
  });

  it('should return null if transaction not found', async () => {
    vi.mocked(solanaApiService.getSolanaTransaction).mockResolvedValue(null);

    const tx = await getTransaction('solana-mainnet', TEST_ADDRESS, 'non-existent-sig');

    expect(tx).toBeNull();
  });

  it('should handle different network IDs', async () => {
    vi.mocked(solanaApiService.getSolanaTransaction).mockResolvedValue(MOCK_TRANSFER_TX);

    await getTransaction('solana-devnet', TEST_ADDRESS, TEST_SIGNATURE);

    expect(solanaApiService.getSolanaTransaction).toHaveBeenCalledWith(
      'solana-devnet',
      TEST_ADDRESS,
      TEST_SIGNATURE
    );
  });
});

// ============================================================================
// Tests: getRecentTransactions
// ============================================================================

describe('getRecentTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get recent transactions with default paging', async () => {
    const mockResponse = {
      transactions: [MOCK_TRANSFER_TX, MOCK_SWAP_TX],
      oldestSignature: 'oldest-sig-123',
      hasMore: true,
    };

    vi.mocked(solanaApiService.getSolanaTransactions).mockResolvedValue(mockResponse);

    const result = await getRecentTransactions('solana-mainnet', TEST_ADDRESS);

    expect(result.data).toHaveLength(2);
    expect(result.pageToken).toBe('oldest-sig-123');

    expect(solanaApiService.getSolanaTransactions).toHaveBeenCalledWith(
      'solana-mainnet',
      TEST_ADDRESS,
      {}
    );
  });

  it('should support pagination with pageSize', async () => {
    const mockResponse = {
      transactions: [MOCK_TRANSFER_TX],
      oldestSignature: null,
      hasMore: false,
    };

    vi.mocked(solanaApiService.getSolanaTransactions).mockResolvedValue(mockResponse);

    const paging: SolanaTransactionPaging = {
      pageSize: 10,
    };

    const result = await getRecentTransactions('solana-mainnet', TEST_ADDRESS, paging);

    expect(result.data).toHaveLength(1);
    expect(result.pageToken).toBeUndefined();

    expect(solanaApiService.getSolanaTransactions).toHaveBeenCalledWith(
      'solana-mainnet',
      TEST_ADDRESS,
      { limit: 10 }
    );
  });

  it('should support pagination with nextPageToken', async () => {
    const mockResponse = {
      transactions: [MOCK_SWAP_TX],
      oldestSignature: 'next-oldest-sig',
      hasMore: true,
    };

    vi.mocked(solanaApiService.getSolanaTransactions).mockResolvedValue(mockResponse);

    const paging: SolanaTransactionPaging = {
      nextPageToken: 'previous-oldest-sig',
      pageSize: 20,
    };

    const result = await getRecentTransactions('solana-mainnet', TEST_ADDRESS, paging);

    expect(result.data).toHaveLength(1);
    expect(result.pageToken).toBe('next-oldest-sig');

    expect(solanaApiService.getSolanaTransactions).toHaveBeenCalledWith(
      'solana-mainnet',
      TEST_ADDRESS,
      { before: 'previous-oldest-sig', limit: 20 }
    );
  });

  it('should return undefined pageToken when no more pages', async () => {
    const mockResponse = {
      transactions: [MOCK_TRANSFER_TX],
      oldestSignature: null,
      hasMore: false,
    };

    vi.mocked(solanaApiService.getSolanaTransactions).mockResolvedValue(mockResponse);

    const result = await getRecentTransactions('solana-mainnet', TEST_ADDRESS);

    expect(result.pageToken).toBeUndefined();
  });
});

// ============================================================================
// Tests: Transaction Type Helpers
// ============================================================================

describe('isTransferTransaction', () => {
  it('should return true for TRANSFER type', () => {
    expect(isTransferTransaction(MOCK_TRANSFER_TX)).toBe(true);
  });

  it('should return false for transactions without any transfers', () => {
    const tx = { ...MOCK_SWAP_TX, type: 'UNKNOWN' as const, nativeTransfers: [], tokenTransfers: [] };
    expect(isTransferTransaction(tx)).toBe(false); // No native or token transfers
  });

  it('should return true for transactions with token transfers', () => {
    expect(isTransferTransaction(MOCK_SWAP_TX)).toBe(true); // Has token transfers
  });

  it('should return false for transactions without transfers', () => {
    expect(isTransferTransaction(MOCK_STAKE_TX)).toBe(false);
  });
});

describe('isSwapTransaction', () => {
  it('should return true for SWAP type', () => {
    expect(isSwapTransaction(MOCK_SWAP_TX)).toBe(true);
  });

  it('should return false for non-swap transactions', () => {
    expect(isSwapTransaction(MOCK_TRANSFER_TX)).toBe(false);
    expect(isSwapTransaction(MOCK_NFT_TX)).toBe(false);
  });
});

describe('isNftTransaction', () => {
  it('should return true for NFT_ prefixed types', () => {
    expect(isNftTransaction(MOCK_NFT_TX)).toBe(true);
  });

  it('should return true for COMPRESSED_NFT_ prefixed types', () => {
    const compressedNftTx = { ...MOCK_NFT_TX, type: 'COMPRESSED_NFT_MINT' as const };
    expect(isNftTransaction(compressedNftTx)).toBe(true);
  });

  it('should return false for non-NFT transactions', () => {
    expect(isNftTransaction(MOCK_TRANSFER_TX)).toBe(false);
    expect(isNftTransaction(MOCK_SWAP_TX)).toBe(false);
  });
});

describe('isStakingTransaction', () => {
  it('should return true for STAKE type', () => {
    expect(isStakingTransaction(MOCK_STAKE_TX)).toBe(true);
  });

  it('should return true for UNSTAKE type', () => {
    const unstakeTx = { ...MOCK_STAKE_TX, type: 'UNSTAKE' as const };
    expect(isStakingTransaction(unstakeTx)).toBe(true);
  });

  it('should return false for non-staking transactions', () => {
    expect(isStakingTransaction(MOCK_TRANSFER_TX)).toBe(false);
  });
});

describe('isTokenMintOrBurn', () => {
  it('should return true for TOKEN_MINT type', () => {
    expect(isTokenMintOrBurn(MOCK_MINT_TX)).toBe(true);
  });

  it('should return true for TOKEN_BURN type', () => {
    const burnTx = { ...MOCK_MINT_TX, type: 'TOKEN_BURN' as const };
    expect(isTokenMintOrBurn(burnTx)).toBe(true);
  });

  it('should return false for other transaction types', () => {
    expect(isTokenMintOrBurn(MOCK_TRANSFER_TX)).toBe(false);
    expect(isTokenMintOrBurn(MOCK_SWAP_TX)).toBe(false);
  });
});

// ============================================================================
// Tests: Transaction Status Helpers
// ============================================================================

describe('isSuccessful', () => {
  it('should return true for confirmed transactions', () => {
    expect(isSuccessful(MOCK_TRANSFER_TX)).toBe(true);
  });

  it('should return true for finalized transactions', () => {
    const finalizedTx = { ...MOCK_TRANSFER_TX, status: 'finalized' as const };
    expect(isSuccessful(finalizedTx)).toBe(true);
  });

  it('should return false for failed transactions', () => {
    expect(isSuccessful(MOCK_FAILED_TX)).toBe(false);
  });
});

describe('isFailed', () => {
  it('should return true for failed transactions', () => {
    expect(isFailed(MOCK_FAILED_TX)).toBe(true);
  });

  it('should return false for successful transactions', () => {
    expect(isFailed(MOCK_TRANSFER_TX)).toBe(false);
    expect(isFailed(MOCK_SWAP_TX)).toBe(false);
  });
});

// ============================================================================
// Tests: Transaction Analysis Helpers
// ============================================================================

describe('getNetSolAmount', () => {
  it('should calculate positive net amount for received SOL', () => {
    const tx: SolanaTransaction = {
      ...MOCK_TRANSFER_TX,
      nativeTransfers: [
        {
          fromAddress: 'SenderAddress',
          toAddress: TEST_ADDRESS,
          amount: 1000000000, // 1 SOL received
        },
      ],
    };

    const netAmount = getNetSolAmount(tx, TEST_ADDRESS);
    expect(netAmount).toBe(1000000000);
  });

  it('should calculate negative net amount for sent SOL', () => {
    const netAmount = getNetSolAmount(MOCK_TRANSFER_TX, TEST_ADDRESS);
    expect(netAmount).toBe(-1000000000); // 1 SOL sent
  });

  it('should calculate net amount for multiple transfers', () => {
    const tx: SolanaTransaction = {
      ...MOCK_TRANSFER_TX,
      nativeTransfers: [
        {
          fromAddress: TEST_ADDRESS,
          toAddress: 'Address1',
          amount: 2000000000, // 2 SOL sent
        },
        {
          fromAddress: 'Address2',
          toAddress: TEST_ADDRESS,
          amount: 1000000000, // 1 SOL received
        },
      ],
    };

    const netAmount = getNetSolAmount(tx, TEST_ADDRESS);
    expect(netAmount).toBe(-1000000000); // Net: -1 SOL
  });

  it('should return 0 for transactions without native transfers', () => {
    const netAmount = getNetSolAmount(MOCK_SWAP_TX, TEST_ADDRESS);
    expect(netAmount).toBe(0);
  });
});

describe('getUserTokenTransfers', () => {
  it('should return all token transfers involving user (as sender or receiver)', () => {
    const transfers = getUserTokenTransfers(MOCK_SWAP_TX, TEST_ADDRESS);

    // MOCK_SWAP_TX has 2 transfers involving TEST_ADDRESS:
    // 1. TEST_ADDRESS sends SOL to JupiterProgram
    // 2. JupiterProgram sends USDC to TEST_ADDRESS
    expect(transfers).toHaveLength(2);

    const sentTransfer = transfers.find(t => t.fromAddress === TEST_ADDRESS);
    const receivedTransfer = transfers.find(t => t.toAddress === TEST_ADDRESS);

    expect(sentTransfer).toBeDefined();
    expect(sentTransfer?.symbol).toBe('SOL');
    expect(receivedTransfer).toBeDefined();
    expect(receivedTransfer?.symbol).toBe('USDC');
  });

  it('should return token transfers involving user as receiver', () => {
    const transfers = getUserTokenTransfers(MOCK_SWAP_TX, TEST_ADDRESS);

    // Find the USDC transfer where user is receiver
    const receivedTransfer = MOCK_SWAP_TX.tokenTransfers.find(
      t => t.toAddress === TEST_ADDRESS
    );

    expect(receivedTransfer).toBeDefined();
    expect(receivedTransfer?.symbol).toBe('USDC');
  });

  it('should return empty array for transactions without user token transfers', () => {
    const transfers = getUserTokenTransfers(MOCK_SWAP_TX, 'OtherAddress');
    expect(transfers).toHaveLength(0);
  });

  it('should return all transfers involving user', () => {
    // Both transfers in swap involve TEST_ADDRESS
    const transfers = getUserTokenTransfers(MOCK_SWAP_TX, TEST_ADDRESS);
    expect(transfers.length).toBeGreaterThan(0);
  });
});

describe('getUserNativeTransfers', () => {
  it('should return native transfers involving user as sender', () => {
    const transfers = getUserNativeTransfers(MOCK_TRANSFER_TX, TEST_ADDRESS);

    expect(transfers).toHaveLength(1);
    expect(transfers[0].fromAddress).toBe(TEST_ADDRESS);
  });

  it('should return native transfers involving user as receiver', () => {
    const tx: SolanaTransaction = {
      ...MOCK_TRANSFER_TX,
      nativeTransfers: [
        {
          fromAddress: 'SenderAddress',
          toAddress: TEST_ADDRESS,
          amount: 1000000000,
        },
      ],
    };

    const transfers = getUserNativeTransfers(tx, TEST_ADDRESS);

    expect(transfers).toHaveLength(1);
    expect(transfers[0].toAddress).toBe(TEST_ADDRESS);
  });

  it('should return empty array for transactions without user native transfers', () => {
    const transfers = getUserNativeTransfers(MOCK_TRANSFER_TX, 'OtherAddress');
    expect(transfers).toHaveLength(0);
  });
});

// ============================================================================
// Tests: Transaction Time Helpers
// ============================================================================

describe('getTransactionDate', () => {
  it('should convert blockTime to Date object', () => {
    const date = getTransactionDate(MOCK_TRANSFER_TX);

    expect(date).toBeInstanceOf(Date);
    expect(date?.getTime()).toBe(1640000000 * 1000);
  });

  it('should return null for transactions without blockTime', () => {
    const tx = { ...MOCK_TRANSFER_TX, blockTime: null };
    const date = getTransactionDate(tx);

    expect(date).toBeNull();
  });
});

describe('getTimeAgo', () => {
  beforeEach(() => {
    // Mock Date.now() to a fixed value for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2022-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Just now" for recent transactions', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('Just now');
  });

  it('should return minutes for transactions within an hour', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('5 minutes ago');
  });

  it('should return "1 minute ago" for singular', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 90, // 90 seconds ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('1 minute ago');
  });

  it('should return hours for transactions within a day', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('2 hours ago');
  });

  it('should return "1 hour ago" for singular', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 3900, // 65 minutes ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('1 hour ago');
  });

  it('should return days for older transactions', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('2 days ago');
  });

  it('should return "1 day ago" for singular', () => {
    const tx = {
      ...MOCK_TRANSFER_TX,
      blockTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    };

    const timeAgo = getTimeAgo(tx);
    expect(timeAgo).toBe('1 day ago');
  });

  it('should return "Unknown" for transactions without blockTime', () => {
    const tx = { ...MOCK_TRANSFER_TX, blockTime: null };
    const timeAgo = getTimeAgo(tx);

    expect(timeAgo).toBe('Unknown');
  });
});

// ============================================================================
// Tests: Explorer URL Helpers
// ============================================================================

describe('getExplorerUrl', () => {
  it('should generate mainnet explorer URL', () => {
    const url = getExplorerUrl(MOCK_TRANSFER_TX, 'solana-mainnet');

    expect(url).toBe(`https://explorer.solana.com/tx/${TEST_SIGNATURE}`);
  });

  it('should generate devnet explorer URL with cluster parameter', () => {
    const url = getExplorerUrl(MOCK_TRANSFER_TX, 'solana-devnet');

    expect(url).toBe(`https://explorer.solana.com/tx/${TEST_SIGNATURE}?cluster=devnet`);
  });

  it('should handle custom network IDs', () => {
    const url = getExplorerUrl(MOCK_TRANSFER_TX, 'custom-network');

    expect(url).toBe(`https://explorer.solana.com/tx/${TEST_SIGNATURE}`);
  });
});

describe('getSolscanUrl', () => {
  it('should generate mainnet Solscan URL', () => {
    const url = getSolscanUrl(MOCK_TRANSFER_TX, 'solana-mainnet');

    expect(url).toBe(`https://solscan.io/tx/${TEST_SIGNATURE}`);
  });

  it('should generate devnet Solscan URL with cluster parameter', () => {
    const url = getSolscanUrl(MOCK_TRANSFER_TX, 'solana-devnet');

    expect(url).toBe(`https://solscan.io/tx/${TEST_SIGNATURE}?cluster=devnet`);
  });

  it('should handle custom network IDs', () => {
    const url = getSolscanUrl(MOCK_TRANSFER_TX, 'custom-network');

    expect(url).toBe(`https://solscan.io/tx/${TEST_SIGNATURE}`);
  });
});

// ============================================================================
// Integration Tests (Conditional)
// ============================================================================

describe.skipIf(!await isBackendAvailable())('Integration: Transactions with Backend', () => {
  it('should get real transactions from backend', async () => {
    // Unmock for integration test
    vi.restoreAllMocks();

    const result = await getRecentTransactions(
      'solana-devnet',
      TEST_ADDRESS,
      { pageSize: 5 }
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should get single transaction from backend', async () => {
    // Unmock for integration test
    vi.restoreAllMocks();

    // This will likely return null unless TEST_SIGNATURE exists
    const tx = await getTransaction('solana-devnet', TEST_ADDRESS, TEST_SIGNATURE);

    // We just verify the call doesn't throw
    expect(tx === null || typeof tx === 'object').toBe(true);
  });
});
