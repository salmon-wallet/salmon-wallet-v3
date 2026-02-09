/**
 * ConfirmDialog Component
 *
 * A reusable confirmation dialog for destructive actions.
 * Supports both simple confirmations and password-protected actions.
 *
 * Features:
 * - Danger styling for destructive actions
 * - Optional password verification
 * - Customizable title, message, and button text
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
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { colors, spacing, borderRadius } from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether this is a danger/destructive action */
  isDanger?: boolean;
  /** Whether to require password confirmation */
  requirePassword?: boolean;
  /** Function to validate the password */
  validatePassword?: (password: string) => Promise<boolean>;
  /** Callback when user confirms the action */
  onConfirm: () => Promise<void>;
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

const TitleContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
});

const TitleText = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const WarningIcon = styled(WarningAmberIcon)({
  color: colors.status.error,
  fontSize: 24,
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

const MessageText = styled(Typography)({
  fontSize: 14,
  color: colors.text.secondary,
  lineHeight: 1.6,
  textAlign: 'center',
});

const PasswordSection = styled('div')({
  marginTop: spacing.lg,
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
    '&.Mui-error fieldset': {
      borderColor: colors.status.error,
    },
  },
  '& .MuiInputLabel-root': {
    color: colors.text.secondary,
    '&.Mui-focused': {
      color: colors.accent.primary,
    },
    '&.Mui-error': {
      color: colors.status.error,
    },
  },
  '& .MuiOutlinedInput-input': {
    color: colors.text.primary,
  },
  '& .MuiFormHelperText-root': {
    color: colors.status.error,
  },
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

const ConfirmButton = styled(Button)<{ isDanger?: boolean }>(({ isDanger }) => ({
  flex: 1,
  backgroundColor: isDanger ? colors.status.error : colors.accent.primary,
  color: '#FFFFFF',
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  '&:hover': {
    backgroundColor: isDanger ? '#DC2626' : '#FF7A64',
  },
  '&:disabled': {
    backgroundColor: isDanger
      ? 'rgba(239, 68, 68, 0.3)'
      : 'rgba(255, 92, 69, 0.3)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
}));

// ============================================================================
// Component
// ============================================================================

/**
 * Confirmation dialog for actions that need user verification.
 *
 * @example
 * ```tsx
 * // Simple confirmation
 * <ConfirmDialog
 *   visible={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   title="Remove Wallet"
 *   message="Are you sure you want to remove this wallet?"
 *   confirmText="Remove"
 *   isDanger
 *   onConfirm={handleRemove}
 * />
 *
 * // With password verification
 * <ConfirmDialog
 *   visible={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   title="Remove All Wallets"
 *   message="This will remove all wallets from this device."
 *   confirmText="Remove All"
 *   isDanger
 *   requirePassword
 *   validatePassword={checkPassword}
 *   onConfirm={handleRemoveAll}
 * />
 * ```
 */
export function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  requirePassword = false,
  validatePassword,
  onConfirm,
}: ConfirmDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (visible) {
      setPassword('');
      setPasswordError(null);
      setLoading(false);
    }
  }, [visible]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;

    // Validate password if required
    if (requirePassword && validatePassword) {
      if (!password) {
        setPasswordError(t('errors.password_required', 'Password is required'));
        return;
      }

      setLoading(true);
      try {
        const isValid = await validatePassword(password);
        if (!isValid) {
          setPasswordError(t('errors.invalid_password', 'Invalid password'));
          setLoading(false);
          return;
        }
      } catch {
        setPasswordError(t('errors.password_check_failed', 'Failed to verify password'));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirm action failed:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, requirePassword, validatePassword, password, t, onConfirm, onClose]);

  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
      if (passwordError) {
        setPasswordError(null);
      }
    },
    [passwordError]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleConfirm();
      }
    },
    [handleConfirm]
  );

  const canConfirm = !requirePassword || password.length > 0;

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
    >
      <StyledDialogTitle id="confirm-dialog-title">
        <TitleContainer>
          {isDanger && <WarningIcon />}
          <TitleText>{title}</TitleText>
        </TitleContainer>
        <CloseButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        <MessageText>{message}</MessageText>

        {requirePassword && (
          <PasswordSection>
            <StyledTextField
              fullWidth
              type="password"
              label={t('general.password', 'Password')}
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              error={!!passwordError}
              helperText={passwordError}
              disabled={loading}
              autoFocus
            />
          </PasswordSection>
        )}
      </StyledDialogContent>

      <StyledDialogActions>
        <CancelButton onClick={onClose} disabled={loading}>
          {cancelText || t('actions.cancel', 'Cancel')}
        </CancelButton>
        <ConfirmButton
          isDanger={isDanger}
          onClick={handleConfirm}
          disabled={!canConfirm || loading}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'inherit' }} />
          ) : (
            confirmText || t('actions.confirm', 'Confirm')
          )}
        </ConfirmButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default ConfirmDialog;
