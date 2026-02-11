import type { EthereumNft } from '../api/services/ethereum-nft';
import type { BitcoinOrdinal } from '../api/services/bitcoin-nft';
import type { NftAttribute } from '../types/nft';

export type { NftAttribute };

// ============================================================================
// NFT Data Types (shared between packages)
// ============================================================================

/**
 * Blockchain type for NFTs
 */
export type NftBlockchain = 'solana' | 'ethereum' | 'bitcoin';

/**
 * Base NFT data structure shared across all blockchains
 */
export interface NftDataBase {
  mint: string;
  name: string;
  image?: string;
  collectionName?: string;
  description?: string;
  attributes?: NftAttribute[];
  blockchain: NftBlockchain;
}

/**
 * Solana-specific NFT fields
 */
export interface SolanaNftData extends NftDataBase {
  blockchain: 'solana';
  compressed?: boolean;
  tokenStandard?: string;
  collectionKey?: string;
  collectionVerified?: boolean;
  symbol?: string;
  updateAuthority?: string;
  royaltyBps?: number;
}

/**
 * Ethereum-specific NFT fields
 */
export interface EthereumNftData extends NftDataBase {
  blockchain: 'ethereum';
  contractAddress: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  symbol?: string;
  balance?: number;
}

/**
 * Bitcoin Ordinal-specific fields
 */
export interface BitcoinNftData extends NftDataBase {
  blockchain: 'bitcoin';
  inscriptionId: string;
  inscriptionNumber: number;
  contentType: string;
  satRarity?: string;
  sat?: number;
  genesisTransaction?: string;
  genesisHeight?: number;
}

/**
 * Union type for all blockchain NFT types
 */
export type NftData = SolanaNftData | EthereumNftData | BitcoinNftData;

/**
 * Simplified NFT data for components that don't need blockchain-specific fields
 */
export type NftDataSimple = Pick<NftDataBase, 'mint' | 'name' | 'image' | 'collectionName'>;

/**
 * Check if content type is displayable as an image
 *
 * @param contentType - MIME type of the content
 * @returns Whether the content can be displayed as an image
 */
export function isImageContent(contentType: string): boolean {
  const imageTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
  ];
  return imageTypes.includes(contentType.toLowerCase());
}

/**
 * Convert Ethereum NFT to NftData format for UI components
 * Includes all Ethereum-specific fields
 *
 * @param nft - Ethereum NFT from API
 * @returns EthereumNftData for UI components
 */
export function ethereumNftToNftData(nft: EthereumNft): EthereumNftData {
  return {
    blockchain: 'ethereum',
    // Use contract:tokenId as unique identifier
    mint: `${nft.contract}:${nft.mint}`,
    name: nft.name,
    image: nft.media,
    description: nft.description,
    collectionName: nft.collection?.name,
    attributes: nft.extras?.attributes as NftAttribute[],
    // Ethereum-specific fields
    contractAddress: nft.contract,
    tokenId: nft.mint,
    tokenType: nft.standard,
    symbol: nft.symbol,
  };
}

/**
 * Convert Bitcoin Ordinal to NftData format for UI components
 * Includes all Bitcoin-specific fields
 *
 * @param ordinal - Bitcoin Ordinal from API
 * @returns BitcoinNftData for UI components
 */
export function bitcoinOrdinalToNftData(ordinal: BitcoinOrdinal): BitcoinNftData {
  return {
    blockchain: 'bitcoin',
    // Use inscription ID as unique identifier
    mint: ordinal.inscriptionId,
    name: ordinal.name,
    image: ordinal.media,
    description: ordinal.description,
    collectionName: ordinal.collection?.name,
    attributes: ordinal.extras?.attributes as NftAttribute[],
    // Bitcoin-specific fields
    inscriptionId: ordinal.inscriptionId,
    inscriptionNumber: ordinal.inscriptionNumber,
    contentType: ordinal.contentType,
    satRarity: ordinal.satRarity,
    sat: ordinal.extras?.sat,
    genesisTransaction: ordinal.extras?.genesisTransaction,
    genesisHeight: ordinal.extras?.genesisHeight,
  };
}

/**
 * Solana NFT structure from Helius DAS API (internal format)
 */
export interface SolanaNftFromHelius {
  mint: { address: string };
  owner?: string;
  name: string;
  symbol?: string;
  uri?: string;
  description?: string;
  media?: string;
  compressed?: boolean;
  tokenStandard?: string;
  collection?: {
    key: string;
    verified: boolean;
    name?: string;
  };
  updateAuthorityAddress?: string | null;
  sellerFeeBasisPoints?: number;
  extras?: {
    attributes?: Array<{ trait_type: string; value: string | number }>;
    properties?: Record<string, unknown>;
    creators?: Array<{ address: string; share: number; verified: boolean }>;
  };
}

/**
 * Convert Solana NFT to NftData format for UI components
 * Includes all Solana-specific fields
 *
 * @param nft - Solana NFT from Helius DAS API
 * @returns SolanaNftData for UI components
 */
export function solanaNftToNftData(nft: SolanaNftFromHelius): SolanaNftData {
  return {
    blockchain: 'solana',
    mint: nft.mint.address,
    name: nft.name,
    image: nft.media,
    description: nft.description,
    collectionName: nft.collection?.name,
    attributes: nft.extras?.attributes as NftAttribute[],
    // Solana-specific fields
    compressed: nft.compressed,
    tokenStandard: nft.tokenStandard,
    collectionKey: nft.collection?.key,
    collectionVerified: nft.collection?.verified,
    symbol: nft.symbol,
    updateAuthority: nft.updateAuthorityAddress ?? undefined,
    royaltyBps: nft.sellerFeeBasisPoints,
  };
}

/**
 * Type guard to check if NFT is from Solana
 */
export function isSolanaNft(nft: NftData): nft is SolanaNftData {
  return nft.blockchain === 'solana';
}

/**
 * Type guard to check if NFT is from Ethereum
 */
export function isEthereumNft(nft: NftData): nft is EthereumNftData {
  return nft.blockchain === 'ethereum';
}

/**
 * Type guard to check if NFT is from Bitcoin
 */
export function isBitcoinNft(nft: NftData): nft is BitcoinNftData {
  return nft.blockchain === 'bitcoin';
}

/**
 * Get display label for NFT blockchain
 */
export function getNftBlockchainLabel(nft: NftData): string {
  switch (nft.blockchain) {
    case 'solana':
      return 'Solana';
    case 'ethereum':
      return 'Ethereum';
    case 'bitcoin':
      return 'Bitcoin Ordinal';
    default:
      return 'Unknown';
  }
}

/**
 * Get rarity display color for Bitcoin ordinals
 */
export function getSatRarityColor(rarity?: string): string {
  switch (rarity?.toLowerCase()) {
    case 'mythic':
      return '#FF00FF'; // Magenta
    case 'legendary':
      return '#FFD700'; // Gold
    case 'epic':
      return '#9400D3'; // Purple
    case 'rare':
      return '#00BFFF'; // Light blue
    case 'uncommon':
      return '#32CD32'; // Lime green
    case 'common':
    default:
      return '#808080'; // Gray
  }
}
