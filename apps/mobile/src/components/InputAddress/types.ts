/**
 * InputAddress Types
 * Migrated from salmon-wallet-v2/src/features/InputAddress/InputAddress.js
 *
 * Hook-related types (BlockchainType, ValidationState, ValidationCallbackResult,
 * UseAddressValidationReturn, UseAddressValidationOptions) are now defined in
 * @salmon/shared and re-exported from the barrel index.ts for backwards compat.
 */

import type { TextInputProps } from 'react-native';
import type {
  BlockchainType,
  ValidationCallbackResult,
  ValidationState,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
  InputAddressPropsBase,
} from '@salmon/shared';

// Re-export shared types so existing local imports still work
export type {
  BlockchainType,
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from '@salmon/shared';

/**
 * Props for the InputAddress component (React Native)
 */
export interface InputAddressProps
  extends InputAddressPropsBase<TextInputProps['style']>,
    Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange' | 'style'> {}
