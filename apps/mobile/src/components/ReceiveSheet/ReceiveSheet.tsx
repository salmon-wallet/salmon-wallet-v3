import {
  colors,
  componentSizes,
  fontFamilyNative,
  ms,
  s,
  vs,
} from '@salmon/shared';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { BottomSheetContainer } from '../BottomSheetContainer';
import { ContentCopySvgIcon } from '../Icon/SvgIcons';
import QRCode from '../QRCode';
import type { ReceiveSheetProps } from './types';

// Layout constants
const CONTENT_PADDING_HORIZONTAL = 24;
const COPY_FEEDBACK_DURATION = 2000;

/**
 * ReceiveSheet - Bottom sheet modal for receiving tokens
 *
 * Features:
 * - Slide-up animation from bottom
 * - Rounded top corners with border (26px radius)
 * - Drag handle indicator
 * - QR code for wallet address
 * - Full address display
 * - Copy address button
 * - Backdrop with tap-to-dismiss
 *
 * @example
 * ```tsx
 * <ReceiveSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   address="3NE4QmUT15PGZTPpqHjGH6VKUdXrpTKb82NGqYuQdXdL"
 *   onCopy={() => copyToClipboard(address)}
 * />
 * ```
 */
export const ReceiveSheet: React.FC<ReceiveSheetProps> = ({
  visible,
  onClose,
  address,
  onCopy,
  style,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  // Calculate QR size: full width minus padding and border
  const qrSize = screenWidth - (CONTENT_PADDING_HORIZONTAL * 2) - (componentSizes.qrBorderWidth * 2);

  // Reset copied state when sheet closes
  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible]);

  const handleCopyPress = useCallback(() => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
  }, [onCopy]);

  const title = (
    <Text style={styles.title}>{t('wallet.receive.title')}</Text>
  );

  return (
    <BottomSheetContainer
      visible={visible}
      onClose={onClose}
      title={title}
      style={[styles.sheetContainer, style]}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* QR Code Container */}
        <View style={styles.qrContainer}>
          <QRCode
            value={address}
            size={qrSize}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </View>

        {/* Address */}
        <Text style={styles.address} selectable>
          {address}
        </Text>

        {/* Copy Button */}
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('wallet.receive.copyAddress')}
        >
          {copied ? (
            <Ionicons name="checkmark" size={ms(23)} color="#000000" />
          ) : (
            <ContentCopySvgIcon size={ms(23)} color="#000000" />
          )}
          <Text style={styles.copyButtonText}>
            {copied ? t('wallet.receive.copied') : t('wallet.receive.copyAddress')}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    minHeight: undefined,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  title: {
    fontSize: ms(24),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.24,
    lineHeight: ms(24 * 1.3),
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: s(CONTENT_PADDING_HORIZONTAL),
    paddingBottom: vs(40),
    gap: vs(componentSizes.receiveContentGap),
  },
  qrContainer: {
    borderRadius: ms(16),
    borderWidth: componentSizes.qrBorderWidth,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: vs(18),
  },
  address: {
    fontSize: ms(14),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.14,
    lineHeight: ms(14 * 1.3),
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcfcfc',
    borderRadius: ms(11),
    width: s(180),
    height: vs(42),
    gap: s(4),
  },
  copyButtonText: {
    fontSize: ms(15),
    fontFamily: fontFamilyNative.bold,
    color: '#000000',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default ReceiveSheet;
