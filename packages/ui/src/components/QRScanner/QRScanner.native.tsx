/**
 * QRScanner - Native Version (Placeholder)
 *
 * This is a placeholder component for QR code scanning on React Native.
 * Full implementation requires native camera configuration:
 * - For Expo: expo-camera or expo-barcode-scanner
 * - For bare React Native: react-native-camera or react-native-qrcode-scanner
 *
 * TODO: Implement actual QR scanning once native dependencies are configured.
 */

import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import type { QRScannerProps } from './types';

/**
 * QRScanner component for React Native platforms.
 * Currently a placeholder - requires native camera configuration.
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
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.scannerPlaceholder}>
            <View style={styles.markerContainer}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Camera Setup Required</Text>
            <Text style={styles.messageText}>
              QR Scanner requires native camera configuration.
            </Text>
            <Text style={styles.messageSubtext}>
              Please configure expo-camera or react-native-camera to enable QR
              code scanning.
            </Text>
          </View>
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
    paddingTop: 48, // Account for status bar on mobile
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scannerPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  markerContainer: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  messageContainer: {
    alignItems: 'center',
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
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 48, // Account for home indicator on mobile
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
