import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { TokenSelectorToken, UseTokenSearchResult } from '../types/ui/token-selector';
import { filterTokensLocally } from '../utils/tokens';

// Re-export types for backward compatibility
export type { TokenSelectorToken, UseTokenSearchResult };

const PAGE_SIZE = 20;
const DEBOUNCE_DELAY = 300;
const MIN_SEARCH_LENGTH = 3;

/**
 * Hook for managing token search with debounce and pagination
 *
 * @param tokens - List of available tokens
 * @param onSearch - Optional async search function for external search
 * @returns Search state and controls
 */
export function useTokenSearch(
  tokens: TokenSelectorToken[],
  onSearch?: (query: string) => Promise<TokenSelectorToken[]>
): UseTokenSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenSelectorToken[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to track the latest search query for async operations
  const latestQueryRef = useRef(searchQuery);

  // Update ref when search query changes
  useEffect(() => {
    latestQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Local filtering for user's tokens
  const filteredTokens = useMemo(
    () => filterTokensLocally(tokens, searchQuery),
    [tokens, searchQuery]
  );

  // Async search with debounce
  useEffect(() => {
    // If no external search function or query is too short, clear results
    if (!onSearch || searchQuery.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await onSearch(searchQuery);

        // Only update if this is still the current query
        if (latestQueryRef.current === searchQuery) {
          setSearchResults(results || []);
        }
      } catch (error) {
        console.warn('Token search failed:', error);
        if (latestQueryRef.current === searchQuery) {
          setSearchResults([]);
        }
      } finally {
        if (latestQueryRef.current === searchQuery) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, onSearch]);

  // Determine which tokens to display
  const displayTokens = useMemo(() => {
    // If external search is available and query is long enough, use search results
    if (searchQuery.length >= MIN_SEARCH_LENGTH && onSearch) {
      return searchResults;
    }
    // Otherwise use locally filtered tokens
    return filteredTokens;
  }, [searchQuery, searchResults, filteredTokens, onSearch]);

  // Reset page when display tokens change
  useEffect(() => {
    setCurrentPage(1);
  }, [displayTokens]);

  // Paginated tokens
  const paginatedTokens = useMemo(() => {
    return displayTokens.slice(0, currentPage * PAGE_SIZE);
  }, [displayTokens, currentPage]);

  // Check if there are more tokens to load
  const hasMore = paginatedTokens.length < displayTokens.length;

  // Load more tokens
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore]);

  // Reset search state
  const reset = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    displayTokens,
    isSearching,
    paginatedTokens,
    hasMore,
    loadMore,
    reset,
  };
}

export default useTokenSearch;
