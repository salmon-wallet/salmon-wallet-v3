import { Buffer } from 'buffer';

// Ensure browser extension entrypoints expose the minimal Node globals
// expected by Solana/web3 ecosystem packages.
(globalThis as Record<string, unknown>).Buffer = Buffer;

const currentProcess =
  (globalThis as Record<string, unknown>).process &&
  typeof (globalThis as Record<string, unknown>).process === 'object'
    ? ((globalThis as Record<string, unknown>).process as Record<string, unknown>)
    : {};

(globalThis as Record<string, unknown>).process = {
  ...currentProcess,
  env: {
    ...(typeof currentProcess.env === 'object' && currentProcess.env ? currentProcess.env : {}),
    ...import.meta.env,
    NODE_ENV: import.meta.env.MODE ?? 'development',
  },
};
