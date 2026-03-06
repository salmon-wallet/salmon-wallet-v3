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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius, fontSize, fontWeight, } from '@salmon/shared';
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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing['5xl'], // Account for status bar on mobile
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.scanner.text,
    fontSize: fontSize.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.scanner.text,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  scannerPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: colors.scanner.surface,
    borderRadius: borderRadius.iconLg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
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
    borderColor: colors.scanner.text,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.scanner.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.scanner.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  messageSubtext: {
    fontSize: fontSize.base,
    color: colors.scanner.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    paddingBottom: spacing['5xl'], // Account for home indicator on mobile
  },
  button: {
    backgroundColor: colors.scanner.button,
    paddingVertical: 14,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.scanner.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

export default QRScanner;
