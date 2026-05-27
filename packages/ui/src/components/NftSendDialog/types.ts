import type { BlockchainAccount, NftData } from '@salmon/shared';

export interface NftSendDialogProps {
  visible: boolean;
  onClose: () => void;
  nft: NftData | null;
  account: BlockchainAccount | undefined;
  onSuccess?: (txId: string) => void;
}
