import type { QRCodePropsBase } from '@salmon/shared';
import type { ViewStyle } from 'react-native';

/**
 * Props for the QRCode component (React Native)
 * No style prop in the mobile version
 */
export interface QRCodeProps extends QRCodePropsBase<ViewStyle> {}
