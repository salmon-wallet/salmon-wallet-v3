/**
 * @vitest-environment jsdom
 * Tests for useLanguage hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguage } from './useLanguage';
import * as storage from '../storage';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../storage', () => ({
  getStorage: vi.fn(),
  STORAGE_KEYS: {
    SETTINGS: 'salmon_settings',
    LANGUAGE: 'salmon_language',
    CONTACTS: 'salmon_contacts',
  },
}));

vi.mock('../locales', () => ({
  AVAILABLE_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
  DEFAULT_LANGUAGE: 'en',
  LANGUAGE_NAMES: {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// ============================================================================
// Tests
// ============================================================================

describe('useLanguage Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getStorage as any).mockReturnValue(mockStorage);
    mockStorage.getItem.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default language when no stored preference', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.language).toBe('en');
      expect(result.current.languageName).toBe('English');
    });

    it('should load saved language from storage', async () => {
      mockStorage.getItem.mockResolvedValue('es');

      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.language).toBe('es');
      expect(result.current.languageName).toBe('Español');
    });

    it('should fallback to default for invalid saved language', async () => {
      mockStorage.getItem.mockResolvedValue('invalid-lang');

      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.language).toBe('en');
      expect(mockStorage.setItem).toHaveBeenCalledWith('salmon_language', 'en');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.language).toBe('en');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Language Management', () => {
    it('should change language successfully', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('fr');
      });

      expect(result.current.language).toBe('fr');
      expect(result.current.languageName).toBe('Français');
      expect(mockStorage.setItem).toHaveBeenCalledWith('salmon_language', 'fr');
    });

    it('should persist language change to storage', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('ja');
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('salmon_language', 'ja');
    });

    it('should reject invalid language codes', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('invalid' as any);
      });

      expect(result.current.language).toBe('en');
      expect(mockStorage.setItem).not.toHaveBeenCalledWith('salmon_language', 'invalid');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle storage errors during change', async () => {
      mockStorage.setItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('de');
      });

      expect(result.current.language).toBe('de');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Available Languages', () => {
    it('should provide list of available languages', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableLanguages).toEqual([
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'
      ]);
    });

    it('should provide language names map', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.languageNames).toHaveProperty('en', 'English');
      expect(result.current.languageNames).toHaveProperty('es', 'Español');
      expect(result.current.languageNames).toHaveProperty('zh', '中文');
    });
  });

  describe('Loading State', () => {
    it('should set isLoading to true during initialization', () => {
      mockStorage.getItem.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      const { result } = renderHook(() => useLanguage());

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after initialization', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoading to false even on error', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Multiple Language Changes', () => {
    it('should handle rapid language changes', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
        await result.current.changeLanguage('fr');
        await result.current.changeLanguage('de');
      });

      expect(result.current.language).toBe('de');
    });

    it('should persist each language change', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('salmon_language', 'es');

      await act(async () => {
        await result.current.changeLanguage('ja');
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('salmon_language', 'ja');
    });
  });

  describe('Language Name Display', () => {
    it('should update languageName when language changes', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.languageName).toBe('English');

      await act(async () => {
        await result.current.changeLanguage('ko');
      });

      expect(result.current.languageName).toBe('한국어');
    });

    it('should provide correct language names for all supported languages', async () => {
      const { result } = renderHook(() => useLanguage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const testCases = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'zh', name: '中文' },
      ];

      for (const { code, name } of testCases) {
        await act(async () => {
          await result.current.changeLanguage(code as any);
        });

        expect(result.current.languageName).toBe(name);
      }
    });
  });
});
