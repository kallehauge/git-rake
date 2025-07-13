import { useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext.js';

interface UseSearchReturn {
  handleSearchInput: (input: string, key: any) => boolean;
  clearSearch: () => void;
  cycleFilter: () => void;
  activateSearch: () => void;
}

export function useSearch(): UseSearchReturn {
  const { searchMode, searchInputActive, dispatch } = useAppState();

  const handleSearchInput = useCallback((input: string, key: any): boolean => {
    if (!searchMode) return false;

    if (key.escape) {
      dispatch({ type: 'CLEAR_SEARCH' });
      return true;
    }

    // Re-activate search input if user presses / only when search input is not active
    if (input === '/' && !searchInputActive) {
      dispatch({ type: 'SET_SEARCH_INPUT_ACTIVE', payload: true });
      return true;
    }

    // Handle search input only when search input is active
    if (searchInputActive) {
      if (key.backspace) {
        dispatch({ type: 'BACKSPACE_SEARCH_QUERY' });
        return true;
      }

      if (key.delete) {
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
        return true;
      }

      if (input && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow && input !== ' ') {
        dispatch({ type: 'APPEND_SEARCH_QUERY', payload: input });
        return true;
      }
    }

    return false;
  }, [searchMode, searchInputActive, dispatch]);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, [dispatch]);

  const cycleFilter = useCallback(() => {
    dispatch({ type: 'CYCLE_FILTER' });
  }, [dispatch]);

  const activateSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_MODE', payload: true });
    dispatch({ type: 'SET_SEARCH_INPUT_ACTIVE', payload: true });
  }, [dispatch]);

  return {
    handleSearchInput,
    clearSearch,
    cycleFilter,
    activateSearch,
  };
}
