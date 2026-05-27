import { describe, expect, it } from 'vitest';

import {
  SATOSHIS_PER_BTC,
  WEI_PER_ETH_BIGINT,
  applyDecimals,
  removeDecimals,
  parseAmount,
  ethToWei,
  weiToEth,
  weiToEthNumber,
  btcToSatoshis,
  satoshisToBtc,
} from './decimals';

describe('decimals', () => {
  describe('applyDecimals', () => {
    it('applies token decimals to human-readable amounts', () => {
      expect(applyDecimals(1.5, 6)).toBe(1_500_000);
      expect(applyDecimals(0.001, 6)).toBe(1_000);
    });

    it('rounds to nearest integer when decimals are zero', () => {
      expect(applyDecimals(1.5, 0)).toBe(2);
    });
  });

  describe('removeDecimals', () => {
    it('removes decimals from numeric and bigint amounts', () => {
      expect(removeDecimals(1_500_000, 6)).toBe(1.5);
      expect(removeDecimals(1_500_000n, 6)).toBe(1.5);
    });

    it('is inverse of applyDecimals for common token amounts', () => {
      const original = 12.345678;
      const raw = applyDecimals(original, 6);

      expect(removeDecimals(raw, 6)).toBe(original);
    });
  });

  describe('parseAmount', () => {
    it('parses string and number inputs to bigint raw units', () => {
      expect(parseAmount('1.5', 6)).toBe(1_500_000n);
      expect(parseAmount(0.25, 8)).toBe(25_000_000n);
    });

    it('preserves full precision for high-decimal assets', () => {
      expect(parseAmount('1.000000000000000001', 18)).toBe(WEI_PER_ETH_BIGINT + 1n);
    });
  });

  describe('eth helpers', () => {
    it('converts ETH to wei from string and number inputs', () => {
      expect(ethToWei('1')).toBe(WEI_PER_ETH_BIGINT);
      expect(ethToWei(0.5)).toBe(500_000_000_000_000_000n);
    });

    it('truncates extra precision beyond 18 decimals', () => {
      expect(ethToWei('1.1234567890123456789')).toBe(1_123_456_789_012_345_678n);
    });

    it('formats wei back to ETH as string and number', () => {
      const wei = 1_234_500_000_000_000_000n;

      expect(weiToEth(wei)).toBe('1.2345');
      expect(weiToEthNumber(wei)).toBe(1.2345);
    });
  });

  describe('bitcoin helpers', () => {
    it('converts BTC to satoshis and back', () => {
      expect(btcToSatoshis(1)).toBe(BigInt(SATOSHIS_PER_BTC));
      expect(btcToSatoshis(0.00000001)).toBe(1n);
      expect(satoshisToBtc(BigInt(SATOSHIS_PER_BTC))).toBe(1);
      expect(satoshisToBtc(50_000_000)).toBe(0.5);
    });
  });
});
