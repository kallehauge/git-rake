import { useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext.js';
import { useSearch } from './useSearch.js';
import { useBranchSelection } from './useBranchSelection.js';

export function useKeyboardHandler() {
  const { currentBranch, searchMode, dispatch } = useAppState();
  const { handleSearchInput, activateSearch, cycleFilter } = useSearch();
  const { toggleBranchSelection, handleNavigation } = useBranchSelection();

  const handleKeyInput = useCallback((input: string, key: any): boolean => {
    // Allow Ctrl+C to pass through to parent components
    if (key.ctrl && input === 'c') {
      return false;
    }

    // Handle search input first (highest priority)
    if (handleSearchInput(input, key)) {
      return true;
    }

    // Handle navigation in search mode
    if (searchMode) {
      if (handleNavigation(key)) {
        dispatch({ type: 'SET_SEARCH_INPUT_ACTIVE', payload: false });
        return true;
      }
    }

    // Handle normal navigation
    if (handleNavigation(key)) {
      return true;
    }

    // Handle branch selection
    if (input === ' ' && currentBranch) {
      toggleBranchSelection(currentBranch);
      return true;
    }

    // Handle search mode activation
    if (input === '/') {
      activateSearch();
      return true;
    }

    // Handle filter cycling
    if (input === 'f') {
      cycleFilter();
      return true;
    }

    return false;
  }, [currentBranch, searchMode, dispatch, handleSearchInput, activateSearch, cycleFilter, toggleBranchSelection, handleNavigation]);

  return { handleKeyInput };
}
