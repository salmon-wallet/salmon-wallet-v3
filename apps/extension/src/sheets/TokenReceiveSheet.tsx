/**
 * TokenReceiveSheet - Re-exports ReceiveSheet from @salmon/ui-extension
 *
 * This thin wrapper re-exports the ReceiveSheet component under the
 * local name "TokenReceiveSheet" so consumers in apps/extension can
 * import it with a name that matches the extension routing conventions.
 */

export { ReceiveSheet as TokenReceiveSheet } from '../components';
export type { ReceiveSheetProps as TokenReceiveSheetProps } from '../components';
