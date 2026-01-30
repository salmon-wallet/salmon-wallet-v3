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
