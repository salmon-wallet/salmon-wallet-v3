/**
 * EditAccountDialog Component
 *
 * A MUI Dialog for editing account name.
 * Follows the same pattern as V2's AccountEditNamePage but as a modal dialog.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { colors, spacing, borderRadius } from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface EditAccountDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** The current account name */
  currentName: string;
  /** The account ID being edited */
  accountId: string;
  /** Callback when the user saves the new name */
  onSave: (accountId: string, newName: string) => Promise<void>;
}

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.dialog.border}`,
    minWidth: 340,
    maxWidth: 400,
  },
});

const StyledDialogTitle = styled(DialogTitle)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
});

const TitleText = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: `${spacing.xl}px`,
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    '& fieldset': {
      borderColor: colors.border.default,
    },
    '&:hover fieldset': {
      borderColor: colors.border.light,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.primary,
    },
  },
  '& .MuiInputLabel-root': {
    color: colors.text.secondary,
    '&.Mui-focused': {
      color: colors.accent.primary,
    },
  },
  '& .MuiOutlinedInput-input': {
    color: colors.text.primary,
  },
});

const HelpText = styled(Typography)({
  fontSize: 12,
  color: colors.text.secondary,
  marginTop: spacing.sm,
  textAlign: 'center',
});

const StyledDialogActions = styled(DialogActions)({
  padding: `${spacing.md}px ${spacing.xl}px ${spacing.xl}px`,
  gap: spacing.md,
});

const CancelButton = styled(Button)({
  flex: 1,
  backgroundColor: colors.button.secondaryBackground,
  color: colors.button.secondaryText,
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const SaveButton = styled(Button)({
  flex: 1,
  backgroundColor: colors.accent.primary,
  color: '#FFFFFF',
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  '&:hover': {
    backgroundColor: '#FF7A64', // Lighter shade of accent
  },
  '&:disabled': {
    backgroundColor: 'rgba(255, 92, 69, 0.3)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog for editing an account's name.
 *
 * @example
 * ```tsx
 * <EditAccountDialog
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   currentName={account.name}
 *   accountId={account.id}
 *   onSave={async (id, name) => {
 *     await actions.editAccount(id, { name });
 *   }}
 * />
 * ```
 */
export function EditAccountDialog({
  visible,
  onClose,
  currentName,
  accountId,
  onSave,
}: EditAccountDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  // Reset name when dialog opens with new account
  useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || saving) return;

    setSaving(true);
    try {
      await onSave(accountId, name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }, [name, saving, accountId, onSave, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && name.trim()) {
        handleSave();
      }
    },
    [handleSave, name]
  );

  const isValid = name.trim().length > 0;
  const hasChanged = name.trim() !== currentName;

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="edit-account-dialog-title"
    >
      <StyledDialogTitle id="edit-account-dialog-title">
        <TitleText>
          {t('settings.wallets.edit_name', 'Edit Account Name')}
        </TitleText>
        <CloseButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        <StyledTextField
          autoFocus
          fullWidth
          label={t('general.name', 'Name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          error={!isValid && name.length > 0}
          placeholder={t('settings.wallets.account_name_placeholder', 'Enter account name')}
        />
        <HelpText>
          {t(
            'settings.wallets.edit_name_disclaimer',
            'This name is only visible to you and stored locally.'
          )}
        </HelpText>
      </StyledDialogContent>

      <StyledDialogActions>
        <CancelButton onClick={onClose} disabled={saving}>
          {t('common.cancel', 'Cancel')}
        </CancelButton>
        <SaveButton
          onClick={handleSave}
          disabled={!isValid || !hasChanged || saving}
        >
          {saving ? t('common.saving', 'Saving...') : t('actions.save', 'Save')}
        </SaveButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default EditAccountDialog;
