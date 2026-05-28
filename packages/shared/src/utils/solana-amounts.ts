const LAMPORTS_PER_SOL_BIGINT = 1_000_000_000n;

export function solToLamports(value: string): string | null {
  const normalized = value.trim().replace(',', '.');

  if (!normalized || normalized === '.' || !/^\d*(?:\.\d*)?$/.test(normalized)) {
    return null;
  }

  const [wholeRaw = '0', fractionalRaw = ''] = normalized.split('.');
  if (fractionalRaw.length > 9) {
    return null;
  }

  const whole = wholeRaw || '0';
  const fractional = (fractionalRaw + '000000000').slice(0, 9);
  const lamports = BigInt(whole) * LAMPORTS_PER_SOL_BIGINT + BigInt(fractional);

  return lamports > 0n ? lamports.toString() : null;
}
