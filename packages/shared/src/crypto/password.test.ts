import { describe, expect, test } from 'vitest';
import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordIssue,
  PASSWORD_CONSTRAINTS,
} from './password';

describe('validatePassword (NIST 800-63B aligned)', () => {
  test('rejects passwords shorter than the minimum length', () => {
    // Arrange
    const short = 'aB3$xY'; // 6 chars, well-formed but too short

    // Act
    const result = validatePassword(short);

    // Assert
    expect(result.checks.hasMinLength).toBe(false);
    expect(result.isValid).toBe(false);
  });

  test('rejects a long-enough but common/guessable password', () => {
    // Arrange — meets the 12-char length but is a top common password
    const common = 'password1234';

    // Act
    const result = validatePassword(common);

    // Assert
    expect(common.length).toBeGreaterThanOrEqual(PASSWORD_CONSTRAINTS.MIN_LENGTH);
    expect(result.score).toBeLessThan(PASSWORD_CONSTRAINTS.MIN_STRENGTH_SCORE);
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe('weak');
  });

  test('accepts a high-entropy passphrase with no composition variety', () => {
    // Arrange — all lowercase, no number/symbol/uppercase/space, but unguessable.
    // Proves composition rules are NOT enforced (NIST: SHALL NOT impose).
    const passphrase = 'correcthorsebatterystaple';

    // Act
    const result = validatePassword(passphrase);

    // Assert
    expect(result.checks.hasUppercase).toBe(false);
    expect(result.checks.hasNumber).toBe(false);
    expect(result.checks.hasSpecialChar).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(PASSWORD_CONSTRAINTS.MIN_STRENGTH_SCORE);
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  test('rejects a password over the maximum length', () => {
    // Arrange
    const tooLong = 'a'.repeat(PASSWORD_CONSTRAINTS.MAX_LENGTH + 1);

    // Act
    const result = validatePassword(tooLong);

    // Assert
    expect(result.checks.hasMaxLength).toBe(false);
    expect(result.isValid).toBe(false);
  });

  test('caps strength at weak when below minimum length, even with mixed chars', () => {
    // Arrange — 9 chars with upper/lower/symbol that could look "strong",
    // but it fails the length policy. Strength must not contradict that.
    const shortMixed = 'Lucaluca!';

    // Act
    const result = validatePassword(shortMixed);

    // Assert
    expect(result.checks.hasMinLength).toBe(false);
    expect(result.strength).toBe('weak');
    expect(result.isValid).toBe(false);
  });

  test('returns score 0 and weak strength for empty input', () => {
    // Act
    const result = validatePassword('');

    // Assert
    expect(result.score).toBe(0);
    expect(result.strength).toBe('weak');
    expect(result.isValid).toBe(false);
  });

  test('surfaces zxcvbn feedback for weak passwords', () => {
    // Act
    const result = validatePassword('qwerty123456');

    // Assert — a guessable password should carry actionable guidance
    const hasGuidance =
      result.feedback.warning.length > 0 || result.feedback.suggestions.length > 0;
    expect(hasGuidance).toBe(true);
  });
});

describe('getPasswordIssue', () => {
  test('too_short when below the minimum length', () => {
    expect(getPasswordIssue(validatePassword('Lucaluca!'))).toBe('too_short');
  });

  test('too_weak when long enough but guessable', () => {
    // 12 chars (meets length) but trivially guessable → not too_short, too_weak
    expect(getPasswordIssue(validatePassword('aaaaaaaaaaaa'))).toBe('too_weak');
  });

  test('null when the password passes the policy', () => {
    expect(getPasswordIssue(validatePassword('correcthorsebatterystaple'))).toBeNull();
  });
});

describe('getPasswordStrengthLabel', () => {
  test('returns the default English label when no translator is given', () => {
    expect(getPasswordStrengthLabel('strong')).toBe('Strong');
    expect(getPasswordStrengthLabel('medium')).toBe('Medium');
    expect(getPasswordStrengthLabel('weak')).toBe('Weak');
  });

  test('uses the translation when the key resolves', () => {
    // Arrange
    const t = (key: string) => (key === 'password.strength.strong' ? 'Fuerte' : key);

    // Act / Assert
    expect(getPasswordStrengthLabel('strong', t)).toBe('Fuerte');
  });
});
