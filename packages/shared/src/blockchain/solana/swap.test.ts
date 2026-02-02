/**
 * Tests for Solana Swap Service
 *
 * Tests cover swap quote fetching, execution, and helper functions.
 * Uses Vitest 4.0.18 for testing with mocked API responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Keypair, VersionedTransaction, PublicKey, TransactionMessage, MessageV0, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import {
  getSwapQuote,
  executeSwap,
  swap,
  getExpectedOutput,
  getMinimumOutput,
  getPriceImpact,
  SOL_ADDRESS,
  type SwapQuote,
  type SwapQuoteParams,
} from './swap';
import * as solanaApiService from '../../api/services/solana';
import * as tokensApiService from '../../api/services/tokens';
import type { SwapOrderResponse } from '../../api/services/solana';
import type { TokenMetadata } from '../../api/services/tokens';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../api/services/solana');
vi.mock('../../api/services/tokens');

// ============================================================================
// Test Data
// ============================================================================

const TEST_KEYPAIR = Keypair.generate();
const TEST_PUBLIC_KEY = TEST_KEYPAIR.publicKey.toBase58();
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Creates a valid base64-encoded VersionedTransaction for testing.
 * This is needed because VersionedTransaction.deserialize() expects a properly formatted buffer.
 */
function createMockVersionedTransactionBase64(payer: PublicKey): string {
  // Create a minimal valid versioned transaction
  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: payer, // Send to self (valid for testing)
      lamports: 1000,
    }),
  ];

  // Create a recent blockhash (dummy for testing)
  const recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  // Create MessageV0
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash,
    instructions,
  }).compileToV0Message();

  // Create VersionedTransaction
  const versionedTx = new VersionedTransaction(messageV0);

  // Serialize and encode to base64
  return Buffer.from(versionedTx.serialize()).toString('base64');
}

/**
 * Mock swap order response from API
 */
const MOCK_SWAP_ORDER: SwapOrderResponse = {
  requestId: 'test-request-id-123',
  swapTransaction: 'base64-encoded-transaction-data',
  route: {
    inputMint: SOL_ADDRESS,
    outputMint: USDC_MINT,
    inAmount: '1000000000', // 1 SOL (9 decimals)
    outAmount: '5000000', // 5 USDC (6 decimals)
    otherAmountThreshold: '4950000', // 4.95 USDC (with 0.5% slippage)
    swapMode: 'ExactIn',
    slippageBps: 50,
    priceImpactPct: '0.12',
    routePlan: [
      {
        swapInfo: {
          ammKey: 'test-amm-key',
          label: 'Raydium',
          inputMint: SOL_ADDRESS,
          outputMint: USDC_MINT,
          inAmount: '1000000000',
          outAmount: '5000000',
          feeAmount: '5000',
          feeMint: USDC_MINT,
        },
        percent: 100,
      },
    ],
  },
  inputToken: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
  },
  outputToken: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  expiresAt: Date.now() + 60000,
};

/**
 * Mock token list
 */
const MOCK_TOKEN_LIST: TokenMetadata[] = [
  {
    address: SOL_ADDRESS,
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logo: 'https://example.com/sol.png',
  },
  {
    address: USDC_MINT,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: 'https://example.com/usdc.png',
  },
];

/**
 * Mock successful swap execution response
 */
const MOCK_SWAP_SUCCESS = {
  signature: '5xG8...signature',
  success: true,
  confirmationStatus: 'confirmed' as const,
};

/**
 * Mock failed swap execution response
 */
