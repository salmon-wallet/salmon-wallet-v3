import React, { useCallback, useState } from 'react';
import {
  DAppConnectApprovalView,
} from '@salmon/ui';
import type {
  DAppConnectRequest,
} from '@salmon/shared';

interface DAppConnectPageProps {
  origin: string;
  request: DAppConnectRequest;
  address: string;
  networkId: string | null;
  onApprove: (origin: string) => Promise<void>;
  onDeny: () => void;
  onDismiss: () => void;
}

export function DAppConnectPage({
  origin,
  request,
  address,
  networkId,
  onApprove,
  onDeny,
  onDismiss,
}: DAppConnectPageProps): React.ReactElement {
  const [loading, setLoading] = useState(false);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      await onApprove(origin);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          channel: 'salmon_extension_background_channel',
          data: {
            method: 'connected',
            params: { publicKey: address },
            id: request.id,
          },
        });
      }
      onDismiss();
    } catch (err) {
      console.error('[Salmon] DApp connect approve failed:', err);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          channel: 'salmon_extension_background_channel',
          data: {
            error: 'Failed to approve connection',
            id: request.id,
          },
        });
      }
      onDismiss();
    } finally {
      setLoading(false);
    }
  }, [address, onApprove, onDismiss, origin, request.id]);

  const handleReject = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        channel: 'salmon_extension_background_channel',
        data: {
          error: 'User rejected the request',
          id: request.id,
        },
      });
    }
    onDeny();
    onDismiss();
  }, [onDeny, onDismiss, request.id]);

  return (
    <DAppConnectApprovalView
      origin={origin}
      address={address}
      disabled={!address || !networkId}
      loading={loading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

export default DAppConnectPage;
