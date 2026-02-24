/**
 * Configuration module.
 *
 * This module exports all configuration constants and types.
 *
 * @module config
 */

export {
  // Types
  type Blockchain,
  type NetworkEnvironment,
  type Explorer,
  type ExplorerWithKey,
  type NetworkExplorers,
  type BlockchainExplorers,
  type ExplorersConfig,
  type DefaultExplorers,
  // Constants
  EXPLORERS,
  DEFAULT_EXPLORERS,
  // Helper functions
  getTransactionUrl,
  getAvailableExplorers,
  getDefaultExplorer,
} from './explorers';

// Blockchain feature-flag configuration
// NOTE: isNetworkEnabled is intentionally not re-exported here to avoid
// colliding with the async isNetworkEnabled in api/services/switch.ts.
// Import directly from '../config/blockchains' when needed.
export {
  ENABLED_BLOCKCHAINS,
  isBlockchainEnabled,
} from './blockchains';
