/**
 * QRScanner - Web Version
 *
 * QR code scanning is not available on web platforms.
 * This component displays a message directing users to use the mobile app.
 */

import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@salmon/shared';
import type { QRScannerProps } from './types';

/**
 * QRScanner component for web platforms.
 * Displays a message indicating that QR scanning is only available on mobile.
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  visible,
  onClose,
  title = 'Scan QR Code',
  containerStyle,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      visible={visible}
      transparent={false}
    >
      <View style={[styles.container, containerStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{'📱'}</Text>
          </View>
          <Text style={styles.messageTitle}>QR Scanner Unavailable</Text>
          <Text style={styles.messageText}>
            QR code scanning is only available on the mobile app.
          </Text>
          <Text style={styles.messageSubtext}>
            Please use the Salmon Wallet mobile app to scan QR codes.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.scanner.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.scanner.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.scanner.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: colors.scanner.textSecondary,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.scanner.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.scanner.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: colors.scanner.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  messageSubtext: {
    fontSize: 14,
    color: colors.scanner.textTertiary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  button: {
    backgroundColor: colors.scanner.button,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.scanner.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScanner;
