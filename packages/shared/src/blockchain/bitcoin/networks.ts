import * as bitcoin from 'bitcoinjs-lib';
import type { BitcoinNetwork } from '../../types/blockchain';

/**
 * Pre-defined network configurations for common Bitcoin networks
 */
export const BITCOIN_NETWORKS: Record<string, BitcoinNetwork> = {
  'bitcoin-mainnet': {
    id: 'bitcoin-mainnet',
    name: 'Bitcoin Mainnet',
    networkId: 'bitcoin-mainnet',
    environment: 'mainnet',
    config: {
      network: bitcoin.networks.bitcoin,
    },
  },
  'bitcoin-testnet': {
    id: 'bitcoin-testnet',
    name: 'Bitcoin Testnet',
    networkId: 'bitcoin-testnet',
    environment: 'testnet',
    config: {
      network: bitcoin.networks.testnet,
    },
  },
};
