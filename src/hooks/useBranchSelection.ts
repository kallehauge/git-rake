import { useCallback } from 'react';
import { GitBranch } from '../types/index.js';
import { useAppState } from '../contexts/AppStateContext.js';

interface UseBranchSelectionReturn {
  toggleBranchSelection: (branch: GitBranch) => void;
  clearSelection: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  handleNavigation: (key: any) => boolean;
}

export function useBranchSelection(): UseBranchSelectionReturn {
  const { dispatch } = useAppState();

  const toggleBranchSelection = useCallback((branch: GitBranch) => {
    if (branch.isCurrent) return;
    dispatch({ type: 'TOGGLE_BRANCH_SELECTION', payload: branch.name });
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  const navigateUp = useCallback(() => {
    dispatch({ type: 'NAVIGATE_UP' });
  }, [dispatch]);

  const navigateDown = useCallback(() => {
    dispatch({ type: 'NAVIGATE_DOWN' });
  }, [dispatch]);

  const handleNavigation = useCallback((key: any): boolean => {
    if (key.upArrow) {
      dispatch({ type: 'NAVIGATE_UP' });
      return true;
    }

    if (key.downArrow) {
      dispatch({ type: 'NAVIGATE_DOWN' });
      return true;
    }

    return false;
  }, [dispatch]);

  return {
    toggleBranchSelection,
    clearSelection,
    navigateUp,
    navigateDown,
    handleNavigation,
  };
}
