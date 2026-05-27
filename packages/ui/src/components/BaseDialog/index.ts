/**
 * BaseDialog - Compound component for dialogs
 *
 * @example
 * ```tsx
 * <BaseDialog visible={visible} onClose={onClose}>
 *   <BaseDialog.Header title="Confirm" showWarning />
 *   <BaseDialog.Content>
 *     <p>Are you sure?</p>
 *   </BaseDialog.Content>
 *   <BaseDialog.Actions>
 *     <BaseDialog.CancelButton onClick={onClose}>Cancel</BaseDialog.CancelButton>
 *     <BaseDialog.ActionButton onClick={confirm} isDanger>Delete</BaseDialog.ActionButton>
 *   </BaseDialog.Actions>
 * </BaseDialog>
 * ```
 */

import { BaseDialog as BaseDialogRoot } from './BaseDialog';
import { Header } from './Header';
import { Content } from './Content';
import { Actions } from './Actions';
import { TextField } from './TextField';
import { CancelButton, ActionButton } from './Buttons';

// Wire up compound component pattern
export const BaseDialog = Object.assign(BaseDialogRoot, {
  Header,
  Content,
  Actions,
  TextField,
  CancelButton,
  ActionButton,
});

export { useBaseDialog } from './BaseDialog';

export type {
  BaseDialogProps,
  HeaderProps,
  ContentProps,
  ActionsProps,
  TextFieldProps,
  CancelButtonProps,
  ActionButtonProps,
} from './types';

export { MessageText } from './styles';
