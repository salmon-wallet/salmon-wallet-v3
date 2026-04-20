import React, { useCallback, useMemo, useState } from 'react';
import {
  DAppSignMessageApprovalView,
} from '@salmon/ui';
import {
  approveSolanaSignMessage,
  decodeDAppMessage,
  type BlockchainAccount,
  type DAppSignMessageRequest,
} from '@salmon/shared';
import { isSolanaAccount } from '@salmon/shared/utils/account';

interface Props {
  origin: string;
  request: DAppSignMessageRequest;
  account: BlockchainAccount | undefined;
  onDismiss: (approved: boolean) => void;
}

export function DAppSignMessageApprovalPage({
  origin,
  request,
  account,
  onDismiss,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState(false);

  const messageData = useMemo(() => {
    const data = request.params?.data;
    if (!data || !Array.isArray(data)) return null;
    return decodeDAppMessage(data);
  }, [request.params?.data]);

  const sendToBackground = useCallback((data: Record<string, unknown>) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        channel: 'salmon_extension_background_channel',
        data: {
          ...data,
          id: request.id,
        },
      });
    }
  }, [request.id]);

  const handleReject = useCallback(() => {
    sendToBackground({ error: 'User rejected the request' });
    onDismiss(false);
  }, [onDismiss, sendToBackground]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      if (!account || !isSolanaAccount(account)) {
        throw new Error('Solana account not available');
      }

      const data = request.params?.data;
      if (!data || !Array.isArray(data)) {
        throw new Error('Missing message data');
      }

      const result = approveSolanaSignMessage(account, data);
      sendToBackground({ result });
      onDismiss(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Message signing failed';
      sendToBackground({ error: message });
      onDismiss(false);
    } finally {
      setLoading(false);
    }
  }, [account, onDismiss, request.params?.data, sendToBackground]);

  return (
    <DAppSignMessageApprovalView
      origin={origin}
      messageText={messageData?.text ?? ''}
      disabled={!account || !messageData}
      loading={loading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
