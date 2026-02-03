import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getIconSize } from '@salmon/shared';
import type { IconName } from '@salmon/shared';
import type { IconProps } from './types';

/**
 * Mapping from unified icon names to Ionicons names
 */
const ICON_MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  // Navigation
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'chevron-right': 'chevron-forward',
  'chevron-left': 'chevron-back',
  close: 'close',
  back: 'arrow-back',
  // Actions
  send: 'arrow-up',
  receive: 'arrow-down',
  copy: 'copy-outline',
  refresh: 'refresh',
  settings: 'settings-outline',
  'qr-code': 'qr-code-outline',
  scan: 'scan-outline',
  // Visibility
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  // Security
  lock: 'lock-closed-outline',
  unlock: 'lock-open-outline',
  shield: 'shield-checkmark-outline',
  key: 'key-outline',
  fingerprint: 'finger-print-outline',
  // Wallet
  wallet: 'wallet-outline',
  activity: 'time-outline',
  swap: 'swap-horizontal-outline',
  // Status
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark-circle',
  alert: 'warning-outline',
  'alert-circle': 'alert-circle',
  info: 'information-outline',
  'info-circle': 'information-circle',
  // Token features
  diamond: 'diamond-outline',
  people: 'people-outline',
  layers: 'layers-outline',
  image: 'image-outline',
  'game-controller': 'game-controller-outline',
  analytics: 'analytics-outline',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  cash: 'cash-outline',
  card: 'card-outline',
  cloud: 'cloud-outline',
  star: 'star-outline',
  heart: 'heart-outline',
  tag: 'pricetag-outline',
  // Misc
  add: 'add',
  remove: 'remove',
  search: 'search-outline',
  menu: 'menu-outline',
  more: 'ellipsis-horizontal',
  link: 'link-outline',
  'external-link': 'open-outline',
};

/**
 * Unified Icon component for React Native
 *
 * Wraps Ionicons with a consistent API matching the unified icon system.
 *
 * @example
 * ```tsx
 * <Icon name="send" size="md" color={colors.accent.primary} />
 * <Icon name="settings" size={24} />
 * <Icon name="eye" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = colors.text.primary,
  style,
  testID,
  accessibilityLabel,
}) => {
  const ioniconsName = ICON_MAP[name];
  const numericSize = getIconSize(size);

  return (
    <View style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
      <Ionicons name={ioniconsName} size={numericSize} color={color} />
    </View>
  );
};

export default Icon;
