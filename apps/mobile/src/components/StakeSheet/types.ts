import type {
  CreateStakeDelegationParams,
  SolanaAccount,
  SolanaNetworkId,
  StakeDelegationResponse,
  StakeValidatorsResponse,
} from '@salmon/shared';
import type { ViewStyle } from 'react-native';

export interface StakeSheetProps {
  visible: boolean;
  onClose: () => void;
  account?: SolanaAccount | null;
  networkId?: SolanaNetworkId | null;
  getValidators: (networkId: SolanaNetworkId) => Promise<StakeValidatorsResponse>;
  createDelegation: (params: CreateStakeDelegationParams) => Promise<StakeDelegationResponse>;
  onSuccess?: (signature: string) => void;
  style?: ViewStyle;
}