const MOCK_SWAP_FAILURE = {
  signature: '',
  success: false,
  error: 'Swap execution failed: Slippage exceeded',
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
// Tests: getSwapQuote
// ============================================================================

describe('getSwapQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokensApiService.getTokenList).mockResolvedValue(MOCK_TOKEN_LIST);
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(MOCK_SWAP_ORDER);
  });

  it('should get swap quote with correct parameters', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0, // 1 SOL
      publicKey: TEST_PUBLIC_KEY,
      slippageBps: 50,
    };

    const quote = await getSwapQuote('solana-mainnet', params);

    expect(quote).toBeDefined();
    expect(quote.networkId).toBe('solana-mainnet');
    expect(quote.requestId).toBe('test-request-id-123');
    expect(quote.route.inAmount).toBe('1000000000');
    expect(quote.route.outAmount).toBe('5000000');

    // Verify API was called with correct parameters
    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        inputMint: SOL_ADDRESS,
        outputMint: USDC_MINT,
        amount: '1000000000', // Converted from 1.0 with 9 decimals
        publicKey: TEST_PUBLIC_KEY,
        slippageBps: 50,
      })
    );
  });

  it('should convert human-readable amount to raw amount using decimals', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.5, // 1.5 SOL
      publicKey: TEST_PUBLIC_KEY,
    };

    await getSwapQuote('solana-mainnet', params);

    // 1.5 SOL with 9 decimals = 1,500,000,000 lamports
    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        amount: '1500000000',
      })
    );
  });

  it('should use provided decimals instead of fetching token list', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    await getSwapQuote('solana-mainnet', params, { inputDecimals: 9 });

    // Should not fetch token list
    expect(tokensApiService.getTokenList).not.toHaveBeenCalled();
  });

  it('should normalize user public key to SOL_ADDRESS for native SOL', async () => {
    const params: SwapQuoteParams = {
      inputMint: TEST_PUBLIC_KEY, // User's public key instead of SOL_ADDRESS
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    await getSwapQuote('solana-mainnet', params);

    // Should normalize to SOL_ADDRESS
    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        inputMint: SOL_ADDRESS,
      })
    );
  });

  it('should handle swap mode parameter', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
      swapMode: 'ExactOut',
    };

    await getSwapQuote('solana-mainnet', params);

    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        swapMode: 'ExactOut',
      })
    );
  });

  it('should handle priority level parameter', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
      priorityLevel: 'high',
    };

    await getSwapQuote('solana-mainnet', params);

    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        priorityLevel: 'high',
      })
    );
  });

  it('should handle dynamic slippage parameter', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
      dynamicSlippage: true,
    };

    await getSwapQuote('solana-mainnet', params);

    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        dynamicSlippage: true,
      })
    );
  });

  it('should throw error when no route found', async () => {
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(null);

    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    await expect(getSwapQuote('solana-mainnet', params)).rejects.toThrow(
      'Failed to get swap quote: No route found'
    );
  });

  it('should default to 9 decimals if token not found in list', async () => {
    vi.mocked(tokensApiService.getTokenList).mockResolvedValue([]);

    const params: SwapQuoteParams = {
      inputMint: 'unknown-token-mint',
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    await getSwapQuote('solana-mainnet', params);

    // Should use 9 decimals as default
    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.objectContaining({
        amount: '1000000000', // 1.0 with 9 decimals
      })
    );
  });

  it('should accept network object with id property', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    const networkObj = { id: 'solana-mainnet', name: 'Mainnet', config: {} };
    await getSwapQuote(networkObj, params);

    expect(solanaApiService.getSwapOrder).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.any(Object)
    );
  });
});

// ============================================================================
// Tests: executeSwap
// ============================================================================

