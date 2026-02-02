/**
 * Re-export all assets from @salmon/assets package
 *
 * This file provides backward compatibility for any imports from @salmon/ui/assets.
 * All assets are centralized in the @salmon/assets package.
 *
 * Usage:
 *   import { Logo, AppIcon } from '@salmon/assets';
 *   // or for backward compatibility:
 *   import { Logo, AppIcon } from '@salmon/ui/assets';
 */

export * from '@salmon/assets';
