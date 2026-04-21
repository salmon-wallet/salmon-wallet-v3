import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Keypair, PublicKey } from '@solana/web3.js';

vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');

  class MockConnection {
    nodeUrl: string;
    commitment: string;
    getBalance = vi.fn();
    getFeeForMessage = vi.fn();

    constructor(nodeUrl: string, commitment: string) {
      this.nodeUrl = nodeUrl;
      this.commitment = commitment;
    }
  }

  return {
    ...actual,
    Connection: MockConnection,
  };
});

vi.mock('./domains', () => ({
  getDomain: vi.fn(),
  getDomainFromPublicKey: vi.fn(),
  getPublicKeyFromDomain: vi.fn(),
}));

import { SOLANA_NETWORKS } from './networks';
import { SolanaAccount } from './SolanaAccount';
import {
  getDomain,
  getDomainFromPublicKey,
  getPublicKeyFromDomain,
} from './domains';

const mockGetDomain = vi.mocked(getDomain);
const mockGetDomainFromPublicKey = vi.mocked(getDomainFromPublicKey);
const mockGetPublicKeyFromDomain = vi.mocked(getPublicKeyFromDomain);

function createAccount() {
  return new SolanaAccount({
    network: SOLANA_NETWORKS['solana-mainnet'],
    index: 0,
    path: "m/44'/501'/0'/0'",
    keyPair: Keypair.generate(),
    fetchBalance: vi.fn(),
    fetchPrices: vi.fn(),
    fetchTransaction: vi.fn(),
    fetchTransactions: vi.fn(),
    fetchNfts: vi.fn(),
  });
}

describe('SolanaAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses the current connection until the configured node url changes', async () => {
    const account = createAccount();

    const first = await account.getConnection();
    const second = await account.getConnection();
    expect(first).toBe(second);

    const originalNodeUrl = SOLANA_NETWORKS['solana-mainnet'].config.nodeUrl;
    SOLANA_NETWORKS['solana-mainnet'].config.nodeUrl = 'https://new-rpc.example';

    const third = await account.getConnection();
    expect(third).not.toBe(first);

    SOLANA_NETWORKS['solana-mainnet'].config.nodeUrl = originalNodeUrl;
  });

  it('delegates getCredit and estimateTransactionsFee to the underlying connection', async () => {
    const account = createAccount();
    const connection = await account.getConnection();
    (connection.getBalance as any).mockResolvedValue(1234);
    (connection.getFeeForMessage as any)
      .mockResolvedValueOnce({ value: 5000 })
      .mockResolvedValueOnce({ value: null })
      .mockResolvedValueOnce({ value: 2500 });

    await expect(account.getCredit()).resolves.toBe(1234);
    await expect(account.estimateTransactionsFee([{} as any, {} as any, {} as any])).resolves.toBe(
      7500
    );
  });

  it('wraps domain helper methods with the account connection', async () => {
    const account = createAccount();
    mockGetDomain.mockResolvedValueOnce('wallet.sol');
    mockGetDomainFromPublicKey.mockResolvedValueOnce('friend.sol');
    mockGetPublicKeyFromDomain.mockResolvedValueOnce('resolved-public-key');

    const connection = await account.getConnection();
    const otherPublicKey = Keypair.generate().publicKey;

    await expect(account.getDomain()).resolves.toBe('wallet.sol');
    await expect(account.getDomainFromPublicKey(otherPublicKey)).resolves.toBe('friend.sol');
    await expect(account.getPublicKeyFromDomain('friend.sol')).resolves.toBe('resolved-public-key');

    expect(mockGetDomain).toHaveBeenCalledWith(connection, account.publicKey);
    expect(mockGetDomainFromPublicKey).toHaveBeenCalledWith(connection, otherPublicKey);
    expect(mockGetPublicKeyFromDomain).toHaveBeenCalledWith(connection, 'friend.sol');
  });

  it('returns base58 secret key and validates public key helpers', () => {
    const account = createAccount();

    expect(typeof account.retrieveSecurePrivateKey()).toBe('string');
    expect(account.retrieveSecurePrivateKey().length).toBeGreaterThan(0);
    expect(SolanaAccount.isValidAddress(account.getReceiveAddress())).toBe(true);
    expect(SolanaAccount.isValidAddress('not-a-solana-address')).toBe(false);
    expect(SolanaAccount.toPublicKey(account.getReceiveAddress())).toBeInstanceOf(PublicKey);
  });

  it('throws exact method_not_supported errors for deprecated swap/token methods', async () => {
    const account = createAccount();

    await expect(account.getAvailableTokens()).rejects.toThrow(
      'method_not_supported: Use token list service directly'
    );
    await expect(account.getFeaturedTokens()).rejects.toThrow(
      'method_not_supported: Use token list service directly'
    );
    await expect(account.getBestSwapQuote()).rejects.toThrow(
      'method_not_supported: Use swap service directly'
    );
    await expect(account.createSwapTransaction()).rejects.toThrow(
      'method_not_supported: Use swap service directly'
    );
  });
});
