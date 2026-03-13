export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requirePassword?: boolean;
  validatePassword?: (password: string) => Promise<boolean>;
  onConfirm: () => Promise<void>;
}
