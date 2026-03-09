import type { EthereumNetwork } from '../../types/blockchain';

/**
 * Pre-defined network configurations for common Ethereum networks.
 *
 * Note: RPC URLs are placeholders and should be configured with actual
 * endpoints (Infura, Alchemy, or your own Salmon API endpoint).
 */
export const ETHEREUM_NETWORKS: Record<string, EthereumNetwork> = {
  'ethereum-mainnet': {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    networkId: 'ethereum-mainnet',
    environment: 'mainnet',
    config: {
      rpcUrl: 'https://eth.llamarpc.com',
      chainId: 1,
    },
  },
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    name: 'Sepolia Testnet',
    networkId: 'ethereum-sepolia',
    environment: 'sepolia',
    config: {
      rpcUrl: 'https://rpc.sepolia.org',
      chainId: 11155111,
    },
  },
};
