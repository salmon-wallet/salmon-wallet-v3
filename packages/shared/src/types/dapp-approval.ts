/**
 * Canonical types for dApp approval flows shared by web and extension.
 */

export interface DAppConnectRequest {
  id: string | number;
  method: 'connect';
  params?: Record<string, unknown>;
}

export interface DAppSignMessageRequest {
  id: string | number;
  method: 'sign';
  params?: {
    data?: number[];
    [key: string]: unknown;
  };
}

export interface DAppSignTransactionRequest {
  id: string | number;
  method: 'signTransaction';
  params?: {
    message?: string;
    network?: string;
    [key: string]: unknown;
  };
}

export interface DAppSignAllTransactionsRequest {
  id: string | number;
  method: 'signAllTransactions';
  params?: {
    messages?: string[];
    network?: string;
    [key: string]: unknown;
  };
}

export interface DAppSignAndSendTransactionRequest {
  id: string | number;
  method: 'signAndSendTransaction';
  params?: {
    message?: string;
    network?: string;
    options?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export type DAppTransactionRequest =
  | DAppSignTransactionRequest
  | DAppSignAllTransactionsRequest
  | DAppSignAndSendTransactionRequest;

export type DAppApprovalRequest =
  | DAppConnectRequest
  | DAppSignMessageRequest
  | DAppTransactionRequest;

export interface DAppConnectApprovalPayload {
  publicKey: string;
}

export interface DAppSignMessageApprovalPayload {
  signature: string;
  publicKey: string;
}

export interface DAppSignTransactionApprovalPayload {
  signature: string;
  publicKey: string;
}

export interface DAppSignAllTransactionsApprovalPayload {
  signatures: string[];
  publicKey: string;
}

export interface DAppSignAndSendTransactionApprovalPayload {
  signature: string;
}

export type DAppTransactionApprovalPayload =
  | DAppSignTransactionApprovalPayload
  | DAppSignAllTransactionsApprovalPayload
  | DAppSignAndSendTransactionApprovalPayload;
