import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';

vi.mock('./domains', () => ({
  getPublicKeyFromDomain: vi.fn(),
}));

import { getPublicKeyFromDomain } from './domains';
import { validateDestinationAccount } from './validation';

const mockGetPublicKeyFromDomain = vi.mocked(getPublicKeyFromDomain);

describe('solana validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty input before touching the network', async () => {
    const connection = { getAccountInfo: vi.fn() } as any;

    await expect(validateDestinationAccount(connection, '')).resolves.toEqual({
      type: 'ERROR',
      code: 'invalid',
    });
    expect(connection.getAccountInfo).not.toHaveBeenCalled();
  });

  it('validates on-curve accounts with funds', async () => {
    const connection = {
      getAccountInfo: vi.fn().mockResolvedValue({ lamports: 1_000_000 }),
    } as any;
    const address = 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk';

    await expect(validateDestinationAccount(connection, address)).resolves.toEqual({
      type: 'SUCCESS',
      code: 'valid',
      addressType: 'PUBLIC_KEY',
    });
    expect(connection.getAccountInfo).toHaveBeenCalledWith(new PublicKey(address));
  });

  it('returns warning for on-curve addresses with no account info', async () => {
    const connection = {
      getAccountInfo: vi.fn().mockResolvedValue(null),
    } as any;

    await expect(
      validateDestinationAccount(connection, 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk')
    ).resolves.toEqual({
      type: 'WARNING',
      code: 'no_info',
    });
  });

  it('distinguishes off-curve addresses with and without funds', async () => {
    const [pdaAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('validation-test')],
      new PublicKey('11111111111111111111111111111111')
    );

    const emptyConnection = {
      getAccountInfo: vi.fn().mockResolvedValue(null),
    } as any;
    const fundedConnection = {
      getAccountInfo: vi.fn().mockResolvedValue({ lamports: 123 }),
    } as any;

    await expect(validateDestinationAccount(emptyConnection, pdaAddress.toBase58())).resolves.toEqual({
      type: 'SUCCESS',
      code: 'off_curve_no_funds',
      addressType: 'PUBLIC_KEY',
    });
    await expect(
      validateDestinationAccount(fundedConnection, pdaAddress.toBase58())
    ).resolves.toEqual({
      type: 'SUCCESS',
      code: 'off_curve_has_funds',
      addressType: 'PUBLIC_KEY',
    });
  });

  it('returns network_error when account lookup fails', async () => {
    const connection = {
      getAccountInfo: vi.fn().mockRejectedValue(new Error('rpc down')),
    } as any;

    await expect(
      validateDestinationAccount(connection, 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk')
    ).resolves.toEqual({
      type: 'ERROR',
      code: 'network_error',
    });
  });

  it('resolves trimmed domain inputs through the domain service', async () => {
    const connection = { getAccountInfo: vi.fn() } as any;
    mockGetPublicKeyFromDomain.mockResolvedValueOnce(
      'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk'
    );

    await expect(validateDestinationAccount(connection, '  salmon.sol  ')).resolves.toEqual({
      type: 'SUCCESS',
      code: 'valid',
      addressType: 'DOMAIN',
      resolvedAddress: 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk',
    });
    expect(mockGetPublicKeyFromDomain).toHaveBeenCalledWith(connection, 'salmon.sol');
  });

  it('returns invalid_domain or network_error for failed domain resolution', async () => {
    const connection = { getAccountInfo: vi.fn() } as any;

    mockGetPublicKeyFromDomain.mockResolvedValueOnce(null);
    await expect(validateDestinationAccount(connection, 'missing.sol')).resolves.toEqual({
      type: 'ERROR',
      code: 'invalid_domain',
    });

    mockGetPublicKeyFromDomain.mockRejectedValueOnce(new Error('resolver down'));
    await expect(validateDestinationAccount(connection, 'broken.sol')).resolves.toEqual({
      type: 'ERROR',
      code: 'network_error',
    });
  });
});
