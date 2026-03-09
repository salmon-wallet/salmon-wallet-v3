import type { SolanaNetwork } from '../../types/blockchain';

/**
 * Pre-defined network configurations for common Solana networks.
 * RPC URLs here are public fallbacks — useAvailableNetworks merges
 * the real URLs from the backend API at runtime.
 */
export const SOLANA_NETWORKS: Record<string, SolanaNetwork> = {
  'solana-mainnet': {
    id: 'solana-mainnet',
    networkId: 'solana-mainnet',
    name: 'Mainnet Beta',
    config: {
      nodeUrl: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
    },
  },
  'solana-devnet': {
    id: 'solana-devnet',
    networkId: 'solana-devnet',
    name: 'Devnet',
    config: {
      nodeUrl: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
    },
  },
};
