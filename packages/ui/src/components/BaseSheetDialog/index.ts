/**
 * BaseSheetDialog - Compound component for sheet dialogs
 *
 * @example
 * ```tsx
 * <BaseSheetDialog visible={visible} onClose={onClose} size="small">
 *   <BaseSheetDialog.StandardHeader title="Receive" />
 *   <BaseSheetDialog.Content padding="lg">
 *     {content}
 *   </BaseSheetDialog.Content>
 * </BaseSheetDialog>
 * ```
 */

import { BaseSheetDialog as BaseSheetDialogRoot } from './BaseSheetDialog';
import { StandardHeader } from './StandardHeader';
import { HandleHeader } from './HandleHeader';
import { Content } from './Content';

// Wire up compound component pattern
export const BaseSheetDialog = Object.assign(BaseSheetDialogRoot, {
  StandardHeader,
  HandleHeader,
  Content,
});

export { useBaseSheetDialog } from './BaseSheetDialog';

export type {
  BaseSheetDialogProps,
  StandardHeaderProps,
  HandleHeaderProps,
  ContentProps,
} from './types';
