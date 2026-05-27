/**
 * Tests for Explorers Configuration module
 */

import { describe, it, expect } from 'vitest';
import {
  EXPLORERS,
  DEFAULT_EXPLORERS,
  getTransactionUrl,
} from './explorers';

// ============================================================================
// Ethereum Explorers Tests
// ============================================================================

describe('Ethereum Explorers', () => {
  describe('mainnet explorer', () => {
    it('should have ETHERSCAN explorer configured', () => {
      const explorer = EXPLORERS.ETHEREUM.mainnet?.ETHERSCAN;

      expect(explorer).toBeDefined();
      expect(explorer?.name).toBe('Etherscan');
    });

    it('should return correct Etherscan URL', () => {
      const explorer = EXPLORERS.ETHEREUM.mainnet?.ETHERSCAN;

      expect(explorer?.url).toBe('https://etherscan.io/tx/{txId}');
    });
  });

  describe('sepolia explorer', () => {
    it('should have ETHERSCAN explorer configured', () => {
      const explorer = EXPLORERS.ETHEREUM.sepolia?.ETHERSCAN;

      expect(explorer).toBeDefined();
      expect(explorer?.name).toBe('Etherscan Sepolia');
    });

    it('should return correct Etherscan Sepolia URL', () => {
      const explorer = EXPLORERS.ETHEREUM.sepolia?.ETHERSCAN;

      expect(explorer?.url).toBe('https://sepolia.etherscan.io/tx/{txId}');
    });
  });
});

// ============================================================================
// getTransactionUrl for Ethereum Tests
// ============================================================================

describe('getTransactionUrl for Ethereum', () => {
  const testTxId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  it('should return correct URL for mainnet transaction', () => {
    const url = getTransactionUrl('ETHEREUM', 'mainnet', 'ETHERSCAN', testTxId);

    expect(url).toBe(`https://etherscan.io/tx/${testTxId}`);
  });

  it('should return correct URL for sepolia transaction', () => {
    const url = getTransactionUrl('ETHEREUM', 'sepolia', 'ETHERSCAN', testTxId);

    expect(url).toBe(`https://sepolia.etherscan.io/tx/${testTxId}`);
  });

  it('should return null for invalid explorer key', () => {
    const url = getTransactionUrl('ETHEREUM', 'mainnet', 'INVALID_EXPLORER', testTxId);

    expect(url).toBeNull();
  });

  it('should return null for invalid network environment', () => {
    // @ts-expect-error - Testing invalid input
    const url = getTransactionUrl('ETHEREUM', 'invalid-network', 'ETHERSCAN', testTxId);

    expect(url).toBeNull();
  });
});

// ============================================================================
// DEFAULT_EXPLORERS Tests
// ============================================================================

describe('DEFAULT_EXPLORERS', () => {
  it('should have ETHEREUM set to ETHERSCAN', () => {
    expect(DEFAULT_EXPLORERS.ETHEREUM).toBe('ETHERSCAN');
  });
});
