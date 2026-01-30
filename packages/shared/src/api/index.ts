/**
 * API Module Exports
 * Provides API client, configuration, and network services
 */

// Configuration exports
export {
  type Environment,
  getApiUrl,
  getStaticApiUrl,
  detectEnvironment,
  apiConfig,
  API_URL_MAP,
  STATIC_API_URL_MAP,
} from './config';

// Client exports
export {
  // Types
  type ApiResponse,
  type ApiErrorResponse,
  type ApiClientConfig,
  type Network,

  // Error class
  ApiError,

  // Client factory and instances
  createApiClient,
  apiClient,
  staticApiClient,

  // Network service functions
  getNetworks,
  getNetwork,
  clearNetworksCache,

  // Typed request helpers
  get,
  post,
  put,
  patch,
  del,

  // Axios re-exports for advanced usage
  axios,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from './client';

// Services exports
export * from './services';

// Cache exports
export {
  CACHE_TYPES,
  type CacheType,
  cache,
  invalidate,
  clearAllCache,
} from './cache';