describe('executeSwap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute swap successfully', async () => {
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_SUCCESS);

    const quote: SwapQuote = {
      ...MOCK_SWAP_ORDER,
      networkId: 'solana-mainnet',
    };

    // Create a valid mock versioned transaction
    quote.swapTransaction = createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey);

    const result = await executeSwap(quote, TEST_KEYPAIR);

    expect(result.status).toBe('success');
    expect(result.txId).toBe('5xG8...signature');
    expect(result.confirmationStatus).toBe('confirmed');
    expect(result.error).toBeUndefined();
  });

  it('should handle failed swap execution', async () => {
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_FAILURE);

    const quote: SwapQuote = {
      ...MOCK_SWAP_ORDER,
      networkId: 'solana-mainnet',
    };

    // Create a valid mock versioned transaction
    quote.swapTransaction = createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey);

    const result = await executeSwap(quote, TEST_KEYPAIR);

    expect(result.status).toBe('fail');
    expect(result.txId).toBeNull();
    expect(result.error).toBe('Swap execution failed: Slippage exceeded');
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(solanaApiService.executeSwapApi).mockRejectedValue(
      new Error('Network error')
    );

    const quote: SwapQuote = {
      ...MOCK_SWAP_ORDER,
      networkId: 'solana-mainnet',
    };

    // Create a valid mock versioned transaction
    quote.swapTransaction = createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey);

    const result = await executeSwap(quote, TEST_KEYPAIR);

    expect(result.status).toBe('fail');
    expect(result.txId).toBeNull();
    expect(result.error).toContain('Network error');
  });

  it('should sign transaction before sending', async () => {
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_SUCCESS);

    const quote: SwapQuote = {
      ...MOCK_SWAP_ORDER,
      networkId: 'solana-mainnet',
    };

    // Create a valid mock versioned transaction
    quote.swapTransaction = createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey);

    await executeSwap(quote, TEST_KEYPAIR);

    // Verify executeSwapApi was called with base64-encoded signed transaction
    expect(solanaApiService.executeSwapApi).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.any(String), // Signed transaction (base64)
      'test-request-id-123'
    );
  });

  it('should include request ID in execution', async () => {
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_SUCCESS);

    const quote: SwapQuote = {
      ...MOCK_SWAP_ORDER,
      networkId: 'solana-mainnet',
      requestId: 'custom-request-id',
    };

    // Create a valid mock versioned transaction
    quote.swapTransaction = createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey);

    await executeSwap(quote, TEST_KEYPAIR);

    expect(solanaApiService.executeSwapApi).toHaveBeenCalledWith(
      'solana-mainnet',
      expect.any(String),
      'custom-request-id'
    );
  });
});

// ============================================================================
// Tests: swap (Combined function)
// ============================================================================

describe('swap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokensApiService.getTokenList).mockResolvedValue(MOCK_TOKEN_LIST);
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(MOCK_SWAP_ORDER);
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_SUCCESS);
  });

  it('should get quote and execute swap in one call', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    // Mock the swap transaction to be a valid serializable transaction
    const mockSwapOrder = {
      ...MOCK_SWAP_ORDER,
      swapTransaction: createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey),
    };
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(mockSwapOrder);

    const result = await swap('solana-mainnet', params, TEST_KEYPAIR);

    expect(result.status).toBe('success');
    expect(result.txId).toBe('5xG8...signature');

    // Verify both API calls were made
    expect(solanaApiService.getSwapOrder).toHaveBeenCalled();
    expect(solanaApiService.executeSwapApi).toHaveBeenCalled();
  });

  it('should propagate quote errors', async () => {
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(null);

    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    await expect(swap('solana-mainnet', params, TEST_KEYPAIR)).rejects.toThrow(
      'Failed to get swap quote'
    );
  });

  it('should propagate execution errors', async () => {
    const mockSwapOrder = {
      ...MOCK_SWAP_ORDER,
      swapTransaction: createMockVersionedTransactionBase64(TEST_KEYPAIR.publicKey),
    };
    vi.mocked(solanaApiService.getSwapOrder).mockResolvedValue(mockSwapOrder);
    vi.mocked(solanaApiService.executeSwapApi).mockResolvedValue(MOCK_SWAP_FAILURE);

    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    const result = await swap('solana-mainnet', params, TEST_KEYPAIR);

    expect(result.status).toBe('fail');
    expect(result.error).toBeDefined();
  });
});

// ============================================================================
// Tests: Helper Functions
// ============================================================================

