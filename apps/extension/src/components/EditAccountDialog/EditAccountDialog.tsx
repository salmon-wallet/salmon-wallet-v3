/**
 * EditAccountDialog Component
 *
 * A MUI Dialog for editing account name.
 * Follows the same pattern as V2's AccountEditNamePage but as a modal dialog.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Typography from '@mui/material/Typography';
import { colors, spacing } from '@salmon/shared';
import { BaseDialog } from '../BaseDialog';

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

const HelpText = styled(Typography)({
  fontSize: 12,
  color: colors.text.secondary,
  marginTop: spacing.sm,
  textAlign: 'center',
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
    <BaseDialog
      visible={visible}
      onClose={onClose}
      ariaLabelledBy="edit-account-dialog-title"
    >
      <BaseDialog.Header
        title={t('settings.wallets.edit_name', 'Edit Account Name')}
      />

      <BaseDialog.Content>
        <BaseDialog.TextField
          autoFocus
          label={t('general.name', 'Name')}
          value={name}
          onChange={setName}
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
      </BaseDialog.Content>

      <BaseDialog.Actions>
        <BaseDialog.CancelButton onClick={onClose} disabled={saving}>
          {t('common.cancel', 'Cancel')}
        </BaseDialog.CancelButton>
        <BaseDialog.ActionButton
          onClick={handleSave}
          disabled={!isValid || !hasChanged}
          loading={saving}
        >
          {t('actions.save', 'Save')}
        </BaseDialog.ActionButton>
      </BaseDialog.Actions>
    </BaseDialog>
  );
}

export default EditAccountDialog;
