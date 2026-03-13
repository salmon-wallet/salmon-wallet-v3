import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DAppSignMessageApprovalView,
} from '@salmon/ui';
import {
  approveSolanaSignMessage,
  decodeDAppMessage,
  useAccountsContext,
  type DAppSignMessageApprovalPayload,
  type DAppSignMessageRequest,
  getActiveSolanaApprovalAccount,
} from '@salmon/shared';
import { onRequest, sendResponse } from '../../utils/walletBridge';

export function SignMessageApprovalPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || '';
  const origin = searchParams.get('origin') || '';
  const [state] = useAccountsContext();
  const [request, setRequest] = useState<DAppSignMessageRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onRequest((incoming) => {
      if (incoming.requestId === requestId && incoming.request.method === 'sign') {
        setRequest(incoming.request);
      }
    });

    return unsubscribe;
  }, [requestId]);

  const solanaAccount = useMemo(
    () => getActiveSolanaApprovalAccount(
      state.activeAccount,
      state.activeBlockchainAccount,
      state.pathIndex,
    ),
    [state.activeAccount, state.activeBlockchainAccount, state.pathIndex],
  );

  const messageData = useMemo(() => {
    const data = request?.params?.data;
    if (!data || !Array.isArray(data)) return null;
    return decodeDAppMessage(data);
  }, [request?.params?.data]);

  const handleApprove = useCallback(async () => {
    if (!solanaAccount) return;

    const data = request?.params?.data;
    if (!data || !Array.isArray(data)) return;

    setLoading(true);
    try {
      const payload: DAppSignMessageApprovalPayload = approveSolanaSignMessage(
        solanaAccount,
        data,
      );
      sendResponse({
        requestId,
        approved: true,
        payload,
      });
      window.close();
    } catch (error) {
      sendResponse({
        requestId,
        approved: false,
        error: error instanceof Error ? error.message : 'Message signing failed',
      });
      window.close();
    } finally {
      setLoading(false);
    }
  }, [request?.params?.data, requestId, solanaAccount]);

  const handleReject = useCallback(() => {
    sendResponse({ requestId, approved: false, error: 'User rejected the request' });
    window.close();
  }, [requestId]);

  return (
    <DAppSignMessageApprovalView
      origin={origin}
      messageText={messageData?.text ?? ''}
      disabled={!solanaAccount || !messageData}
      loading={loading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
