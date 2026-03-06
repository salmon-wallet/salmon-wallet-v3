/**
 * SettingsScreenLayout - Reusable layout component for settings screens
 *
 * Provides a consistent layout structure for all settings screens including:
 * - Gradient background
 * - Safe area handling
 * - Header with back navigation
 * - Title and optional subtitle
 * - Scrollable content area
 *
 * This component eliminates ~150 lines of duplicated code per settings screen.
 */

import React, { type ReactNode } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import {
  colors,
  spacing,
  contentPadding,
fontSize, fontFamilyNative, } from '@salmon/shared';
import { ScreenHeader } from '../ScreenHeader';

// ============================================================================
// Types
// ============================================================================

export interface SettingsScreenLayoutProps {
  /** The main title of the screen */
  title: string;
  /** Optional subtitle text shown below the title */
  subtitle?: string;
  /** Content to render in the scrollable area */
  children: ReactNode;
  /** Back navigation handler (required) */
  onBack: () => void;
  /** Whether to show vertical scroll indicator. Default: false */
  showsVerticalScrollIndicator?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsScreenLayout({
  title,
  subtitle,
  children,
  onBack,
  showsVerticalScrollIndicator = false,
}: SettingsScreenLayoutProps) {

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <ScreenHeader onBack={onBack} />

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Subtitle (optional) */}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: fontSize['2xl'],
    lineHeight: 32,
    marginBottom: spacing.lg,
    paddingHorizontal: contentPadding.screen,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.base,
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: contentPadding.screen,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: contentPadding.screen,
    paddingBottom: spacing['2xl'],
  },
});
