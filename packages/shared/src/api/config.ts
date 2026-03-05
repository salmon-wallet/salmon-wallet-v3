/**
 * API Configuration
 * Migrated from salmon-wallet-v2/src/adapter/constants/environment.js
 *
 * Environments:
 * - local: For local development, supports Docker via env vars
 * - staging: Staging environment (TODO: update when ready)
 * - production: Production environment (TODO: update when ready)
 */

// Environment types supported by the application
// Note: 'development' environment has been deprecated and removed
export type Environment = 'local' | 'staging' | 'production';

// Valid environment values for type guards
const VALID_ENVIRONMENTS: Environment[] = ['local', 'staging', 'production'];

// Default ports and hosts for local development
const DEFAULT_LOCAL_HOST = 'localhost';
const DEFAULT_LOCAL_PORT = 3000;

// API URL configuration by environment
// Note: Local uses /local prefix because serverless-offline adds it to all routes
const API_URLS: Record<Environment, string> = {
  local: `http://${DEFAULT_LOCAL_HOST}:${DEFAULT_LOCAL_PORT}/local`,
  staging: 'https://te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod',
  production: 'https://te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod',
};

// Static API URL configuration by environment
// Note: Local uses /local prefix because serverless-offline adds it to all routes
const STATIC_API_URLS: Record<Environment, string> = {
  local: `http://${DEFAULT_LOCAL_HOST}:${DEFAULT_LOCAL_PORT}/local`,
  staging: 'https://d1fh2pwo7kzely.cloudfront.net',
  production: 'https://d1fh2pwo7kzely.cloudfront.net',
};

/**
 * Get environment variable value, supporting both Expo (mobile) and Vite (extension/web) formats
 *
 * IMPORTANT: babel-preset-expo only inlines STATIC dot-notation references to process.env.
 * Dynamic access like process.env[key] is NOT replaced and returns undefined at runtime.
 * The static map below ensures each EXPO_PUBLIC_* variable is referenced with dot notation
 * so babel can inline the values. The resulting JS object supports dynamic key lookup.
 *
 * For Vite environments:
 * - process.env is defined as a real JSON object at build time (via vite.config.ts define)
 * - Both static and dynamic access work, so the fallback path handles Vite correctly
 */
function getEnvVar(name: string): string | undefined {
  // Static dot-notation references required for babel-preset-expo inline replacement.
  // Each value is inlined at compile time in Expo/Metro builds.
  // In Vite builds these resolve to undefined (no EXPO_PUBLIC_ vars), falling through below.
  // In tests (Node.js) these read from the real process.env object at call time.
  const expoValue = ({
    SALMON_ENV: process.env.EXPO_PUBLIC_SALMON_ENV,
    API_HOST: process.env.EXPO_PUBLIC_API_HOST,
    API_PORT: process.env.EXPO_PUBLIC_API_PORT,
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    STATIC_API_URL: process.env.EXPO_PUBLIC_STATIC_API_URL,
  } as Record<string, string | undefined>)[name];

  if (expoValue) return expoValue;

  // Fallback: dynamic access for Vite (process.env is a real object) and Node.js
  const viteKey = `VITE_${name}`;
  if (typeof process !== 'undefined' && process.env) {
    return process.env[viteKey] || process.env[name];
  }

  return undefined;
}

/**
 * Helper function to construct local API URL for Docker flexibility
 * Reads from EXPO_PUBLIC_API_HOST/VITE_API_HOST and EXPO_PUBLIC_API_PORT/VITE_API_PORT env vars
 *
 * @param host - Optional host override (defaults to env var or localhost)
 * @param port - Optional port override (defaults to env var or 3000)
 * @returns The constructed local API URL
 *
 * @example
 * // With no args, uses env vars or defaults
 * getLocalApiUrl() // "http://localhost:3000"
 *
 * // Docker on different host
 * getLocalApiUrl('host.docker.internal', 3001) // "http://host.docker.internal:3001"
 *
 * // Or set EXPO_PUBLIC_API_HOST=host.docker.internal in .env
 */
export function getLocalApiUrl(host?: string, port?: number): string {
  const envHost = getEnvVar('API_HOST');
  const envPort = getEnvVar('API_PORT');

  let finalHost = host ?? envHost ?? DEFAULT_LOCAL_HOST;
  const finalPort = port ?? (envPort ? parseInt(envPort, 10) : DEFAULT_LOCAL_PORT);

  // Android emulator runs in a VM where localhost/127.0.0.1 refers to the
  // emulator itself, not the host machine. 10.0.2.2 is the special alias
  // that Android emulator maps to the host's loopback interface.
  // Note: process.env.EXPO_OS (without optional chaining) is required for
  // babel-preset-expo to inline it at build time.
  const expoOS = typeof process !== 'undefined' && process.env ? process.env.EXPO_OS : undefined;
  if (
    (finalHost === 'localhost' || finalHost === '127.0.0.1') &&
    expoOS === 'android'
  ) {
    finalHost = '10.0.2.2';
  }

  // Note: /local prefix is required because serverless-offline adds it to all routes
  return `http://${finalHost}:${finalPort}/local`;
}

/**
 * Detect the current environment from environment variables
 */
export function detectEnvironment(): Environment {
  const envOverride = getEnvVar('SALMON_ENV');
  if (envOverride && isValidEnvironment(envOverride)) {
    return envOverride;
  }

  // Check NODE_ENV as fallback
  const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined;

  switch (nodeEnv) {
    case 'production':
      return 'production';
    case 'test':
    case 'development': // Map deprecated NODE_ENV=development to 'local'
      return 'local';
    default:
      // Handles any non-standard NODE_ENV values (including 'local' if ever set)
      return 'local';
  }
}

/**
 * Type guard to check if a string is a valid Environment
 */
function isValidEnvironment(value: string): value is Environment {
  return VALID_ENVIRONMENTS.includes(value as Environment);
}

/**
 * Get the API URL for a given environment
 * Supports environment variable override via EXPO_PUBLIC_API_URL or VITE_API_URL
 *
 * For local development with Docker, you can also use:
 * - EXPO_PUBLIC_API_HOST / VITE_API_HOST
 * - EXPO_PUBLIC_API_PORT / VITE_API_PORT
 */
export function getApiUrl(env?: Environment): string {
  // Check for full URL override first
  const override = getEnvVar('API_URL');
  if (override) {
    return override;
  }

  const environment = env ?? detectEnvironment();

  // For local environment, use the helper to support Docker env vars
  if (environment === 'local') {
    return getLocalApiUrl();
  }

  return API_URLS[environment];
}

/**
 * Get the static API URL for a given environment
 * Supports environment variable override via EXPO_PUBLIC_STATIC_API_URL or VITE_STATIC_API_URL
 */
export function getStaticApiUrl(env?: Environment): string {
  // Check for environment variable override
  const override = getEnvVar('STATIC_API_URL');
  if (override) {
    return override;
  }

  const environment = env ?? detectEnvironment();

  // For local environment, use the helper to support Docker env vars
  if (environment === 'local') {
    return getLocalApiUrl();
  }

  return STATIC_API_URLS[environment];
}

/**
 * API configuration object for backward compatibility
 */
export const apiConfig = {
  get baseUrl(): string {
    return getApiUrl();
  },
  get staticBaseUrl(): string {
    return getStaticApiUrl();
  },
  get environment(): Environment {
    return detectEnvironment();
  },
};

// Export constants for direct access
export const API_URL_MAP = API_URLS;
export const STATIC_API_URL_MAP = STATIC_API_URLS;
