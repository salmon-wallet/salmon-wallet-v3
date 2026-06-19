/**
 * Password validation utilities for Salmon Wallet
 *
 * Strength policy follows NIST SP 800-63B and the OWASP Authentication Cheat
 * Sheet: enforce a minimum length and reject weak/common/guessable passwords,
 * but do NOT impose character-composition rules (e.g. "must contain an
 * uppercase letter and a symbol"). Guessability is estimated offline with
 * zxcvbn, so no password (or hash) ever leaves the device.
 *
 * This matters because the entire mnemonic vault is encrypted with PBKDF2 over
 * this password — a weak password undermines the KDF regardless of iterations.
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommon from '@zxcvbn-ts/language-common';
import * as zxcvbnEn from '@zxcvbn-ts/language-en';

// ============================================================================
// Constants
// ============================================================================

export const PASSWORD_CONSTRAINTS = {
  /** NIST 800-63B floor for single-factor secrets is 15; 12 balances that with
   *  the UX of a frequently typed unlock password (biometrics + seed backstop). */
  MIN_LENGTH: 12,
  /** NIST recommends allowing at least 64 to support passphrases. */
  MAX_LENGTH: 128,
  /** Minimum zxcvbn score (0-4) accepted. 3 = "safely unguessable". */
  MIN_STRENGTH_SCORE: 3,
} as const;

// ============================================================================
// Types
// ============================================================================

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordValidation {
  /** Whether the password meets the enforced policy (length + guessability). */
  isValid: boolean;
  /** Password strength level, derived from the zxcvbn score. */
  strength: PasswordStrength;
  /** zxcvbn guessability score (0-4). */
  score: number;
  /** Composition info — shown for guidance only, NOT enforced (per NIST). */
  checks: {
    hasMinLength: boolean;
    hasMaxLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  /** Human-readable guidance from zxcvbn (warning + suggestions). */
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

// ============================================================================
// zxcvbn setup (offline dictionaries, configured once)
// ============================================================================

let zxcvbnConfigured = false;

function ensureZxcvbnConfigured(): void {
  if (zxcvbnConfigured) return;
  zxcvbnOptions.setOptions({
    dictionary: {
      ...zxcvbnCommon.dictionary,
      ...zxcvbnEn.dictionary,
    },
    graphs: zxcvbnCommon.adjacencyGraphs,
    translations: zxcvbnEn.translations,
  });
  zxcvbnConfigured = true;
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Validates a password and returns its strength assessment.
 *
 * @param password - The password to validate
 * @returns PasswordValidation object with strength and validity info
 *
 * @example
 * const result = validatePassword('correct horse battery staple');
 * console.log(result.strength); // 'strong'
 * console.log(result.isValid); // true
 */
export function validatePassword(password: string): PasswordValidation {
  ensureZxcvbnConfigured();

  const checks = {
    hasMinLength: password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH,
    hasMaxLength: password.length <= PASSWORD_CONSTRAINTS.MAX_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Estimate guessability offline. Empty input short-circuits to score 0 to
  // avoid running the estimator on every keystroke before anything is typed.
  const result = password.length > 0 ? zxcvbn(password) : null;
  const score = result?.score ?? 0;

  // Map the zxcvbn 0-4 score onto the existing strength enum for the UI bar.
  let strength: PasswordStrength = 'weak';
  if (score >= 3) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  // Enforced policy (NIST 800-63B): length window + not weak/common/guessable.
  // Composition (uppercase/number/symbol) is intentionally NOT part of the gate.
  const isValid =
    checks.hasMinLength &&
    checks.hasMaxLength &&
    score >= PASSWORD_CONSTRAINTS.MIN_STRENGTH_SCORE;

  return {
    isValid,
    strength,
    score,
    checks,
    feedback: {
      warning: result?.feedback.warning ?? '',
      suggestions: result?.feedback.suggestions ?? [],
    },
  };
}

/**
 * Gets the display label for a password strength level
 *
 * @param strength - The password strength level
 * @param t - Optional translation function (i18next)
 * @returns Localized strength label
 */
export function getPasswordStrengthLabel(
  strength: PasswordStrength,
  t?: (key: string) => string
): string {
  const labels: Record<PasswordStrength, string> = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  if (t) {
    const key = `password.strength.${strength}`;
    const translated = t(key);
    // Return translated if different from key (meaning translation exists)
    if (translated !== key) return translated;
  }

  return labels[strength];
}
