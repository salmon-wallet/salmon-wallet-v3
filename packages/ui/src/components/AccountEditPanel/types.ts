export interface AccountEditPanelProps {
  accountId: string;
  onEditName: (accountId: string) => void;
  onEditAvatar: () => void;
  onBackupSeed: () => void;
  onExportPrivateKey: () => void;
  onBack: () => void;
}
