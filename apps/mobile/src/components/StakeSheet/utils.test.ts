import { solToLamports } from './utils';

describe('solToLamports', () => {
  it('converts whole and fractional SOL to lamports', () => {
    expect(solToLamports('1')).toBe('1000000000');
    expect(solToLamports('0.000000001')).toBe('1');
    expect(solToLamports('1.23456789')).toBe('1234567890');
    expect(solToLamports(',5')).toBe('500000000');
  });

  it('rejects empty, zero, and over-precision amounts', () => {
    expect(solToLamports('')).toBeNull();
    expect(solToLamports('0')).toBeNull();
    expect(solToLamports('0.000000000')).toBeNull();
    expect(solToLamports('0.0000000001')).toBeNull();
    expect(solToLamports('abc')).toBeNull();
  });
});
