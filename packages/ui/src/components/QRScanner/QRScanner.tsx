/**
 * QRScanner - Web Version
 *
 * QR code scanning is not available on web platforms.
 * This component displays a message directing users to use the mobile app.
 */

import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
            <Text style={styles.icon}>📱</Text>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#8b8b9e',
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
    backgroundColor: '#2a2a4e',
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
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#8b8b9e',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageSubtext: {
    fontSize: 14,
    color: '#6b6b7e',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  button: {
    backgroundColor: '#4a4a6e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScanner;
