import { useCallback } from 'react';
import { useSearchContext, useBranchDataContext } from '../contexts/AppProviders.js';
import { useSearch } from './useSearch.js';
import { useBranchSelection } from './useBranchSelection.js';

export function useKeyboardHandler() {
  const { currentBranch } = useBranchDataContext();
  const { searchMode, setSearchInputActive } = useSearchContext();
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
        setSearchInputActive(false);
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
  }, [currentBranch, searchMode, setSearchInputActive, handleSearchInput, activateSearch, cycleFilter, toggleBranchSelection, handleNavigation]);

  return { handleKeyInput };
}
