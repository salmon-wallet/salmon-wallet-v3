/**
 * @vitest-environment jsdom
 *
 * Regression guard for the DOM test-label contract: PrimaryButton must
 * forward `testID` to `data-testid` (Playwright's default selector) and
 * render an accessible button. These ids are referenced by the
 * apps/extension and apps/web Playwright suites.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mirror the repo convention: styled(Component)(styles) → the original
// Component, so the real MUI Button renders (it forwards data-testid and
// exposes role="button").
vi.mock('../../utils/styled', () => ({
  styled: (Component: React.ElementType) => () => Component,
}));

vi.mock('@salmon/shared', () => ({
  colors: { button: { primaryBackground: '#fff', primaryText: '#000', disabledOpacity: 0.5 } },
  componentSizes: { buttonMinWidth: 64, buttonHeight: 48, buttonRadius: 12 },
  fontFamily: { sans: 'sans-serif' },
  fontSize: { md: 16 },
  fontWeight: { bold: 700 },
  letterSpacing: { widest: '1px' },
  shadowsCSS: { none: 'none' },
  opacity: { soft: 0.8 },
  duration: { normal: '200ms', fastest: '80ms' },
  easing: { ease: 'ease' },
}));

import { PrimaryButton } from './PrimaryButton';

describe('PrimaryButton (DOM test-label contract)', () => {
  it('forwards testID to data-testid and exposes an accessible button', () => {
    render(
      <PrimaryButton testID="lock-unlock-button" onClick={() => {}}>
        Unlock
      </PrimaryButton>
    );

    const byTestId = screen.getByTestId('lock-unlock-button');
    const byRole = screen.getByRole('button', { name: 'Unlock' });
    expect(byTestId).toBe(byRole);
  });

  it('omits data-testid when no testID is provided', () => {
    render(<PrimaryButton onClick={() => {}}>Submit</PrimaryButton>);

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button.getAttribute('data-testid')).toBeNull();
  });
});
