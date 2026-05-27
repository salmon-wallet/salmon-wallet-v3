export interface DAppConnectApprovalViewProps {
  origin: string;
  appName?: string;
  appIcon?: string;
  address?: string;
  disabled?: boolean;
  loading?: boolean;
  showOriginWarning?: boolean;
  onApprove: () => void | Promise<void>;
  onReject: () => void;
}

export interface DAppSignMessageApprovalViewProps {
  origin: string;
  appName?: string;
  appIcon?: string;
  messageText: string;
  disabled?: boolean;
  loading?: boolean;
  onApprove: () => void | Promise<void>;
  onReject: () => void;
}

export interface DAppTransactionApprovalViewProps {
  origin: string;
  appName?: string;
  appIcon?: string;
  requestSummary: string;
  feeSol: string | null;
  instructionCount: number | null;
  feePayer: string | null;
  recentBlockhash: string | null;
  parsingError: string | null;
  disabled?: boolean;
  loading?: boolean;
  onApprove: () => void | Promise<void>;
  onReject: () => void;
}
