/**
 * Props for the TokenInfo component (base - platform-agnostic)
 * Displays token information including description, market data, and links
 */
export interface TokenInfoPropsBase<TStyle = any> {
  /** Token description/about text */
  description?: string;
  /** Market capitalization in USD */
  marketCap?: number;
  /** 24-hour trading volume in USD */
  volume24h?: number;
  /** Circulating supply */
  circulatingSupply?: number;
  /** Total supply */
  totalSupply?: number;
  /** Maximum supply (if applicable) */
  maxSupply?: number;
  /** Token contract/mint address */
  contractAddress?: string;
  /** Project website URL */
  website?: string;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: TStyle;
}
