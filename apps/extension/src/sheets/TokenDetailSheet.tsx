/**
 * TokenDetailSheet - Re-exports TokenInformationSheet from @salmon/ui-extension
 *
 * This thin wrapper re-exports the TokenInformationSheet component under the
 * local name "TokenDetailSheet" so consumers in apps/extension can
 * import it with a name that matches the extension routing conventions.
 */

export { TokenInformationSheet as TokenDetailSheet } from '@salmon/ui-extension';
export type { TokenInformationSheetProps as TokenDetailSheetProps } from '@salmon/ui-extension';
