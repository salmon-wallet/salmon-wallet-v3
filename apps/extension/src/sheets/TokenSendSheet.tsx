/**
 * TokenSendSheet - Re-exports SendSheet from @salmon/ui-extension
 *
 * This thin wrapper re-exports the SendSheet component under the
 * local name "TokenSendSheet" so consumers in apps/extension can
 * import it with a name that matches the extension routing conventions.
 */

export { SendSheet as TokenSendSheet } from '../components';
export type { SendSheetProps as TokenSendSheetProps } from '../components';