describe('getExpectedOutput', () => {
  const mockQuote: SwapQuote = {
    networkId: 'solana-mainnet',
    swapTransaction: '',
    requestId: 'test-request-id',
    route: {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      inAmount: '1000000000',
      outAmount: '5000000', // 5 USDC (6 decimals)
      otherAmountThreshold: '4950000',
      priceImpactPct: '0.12',
      routePlan: [],
      slippageBps: 50,
      swapMode: 'ExactIn',
    },
    outputToken: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  };

  it('should calculate expected output using quote decimals', () => {
    const output = getExpectedOutput(mockQuote);
    expect(output).toBe(5); // 5000000 / 10^6 = 5
  });

  it('should calculate expected output using provided decimals', () => {
    const output = getExpectedOutput(mockQuote, 6);
    expect(output).toBe(5);
  });

  it('should default to 9 decimals when no decimals provided', () => {
    const quoteWithoutDecimals = {
      ...mockQuote,
      outputToken: undefined,
    };
    const output = getExpectedOutput(quoteWithoutDecimals);
    expect(output).toBe(0.005); // 5000000 / 10^9 = 0.005
  });
});

describe('getMinimumOutput', () => {
  const mockQuote: SwapQuote = {
    networkId: 'solana-mainnet',
    swapTransaction: '',
    requestId: 'test-request-id',
    route: {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      inAmount: '1000000000',
      outAmount: '5000000',
      otherAmountThreshold: '4950000', // 4.95 USDC (with slippage)
      priceImpactPct: '0.12',
      routePlan: [],
      slippageBps: 50,
      swapMode: 'ExactIn',
    },
    outputToken: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  };

  it('should calculate minimum output using quote decimals', () => {
    const output = getMinimumOutput(mockQuote);
    expect(output).toBe(4.95); // 4950000 / 10^6 = 4.95
  });

  it('should calculate minimum output using provided decimals', () => {
    const output = getMinimumOutput(mockQuote, 6);
    expect(output).toBe(4.95);
  });

  it('should be less than expected output due to slippage', () => {
    const expected = getExpectedOutput(mockQuote);
    const minimum = getMinimumOutput(mockQuote);
    expect(minimum).toBeLessThan(expected);
  });
});

describe('getPriceImpact', () => {
  const createMockQuote = (priceImpactPct: string): SwapQuote => ({
    networkId: 'solana-mainnet',
    swapTransaction: '',
    requestId: 'test-request-id',
    route: {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      inAmount: '1000000000',
      outAmount: '5000000',
      otherAmountThreshold: '4950000',
      priceImpactPct,
      routePlan: [],
      slippageBps: 50,
      swapMode: 'ExactIn',
    },
  });

  it('should extract price impact from quote', () => {
    const quote = createMockQuote('0.12');
    const impact = getPriceImpact(quote);
    expect(impact).toBe(0.12);
  });

  it('should handle zero price impact', () => {
    const quote = createMockQuote('0.00');
    const impact = getPriceImpact(quote);
    expect(impact).toBe(0.00);
  });

  it('should handle high price impact', () => {
    const quote = createMockQuote('5.67');
    const impact = getPriceImpact(quote);
    expect(impact).toBe(5.67);
  });

  it('should handle negative price impact', () => {
    const quote = createMockQuote('-0.05');
    const impact = getPriceImpact(quote);
    expect(impact).toBe(-0.05);
  });
});

// ============================================================================
// Integration Tests (Conditional)
// ============================================================================

describe.skipIf(!await isBackendAvailable())('Integration: Swap with Backend', () => {
  it('should get real swap quote from backend', async () => {
    const params: SwapQuoteParams = {
      inputMint: SOL_ADDRESS,
      outputMint: USDC_MINT,
      amount: 1.0,
      publicKey: TEST_PUBLIC_KEY,
    };

    // Unmock for integration test
    vi.restoreAllMocks();

    const quote = await getSwapQuote('solana-devnet', params);

    expect(quote).toBeDefined();
    expect(quote.requestId).toBeDefined();
    expect(quote.route.inputMint).toBe(SOL_ADDRESS);
    expect(quote.route.outputMint).toBe(USDC_MINT);
  });
});
