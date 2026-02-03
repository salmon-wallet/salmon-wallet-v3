/**
 * Token data structure representing a cryptocurrency token
 */
export interface Token {
  /** Unique token address/mint */
  address: string;
  /** Token display name */
  name: string;
  /** Token symbol (e.g., 'SOL', 'ETH') */
  symbol: string;
  /** Token logo URL */
  logo?: string;
  /** Current price per token in USD */
  price?: number;
  /** User's token balance (formatted for display) */
  uiAmount: string | number;
  /** User's token balance in USD */
  usdBalance?: number | null;
  /** 24-hour price change information */
  last24HoursChange?: {
    /** Percentage change */
    perc: number;
    /** Absolute change in USD */
    abs?: number;
  } | null;
  /** Token tags (e.g., 'verified', 'strict', 'community') */
  tags?: string[];
  /** Whether the token is verified (has 'verified' or 'strict' tag) */
  isVerified?: boolean;
}

/**
 * Props for the TokenListItem component
 */
export interface TokenListItemProps {
  /** Token data to display */
  token: Token;
  /** Callback when token item is pressed */
  onPress: (token: Token) => void;
  /** Whether to hide balance values */
  hiddenBalance?: boolean;
}

/**
 * Props for the TokenList component
 */
export interface TokenListProps {
  /** Array of tokens to display */
  tokens: Token[];
  /** Whether the list is in a loading state */
  loading?: boolean;
  /** Callback when a token is pressed */
  onTokenPress: (token: Token) => void;
  /** Whether to hide balance values (privacy mode) */
  hiddenBalance?: boolean;
  /** Component to render above the list (for avoiding ScrollView nesting) */
  ListHeaderComponent?: React.ReactElement | null;
  /** Component to render when list is empty */
  ListEmptyComponent?: React.ReactElement | null;
  /** Whether the list is currently refreshing */
  refreshing?: boolean;
  /** Callback when pull-to-refresh is triggered */
  onRefresh?: () => void;
  /** Style for the list content container */
  contentContainerStyle?: object;
}

/**
 * Props for the TokenListSkeleton component
 */
export interface TokenListSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
}
