/**
 * Password validation utilities for Salmon Wallet
 *
 * Provides password strength checking and validation according to security best practices.
 */

// ============================================================================
// Constants
// ============================================================================

export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
} as const;

// ============================================================================
// Types
// ============================================================================

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordValidation {
  /** Whether the password meets minimum requirements */
  isValid: boolean;
  /** Password strength level */
  strength: PasswordStrength;
  /** Numeric score (0-5) for granular strength indication */
  score: number;
  /** Individual checks */
  checks: {
    hasMinLength: boolean;
    hasMaxLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Validates a password and returns its strength assessment
 *
 * @param password - The password to validate
 * @returns PasswordValidation object with strength and validity info
 *
 * @example
 * const result = validatePassword('MyP@ssw0rd');
 * console.log(result.strength); // 'strong'
 * console.log(result.isValid); // true
 */
export function validatePassword(password: string): PasswordValidation {
  const checks = {
    hasMinLength: password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH,
    hasMaxLength: password.length <= PASSWORD_CONSTRAINTS.MAX_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score (0-5)
  let score = 0;
  if (checks.hasMinLength && checks.hasMaxLength) score += 1;
  if (checks.hasUppercase) score += 1;
  if (checks.hasLowercase) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecialChar) score += 1;

  // Determine strength
  let strength: PasswordStrength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  // Password is valid if it meets length requirements
  const isValid = checks.hasMinLength && checks.hasMaxLength;

  return {
    isValid,
    strength,
    score,
    checks,
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
