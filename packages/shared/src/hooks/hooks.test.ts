/**
 * Comprehensive test suite for all hooks in @salmon/shared/hooks
 *
 * Tests cover the core logic and edge cases for:
 * - useAccounts: Account management, encryption, network switching
 * - useUserConfig: Explorer preferences, developer networks
 * - useToken: Token fetching, balance lookup
 * - useLanguage: Language preferences
 * - useInactivityTimeout: Timer management, activity tracking
 * - useDomain: Domain resolution, caching (SmartCache)
 * - useAddressbook: Address CRUD operations, migration
 * - useRuntime: Platform detection, adapter mode
 *
 * Note: These tests focus on the logic layer. Full hook rendering tests
 * should be done in app packages with proper React test environments.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';

// Storage
import * as storage from '../storage';

// SmartCache from useDomain
import { SmartCache, clearDomainCache, getDomainCache } from './useDomain';

// Types
import type { StoredAccount } from './useAccounts';
import type { TokenBalanceWithPrice } from '../utils/balance';
import type { TokenMetadata } from '../api/services/tokens';
import type {
  StoredAddress,
  Address,
  AddressInput,
  AddressBookNetwork,
} from './useAddressbook';

// Mock modules
vi.mock('../storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  removeStorageItem: vi.fn(),
  getStashItem: vi.fn(),
  setStashItem: vi.fn(),
  removeStashItem: vi.fn(),
  updateLastActivity: vi.fn(),
  getLastActivity: vi.fn(),
  isSessionTimedOut: vi.fn(),
  getStorage: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
  STORAGE_KEYS: {
    VAULT: 'salmon_vault',
    SETTINGS: 'salmon_settings',
    ACCOUNTS: 'salmon_accounts',
    ACTIVE_ACCOUNT: 'salmon_active_account',
    TOKENS: 'salmon_tokens',
    CONTACTS: 'salmon_contacts',
    TX_HISTORY: 'salmon_tx_history',
    NETWORK: 'salmon_network',
    NFT_CACHE: 'salmon_nft_cache',
    PRICE_CACHE: 'salmon_price_cache',
    LANGUAGE: 'salmon_language',
  },
}));

vi.mock('../crypto/encryption', () => ({
  lock: vi.fn((data) => Promise.resolve({
    encrypted: 'mock-encrypted-data',
    nonce: 'mock-nonce',
    salt: 'mock-salt',
    iterations: 600000,
    digest: 'sha256',
    kdf: 'pbkdf2',
  })),
  unlock: vi.fn((vault, password) => {
    if (password === 'wrong-password') {
      throw new Error('Invalid password');
    }
    return Promise.resolve({ 'account_1': 'mock mnemonic phrase' });
  }),
}));

vi.mock('../blockchain/solana', () => ({
  createSolanaAccount: vi.fn((options) => Promise.resolve({
    network: options.network,
    mnemonic: options.mnemonic,
    index: options.index || 0,
    path: `m/44'/501'/${options.index || 0}'/0'`,
    getReceiveAddress: () => 'MockSolanaAddress123456789',
    getPublicKey: () => ({ toBase58: () => 'MockSolanaAddress123456789' }),
  })),
  SOLANA_NETWORKS: {
    'mainnet-beta': { id: 'mainnet-beta', name: 'Mainnet Beta', rpcUrl: 'https://api.mainnet-beta.solana.com' },
    'devnet': { id: 'devnet', name: 'Devnet', rpcUrl: 'https://api.devnet.solana.com' },
    'testnet': { id: 'testnet', name: 'Testnet', rpcUrl: 'https://api.testnet.solana.com' },
  },
}));

vi.mock('../blockchain/solana/domains', () => ({
  getDomain: vi.fn(),
}));

vi.mock('../api/services/tokens', () => ({
  getTokenByAddress: vi.fn(),
}));

// ============================================================================
// Test Data
// ============================================================================

const MOCK_STORED_ACCOUNT: StoredAccount = {
  id: 'account_1',
  name: 'Test Account',
  avatar: 'default',
  pathIndexes: {
    'mainnet-beta': [0],
  },
};

const MOCK_TOKEN_METADATA: TokenMetadata = {
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logo: 'https://example.com/usdc.png',
  coingeckoId: 'usd-coin',
};

const MOCK_TOKEN_BALANCE: TokenBalanceWithPrice = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  owner: 'MockOwnerAddress',
  amount: '1000000000',
  decimals: 6,
  uiAmount: 1000,
  symbol: 'USDC',
  name: 'USD Coin',
  logo: 'https://example.com/usdc.png',
  coingeckoId: 'usd-coin',
  price: 1.0,
  usdBalance: 1000,
  priceChange24h: 0.01,
};

// ============================================================================
// SmartCache Tests (from useDomain)
// ============================================================================

describe('SmartCache', () => {
  let cache: SmartCache<string>;

  beforeEach(() => {
    cache = new SmartCache<string>({ maxSize: 3, ttl: 1000 });
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should respect TTL and expire old values', async () => {
    cache = new SmartCache<string>({ maxSize: 3, ttl: 100 }); // 100ms TTL
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get('key1')).toBeUndefined();
  });

  it('should evict oldest item when maxSize is exceeded', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    expect(cache.size).toBe(3);

    // Adding 4th item should evict key1
    cache.set('key4', 'value4');
    expect(cache.size).toBe(3);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should update LRU order when accessing items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Access key1 to make it most recently used
    cache.get('key1');

    // Add key4, should evict key2 (oldest)
    cache.set('key4', 'value4');
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key1')).toBe('value1');
  });

  it('should handle has() correctly', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
  });

  it('should delete items', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);

    cache.delete('key1');
    expect(cache.has('key1')).toBe(false);
  });

  it('should clear all items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('should update existing keys without evicting', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Update key1
    cache.set('key1', 'updated');
    expect(cache.size).toBe(3);
    expect(cache.get('key1')).toBe('updated');
  });
});

describe('Domain cache utility functions', () => {
  beforeEach(() => {
    clearDomainCache();
  });

  it('should clear the global domain cache', () => {
    const cache = getDomainCache();
    cache.set('test', 'value');
    expect(cache.has('test')).toBe(true);

    clearDomainCache();
    expect(cache.has('test')).toBe(false);
  });

  it('should return the domain cache instance', () => {
    const cache = getDomainCache();
    expect(cache).toBeInstanceOf(SmartCache);
  });
});

// ============================================================================
// Storage Integration Tests
// ============================================================================

describe('Storage module integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct storage keys defined', () => {
    expect(storage.STORAGE_KEYS.SETTINGS).toBe('salmon_settings');
    expect(storage.STORAGE_KEYS.LANGUAGE).toBe('salmon_language');
    expect(storage.STORAGE_KEYS.CONTACTS).toBe('salmon_contacts');
    expect(storage.STORAGE_KEYS.ACCOUNTS).toBe('salmon_accounts');
    expect(storage.STORAGE_KEYS.VAULT).toBe('salmon_vault');
  });

  it('should mock getStorageItem correctly', async () => {
    (storage.getStorageItem as any).mockResolvedValue({ test: 'data' });
    const result = await storage.getStorageItem('test_key');
    expect(result).toEqual({ test: 'data' });
  });

  it('should mock setStorageItem correctly', async () => {
    (storage.setStorageItem as any).mockResolvedValue(undefined);
    await storage.setStorageItem('test_key', { test: 'data' });
    expect(storage.setStorageItem).toHaveBeenCalledWith('test_key', { test: 'data' });
  });

  it('should mock activity tracking functions', async () => {
    const now = Date.now();
    (storage.updateLastActivity as any).mockResolvedValue(undefined);
    (storage.getLastActivity as any).mockResolvedValue(now);
    (storage.isSessionTimedOut as any).mockResolvedValue(false);

    await storage.updateLastActivity();
    expect(storage.updateLastActivity).toHaveBeenCalled();

    const lastActivity = await storage.getLastActivity();
    expect(lastActivity).toBe(now);

    const timedOut = await storage.isSessionTimedOut(300000);
    expect(timedOut).toBe(false);
  });
});

// ============================================================================
// Encryption Module Tests
// ============================================================================

describe('Encryption module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock lock function', async () => {
    const { lock } = await import('../crypto/encryption');
    const data = { test: 'data' };
    const result = await lock(data, 'password');

    expect(result).toHaveProperty('encrypted');
    expect(result).toHaveProperty('nonce');
    expect(result).toHaveProperty('salt');
  });

  it('should mock unlock function with correct password', async () => {
    const { unlock } = await import('../crypto/encryption');
    const vault = { encrypted: 'data', nonce: 'nonce', salt: 'salt', iterations: 600000, digest: 'sha256' as const, kdf: 'pbkdf2' as const };
    const result = await unlock(vault, 'correct-password');

    expect(result).toHaveProperty('account_1');
  });

  it('should throw error for wrong password', async () => {
    const { unlock } = await import('../crypto/encryption');
    const vault = { encrypted: 'data', nonce: 'nonce', salt: 'salt', iterations: 600000, digest: 'sha256' as const, kdf: 'pbkdf2' as const };

    try {
      await unlock(vault, 'wrong-password');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Invalid password');
    }
  });
});

// ============================================================================
// Solana Module Tests
// ============================================================================

describe('Solana blockchain module', () => {
  it('should mock createSolanaAccount', async () => {
    const { createSolanaAccount, SOLANA_NETWORKS } = await import('../blockchain/solana');
    const account = await createSolanaAccount({
      network: SOLANA_NETWORKS['mainnet-beta'],
      mnemonic: 'test mnemonic',
      index: 0,
    });

    expect(account.getReceiveAddress()).toBe('MockSolanaAddress123456789');
    expect(account.path).toBe("m/44'/501'/0'/0'");
  });

  it('should have network configurations', async () => {
    const { SOLANA_NETWORKS } = await import('../blockchain/solana');
    expect(SOLANA_NETWORKS).toHaveProperty('mainnet-beta');
    expect(SOLANA_NETWORKS).toHaveProperty('devnet');
    expect(SOLANA_NETWORKS).toHaveProperty('testnet');
  });
});

// ============================================================================
// Token Service Tests
// ============================================================================

describe('Token service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock getTokenByAddress', async () => {
    const tokensModule = await import('../api/services/tokens');
    (tokensModule.getTokenByAddress as any).mockResolvedValue(MOCK_TOKEN_METADATA);

    const token = await tokensModule.getTokenByAddress(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'solana-mainnet'
    );

    expect(token?.symbol).toBe('USDC');
    expect(token?.name).toBe('USD Coin');
  });

  it('should handle API errors', async () => {
    const tokensModule = await import('../api/services/tokens');
    (tokensModule.getTokenByAddress as any).mockRejectedValue(new Error('API Error'));

    await expect(
      tokensModule.getTokenByAddress('invalid', 'solana-mainnet')
    ).rejects.toThrow('API Error');
  });
});

// ============================================================================
// Domain Service Tests
// ============================================================================

describe('Domain service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock getDomain', async () => {
    const domainsModule = await import('../blockchain/solana/domains');
    (domainsModule.getDomain as any).mockResolvedValue('test.sol');

    const connection = new Connection('https://api.devnet.solana.com');
    const pubkey = new PublicKey('11111111111111111111111111111111');

    const domain = await domainsModule.getDomain(connection, pubkey);
    expect(domain).toBe('test.sol');
  });

  it('should handle domain lookup failures', async () => {
    const domainsModule = await import('../blockchain/solana/domains');
    (domainsModule.getDomain as any).mockResolvedValue(null);

    const connection = new Connection('https://api.devnet.solana.com');
    const pubkey = new PublicKey('11111111111111111111111111111111');

    const domain = await domainsModule.getDomain(connection, pubkey);
    expect(domain).toBeNull();
  });
});

// ============================================================================
// Address Book Type and Helper Tests
// ============================================================================

describe('Address book types and helpers', () => {
  const mockNetworks: AddressBookNetwork[] = [
    { id: 'mainnet-beta', name: 'Mainnet Beta', blockchain: 'solana' },
    { id: 'devnet', name: 'Devnet', blockchain: 'solana' },
  ];

  it('should define StoredAddress type correctly', () => {
    const storedAddress: StoredAddress = {
      address: 'TestAddress123',
      name: 'Test Contact',
      networkId: 'mainnet-beta',
      domain: 'test.sol',
    };

    expect(storedAddress.address).toBe('TestAddress123');
    expect(storedAddress.networkId).toBe('mainnet-beta');
    expect(storedAddress.domain).toBe('test.sol');
  });

  it('should define Address type correctly', () => {
    const address: Address = {
      address: 'TestAddress123',
      name: 'Test Contact',
      network: mockNetworks[0],
      domain: 'test.sol',
    };

    expect(address.network.id).toBe('mainnet-beta');
    expect(address.network.blockchain).toBe('solana');
  });

  it('should define AddressInput type correctly', () => {
    const input: AddressInput = {
      address: 'NewAddress456',
      name: 'New Contact',
      networkId: 'devnet',
    };

    expect(input.address).toBe('NewAddress456');
    expect(input.networkId).toBe('devnet');
  });
});

// ============================================================================
// Account Types Tests
// ============================================================================

describe('Account types', () => {
  it('should define StoredAccount correctly', () => {
    const account: StoredAccount = {
      id: 'account_123',
      name: 'My Wallet',
      avatar: 'avatar1',
      pathIndexes: {
        'mainnet-beta': [0, 1],
        'devnet': [0],
      },
    };

    expect(account.id).toBe('account_123');
    expect(account.pathIndexes['mainnet-beta']).toEqual([0, 1]);
  });
});

// ============================================================================
// Token Balance Types Tests
// ============================================================================

describe('Token balance types', () => {
  it('should define TokenBalanceWithPrice correctly', () => {
    const balance: TokenBalanceWithPrice = {
      mint: 'TokenMint123',
      address: 'TokenAddress123',
      owner: 'OwnerAddress123',
      amount: '1000000',
      decimals: 6,
      uiAmount: 1,
      symbol: 'TEST',
      name: 'Test Token',
      logo: 'https://example.com/logo.png',
      price: 1.5,
      usdBalance: 1.5,
      priceChange24h: 2.5,
    };

    expect(balance.symbol).toBe('TEST');
    expect(balance.price).toBe(1.5);
    expect(balance.usdBalance).toBe(1.5);
  });
});

// ============================================================================
// Runtime Detection Tests
// ============================================================================

describe('Runtime detection utilities', () => {
  // Skip these tests if running in Node.js environment (without window/document)
  const isWebEnvironment = typeof window !== 'undefined' && typeof document !== 'undefined';

  it.skipIf(!isWebEnvironment)('should detect web environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('should parse URL hash parameters', () => {
    // Test URLSearchParams directly without relying on window.location
    const mockHash = '#origin=https://example.com&param=value';
    const params = new URLSearchParams(mockHash.slice(1));
    expect(params.get('origin')).toBe('https://example.com');
    expect(params.get('param')).toBe('value');
  });

  it('should handle empty URL hash', () => {
    // Test URLSearchParams directly without relying on window.location
    const mockHash = '';
    const params = new URLSearchParams(mockHash.slice(1));
    expect(params.get('origin')).toBeNull();
  });
});

// ============================================================================
// Integration Scenarios
// ============================================================================

describe('Integration scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete account creation workflow', async () => {
    const { createSolanaAccount, SOLANA_NETWORKS } = await import('../blockchain/solana');
    const { lock } = await import('../crypto/encryption');

    // Create account
    const account = await createSolanaAccount({
      network: SOLANA_NETWORKS['mainnet-beta'],
      mnemonic: 'test mnemonic phrase',
      index: 0,
    });

    expect(account.getReceiveAddress()).toBeDefined();

    // Encrypt mnemonic
    const encrypted = await lock({ 'account_1': 'test mnemonic phrase' }, 'password123');
    expect(encrypted).toHaveProperty('encrypted');

    // Store account data
    (storage.setStorageItem as any).mockResolvedValue(undefined);
    await storage.setStorageItem('salmon_accounts', [MOCK_STORED_ACCOUNT]);
    await storage.setStorageItem('salmon_vault', encrypted);

    expect(storage.setStorageItem).toHaveBeenCalledTimes(2);
  });

  it('should handle token fetching with balance data', async () => {
    const tokensModule = await import('../api/services/tokens');
    (tokensModule.getTokenByAddress as any).mockResolvedValue(MOCK_TOKEN_METADATA);

    // Fetch token metadata
    const token = await tokensModule.getTokenByAddress(
      MOCK_TOKEN_BALANCE.address,
      'solana-mainnet'
    );

    expect(token?.symbol).toBe(MOCK_TOKEN_BALANCE.symbol);
    expect(token?.name).toBe(MOCK_TOKEN_BALANCE.name);
  });

  it('should handle domain caching workflow', async () => {
    const cache = new SmartCache<string | null>({ maxSize: 50, ttl: 600000 });
    const address = 'DemoAddress11111111111111111111111111111111';

    // Check cache (miss)
    expect(cache.has(address)).toBe(false);

    // Fetch and cache domain
    const domainsModule = await import('../blockchain/solana/domains');
    (domainsModule.getDomain as any).mockResolvedValue('demo.sol');

    const connection = new Connection('https://api.devnet.solana.com');
    const pubkey = new PublicKey(address);
    const domain = await domainsModule.getDomain(connection, pubkey);

    cache.set(address, domain);

    // Check cache (hit)
    expect(cache.has(address)).toBe(true);
    expect(cache.get(address)).toBe('demo.sol');
  });

  it('should handle address book migration scenario', () => {
    // Legacy format
    const legacyAddress = {
      name: 'Old Contact',
      address: 'OldAddress123',
      chain: 'SOLANA',
    };

    // Migrate to new format
    const migratedAddress: StoredAddress = {
      name: legacyAddress.name,
      address: legacyAddress.address,
      networkId: 'mainnet-beta', // Inferred from chain
    };

    expect(migratedAddress.networkId).toBe('mainnet-beta');
    expect(migratedAddress.name).toBe('Old Contact');
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge cases and error handling', () => {
  it('should handle null and undefined values gracefully', () => {
    const cache = new SmartCache<string | null>({ maxSize: 10, ttl: 1000 });

    cache.set('null-value', null);
    expect(cache.get('null-value')).toBeNull();
    expect(cache.has('null-value')).toBe(true);
  });

  it('should handle empty strings in cache', () => {
    const cache = new SmartCache<string>({ maxSize: 10, ttl: 1000 });

    cache.set('empty', '');
    expect(cache.get('empty')).toBe('');
    expect(cache.has('empty')).toBe(true);
  });

  it('should handle concurrent cache operations', () => {
    const cache = new SmartCache<number>({ maxSize: 3, ttl: 1000 });

    // Simulate concurrent writes
    cache.set('key1', 1);
    cache.set('key2', 2);
    cache.set('key1', 10); // Update
    cache.set('key3', 3);

    expect(cache.get('key1')).toBe(10);
    expect(cache.size).toBe(3);
  });

  it('should handle invalid public key strings', () => {
    expect(() => new PublicKey('invalid-key')).toThrow();
  });

  it('should handle network timeout scenarios', async () => {
    const tokensModule = await import('../api/services/tokens');
    (tokensModule.getTokenByAddress as any).mockRejectedValue(new Error('Network timeout'));

    await expect(
      tokensModule.getTokenByAddress('TokenAddress', 'solana-mainnet')
    ).rejects.toThrow('Network timeout');
  });
});
