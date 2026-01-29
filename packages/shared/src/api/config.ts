/**
 * API Configuration
 * Migrated from salmon-wallet-v2/src/adapter/constants/environment.js
 */

// Environment types supported by the application
export type Environment = 'local' | 'development' | 'main' | 'production';

// API URL configuration by environment
const API_URLS: Record<Environment, string> = {
  local: 'http://localhost:3000/local',
  development: 'https://d1ms6b491qeh6d.cloudfront.net',
  main: 'https://bo0q5g7ie1.execute-api.us-east-1.amazonaws.com/main',
  production: 'https://te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod',
};

// Static API URL configuration by environment
const STATIC_API_URLS: Record<Environment, string> = {
  local: 'http://localhost:3000/local',
  development: 'https://d1fh2pwo7kzely.cloudfront.net',
  main: 'https://d1fh2pwo7kzely.cloudfront.net',
  production: 'https://d1fh2pwo7kzely.cloudfront.net',
};

/**
 * Get environment variable value, supporting both Expo (mobile) and Vite (extension) formats
 */
function getEnvVar(name: string): string | undefined {
  // Check for Expo format (EXPO_PUBLIC_*)
  const expoKey = `EXPO_PUBLIC_${name}`;
  // Check for Vite format (VITE_*)
  const viteKey = `VITE_${name}`;

  // Access process.env safely for different environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[expoKey] || process.env[viteKey] || process.env[name];
  }

  // For Vite environments, check import.meta.env
  // @ts-expect-error - import.meta.env may not exist in all environments
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-expect-error - import.meta.env may not exist in all environments
    return import.meta.env[viteKey] || import.meta.env[name];
  }

  return undefined;
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
    case 'development':
      return 'development';
    case 'test':
    case 'local':
      return 'local';
    default:
      return 'development';
  }
}

/**
 * Type guard to check if a string is a valid Environment
 */
function isValidEnvironment(value: string): value is Environment {
  return ['local', 'development', 'main', 'production'].includes(value);
}

/**
 * Get the API URL for a given environment
 * Supports environment variable override via EXPO_PUBLIC_API_URL or VITE_API_URL
 */
export function getApiUrl(env?: Environment): string {
  // Check for environment variable override
  const override = getEnvVar('API_URL');
  if (override) {
    return override;
  }

  const environment = env ?? detectEnvironment();
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
