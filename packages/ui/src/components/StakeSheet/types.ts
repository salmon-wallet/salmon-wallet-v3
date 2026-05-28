import type {
  CreateStakeDelegationParams,
  SolanaAccount,
  SolanaNetworkId,
  StakeDelegationResponse,
  StakeValidatorsResponse,
} from '@salmon/shared';
import type { CSSProperties } from 'react';

export interface StakeSheetProps {
  visible: boolean;
  onClose: () => void;
  account?: SolanaAccount | null;
  networkId?: SolanaNetworkId | null;
  getValidators: (networkId: SolanaNetworkId) => Promise<StakeValidatorsResponse>;
  createDelegation: (params: CreateStakeDelegationParams) => Promise<StakeDelegationResponse>;
  onSuccess?: (signature: string) => void;
  className?: string;
  style?: CSSProperties;
}
