import { useCallback } from 'react';
import { useSearchContext } from '../contexts/AppProviders.js';

interface UseSearchReturn {
  handleSearchInput: (input: string, key: any) => boolean;
  clearSearch: () => void;
  cycleFilter: () => void;
  activateSearch: () => void;
}

export function useSearch(): UseSearchReturn {
  const {
    searchMode,
    searchInputActive,
    clearSearch: clearSearchAction,
    setSearchInputActive,
    backspaceSearchQuery,
    setSearchQuery,
    appendSearchQuery,
    cycleFilter: cycleFilterAction,
    setSearchMode
  } = useSearchContext();

  const handleSearchInput = useCallback((input: string, key: any): boolean => {
    if (!searchMode) return false;

    if (key.escape) {
      clearSearchAction();
      return true;
    }

    // Re-activate search input if user presses / only when search input is not active
    if (input === '/' && !searchInputActive) {
      setSearchInputActive(true);
      return true;
    }

    // Handle search input only when search input is active
    if (searchInputActive) {
      if (key.backspace) {
        backspaceSearchQuery();
        return true;
      }

      if (key.delete) {
        setSearchQuery('');
        return true;
      }

      if (input && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow && input !== ' ') {
        appendSearchQuery(input);
        return true;
      }
    }

    return false;
  }, [searchMode, searchInputActive, clearSearchAction, setSearchInputActive, backspaceSearchQuery, setSearchQuery, appendSearchQuery]);

  const clearSearch = useCallback(() => {
    clearSearchAction();
  }, [clearSearchAction]);

  const cycleFilter = useCallback(() => {
    cycleFilterAction();
  }, [cycleFilterAction]);

  const activateSearch = useCallback(() => {
    setSearchMode(true);
    setSearchInputActive(true);
  }, [setSearchMode, setSearchInputActive]);

  return {
    handleSearchInput,
    clearSearch,
    cycleFilter,
    activateSearch,
  };
}
