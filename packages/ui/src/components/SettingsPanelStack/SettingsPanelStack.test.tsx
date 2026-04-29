/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@salmon/shared', () => {
  const { useState, useCallback } = require('react');
  const useSettingsPanelStack = () => {
    const [stack, setStack] = useState<Array<{ screen: string; props?: any }>>(
      [],
    );
    const push = useCallback(
      (screen: string, props?: any) =>
        setStack((p: any) => [...p, { screen, props }]),
      [],
    );
    const pop = useCallback(
      () => setStack((p: any) => (p.length ? p.slice(0, -1) : p)),
      [],
    );
    const reset = useCallback(() => setStack([]), []);
    return {
      stack,
      push,
      pop,
      reset,
      current: stack.length ? stack[stack.length - 1] : null,
      canGoBack: stack.length > 0,
    };
  };
  return {
    useSettingsPanelStack,
    colors: {
      accent: { primary: '#f60' },
      background: { primary: '#000', card: '#111' },
      border: { default: '#333' },
      dialog: { overlay: '#0008' },
      text: { primary: '#fff', secondary: '#999', tertiary: '#666' },
      status: { error: '#f00', errorBackground: '#400' },
      sheet: { backdrop: '#0008' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    fontSize: { sm: 12, md: 14, lg: 16, xl: 18 },
    fontWeight: { regular: 400, semibold: 600 },
    letterSpacing: { wider: '0.05em' },
    shadowsCSS: { sheet: 'none', card: 'none' },
    opacity: { full: 1, half: 0.5 },
    componentSizes: { backButtonSize: 40, drawerWidth: 320 },
    durationMs: { fast: 150, normal: 300 },
  };
});

import { SettingsPanelStack } from './SettingsPanelStack';
import type { PanelRegistry } from './types';

const makeRegistry = (): PanelRegistry => ({
  accounts: () => <div data-testid="panel-accounts">A</div>,
  avatar: () => <div data-testid="panel-avatar">A</div>,
  security: () => <div data-testid="panel-security">A</div>,
  backup: () => <div data-testid="panel-backup">A</div>,
  privateKey: () => <div data-testid="panel-privateKey">A</div>,
  language: () => <div data-testid="panel-language">A</div>,
  currency: () => <div data-testid="panel-currency">A</div>,
  explorer: () => <div data-testid="panel-explorer">A</div>,
  addressBook: () => <div data-testid="panel-addressBook">A</div>,
  trustedApps: () => <div data-testid="panel-trustedApps">A</div>,
  about: () => <div data-testid="panel-about">A</div>,
  support: () => <div data-testid="panel-support">A</div>,
});

const renderStack = () =>
  render(
    <SettingsPanelStack
      visible
      onClose={vi.fn()}
      panelRegistry={makeRegistry()}
      developerNetworksEnabled={false}
      onDeveloperNetworksToggle={vi.fn()}
      onRemoveWallet={vi.fn()}
      onRemoveAllWallets={vi.fn()}
    />,
  );

describe('SettingsPanelStack — menu routing', () => {
  // Mocked t() returns the labelKey itself (no fallback in render path).
  const cases: Array<[string, string]> = [
    ['settings.currency', 'panel-currency'],
    ['settings.private_key', 'panel-privateKey'],
    ['settings.display_language', 'panel-language'],
    ['settings.explorer', 'panel-explorer'],
    ['settings.backup', 'panel-backup'],
    ['settings.profile_picture', 'panel-avatar'],
    ['settings.address_book', 'panel-addressBook'],
    ['settings.trusted_apps', 'panel-trustedApps'],
    ['settings.about', 'panel-about'],
    ['settings.help_support', 'panel-support'],
  ];

  it.each(cases)('clicking "%s" pushes %s', async (label, expectedTestId) => {
    renderStack();
    const btn = screen.getByRole('button', { name: label });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
    });
    const otherIds = cases
      .map(([, id]) => id)
      .filter((id) => id !== expectedTestId);
    for (const id of otherIds) {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
  });
});
