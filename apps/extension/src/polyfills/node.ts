import { Buffer } from 'buffer';

// Ensure browser extension entrypoints expose the minimal Node globals
// expected by Solana/web3 ecosystem packages.
(globalThis as Record<string, unknown>).Buffer = Buffer;

const currentProcess =
  (globalThis as Record<string, unknown>).process &&
  typeof (globalThis as Record<string, unknown>).process === 'object'
    ? ((globalThis as Record<string, unknown>).process as Record<string, unknown>)
    : {};

// Only expose an explicit allowlist of build-time env values to the runtime
// process.env shim. Never spread `import.meta.env` wholesale: Vite inlines the
// entire VITE_-prefixed env object, which would bake any local secret (e.g. a
// VITE_HELIUS_API_KEY left in a developer .env) into the shipped bundle and
// make the build output depend on the builder's local environment.
(globalThis as Record<string, unknown>).process = {
  ...currentProcess,
  env: {
    ...(typeof currentProcess.env === 'object' && currentProcess.env ? currentProcess.env : {}),
    VITE_SALMON_ENV: import.meta.env.VITE_SALMON_ENV,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_STATIC_API_URL: import.meta.env.VITE_STATIC_API_URL,
    VITE_API_HOST: import.meta.env.VITE_API_HOST,
    VITE_API_PORT: import.meta.env.VITE_API_PORT,
    NODE_ENV: import.meta.env.MODE ?? 'development',
  },
};
